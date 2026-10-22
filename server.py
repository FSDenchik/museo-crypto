"""Static site and anonymous quiz analytics API. No third-party dependencies."""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import threading
import time
from contextlib import contextmanager
from datetime import datetime, timezone
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("DATABASE_PATH", ROOT / "data" / "analytics.sqlite3"))
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "123")
SESSION_SECRET = secrets.token_bytes(32)
SESSION_TTL = 8 * 60 * 60
MAX_SCORES = (2, 2, 2, 2, 2, 6, 2, 2, 2)
PROFILES = ("Нужна цифровая прокачка", "Осмотрительный пользователь",
            "Уверенный пользователь", "Киберзнаток")
CATEGORIES = (
    ("Пароли", (3,)), ("Фишинг", (4, 5)), ("Wi-Fi", (1,)),
    ("Приватность", (9,)), ("Устройства", (2, 8)), ("Финансы", (6, 7)),
)
QUESTIONS = (
    "Подключение к Wi-Fi", "Неизвестная USB-флешка", "Надёжный пароль",
    "Подозрительное сообщение", "Фишинговая ссылка", "Банковская операция",
    "Просьба перевести деньги", "Безопасность устройства", "Личные данные",
)
LOCK = threading.Lock()
FAILED_LOGINS: dict[str, list[float]] = {}


@contextmanager
def connect():
    db = sqlite3.connect(DB_PATH, timeout=10)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA busy_timeout=10000")
    try:
        with db:
            yield db
    finally:
        db.close()


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with connect() as db:
        db.execute("PRAGMA journal_mode=WAL")
        db.execute("""CREATE TABLE IF NOT EXISTS attempts (
            id TEXT PRIMARY KEY,
            started_at TEXT NOT NULL,
            completed_at TEXT NOT NULL,
            received_at TEXT NOT NULL,
            duration_seconds INTEGER NOT NULL,
            score INTEGER NOT NULL,
            profile TEXT NOT NULL,
            scores_json TEXT NOT NULL
        )""")
        db.execute("CREATE INDEX IF NOT EXISTS attempts_date ON attempts(completed_at)")


def profile_for(score):
    return PROFILES[0 if score <= 8 else 1 if score <= 14 else 2 if score <= 18 else 3]


def parse_attempt(data):
    if not isinstance(data, dict) or len(json.dumps(data)) > 3000:
        raise ValueError("Недопустимый формат")
    uid = data.get("id")
    if not isinstance(uid, str) or len(uid) != 36 or any(
        c not in "0123456789abcdef-" for c in uid.lower()
    ):
        raise ValueError("Неверный идентификатор")
    scores = data.get("scores")
    if not isinstance(scores, dict) or set(scores) != {str(i) for i in range(1, 10)}:
        raise ValueError("Ожидаются баллы по девяти вопросам")
    clean = {}
    for i, maximum in enumerate(MAX_SCORES, 1):
        value = scores[str(i)]
        if type(value) is not int or not 0 <= value <= maximum:
            raise ValueError("Неверный балл")
        clean[str(i)] = value
    try:
        start = datetime.fromisoformat(data["startedAt"].replace("Z", "+00:00"))
        end = datetime.fromisoformat(data["completedAt"].replace("Z", "+00:00"))
        if start.tzinfo is None or end.tzinfo is None:
            raise ValueError()
        duration = int((end - start).total_seconds())
        if duration < 0 or duration > 24 * 60 * 60 or end.timestamp() > time.time() + 300:
            raise ValueError()
    except (KeyError, AttributeError, TypeError, ValueError):
        raise ValueError("Неверное время прохождения") from None
    return uid, start.isoformat(), end.isoformat(), duration, sum(clean.values()), clean


def save_attempt(data):
    uid, start, end, duration, score, scores = parse_attempt(data)
    with connect() as db:
        cursor = db.execute(
            """INSERT OR IGNORE INTO attempts
               (id, started_at, completed_at, received_at, duration_seconds,
                score, profile, scores_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (uid, start, end, datetime.now(timezone.utc).isoformat(), duration,
             score, profile_for(score), json.dumps(scores, separators=(",", ":"))),
        )
        return cursor.rowcount == 1


def date_bound(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date().isoformat()
    except ValueError:
        raise ValueError("Дата должна быть в формате YYYY-MM-DD") from None


def statistics(query):
    start = date_bound(query.get("from", [""])[0])
    end = date_bound(query.get("to", [""])[0])
    if start and end and start > end:
        raise ValueError("Начальная дата позже конечной")
    where, params = [], []
    if start:
        where.append("substr(completed_at, 1, 10) >= ?")
        params.append(start)
    if end:
        where.append("substr(completed_at, 1, 10) <= ?")
        params.append(end)
    clause = " WHERE " + " AND ".join(where) if where else ""
    with connect() as db:
        records = db.execute(
            "SELECT * FROM attempts" + clause + " ORDER BY completed_at DESC", params
        ).fetchall()
    attempts = []
    daily = {}
    category_totals = [0] * len(CATEGORIES)
    errors = [0] * 9
    profiles = {profile: 0 for profile in PROFILES}
    for record in records:
        scores = json.loads(record["scores_json"])
        categories = {}
        for ci, (label, questions) in enumerate(CATEGORIES):
            maximum = sum(MAX_SCORES[q - 1] for q in questions)
            percentage = round(100 * sum(scores[str(q)] for q in questions) / maximum)
            categories[label] = percentage
            category_totals[ci] += percentage
        for i, maximum in enumerate(MAX_SCORES, 1):
            if scores[str(i)] < maximum:
                errors[i - 1] += 1
        profile = record["profile"]
        profiles[profile] += 1
        day = record["completed_at"][:10]
        slot = daily.setdefault(day, {"date": day, "count": 0, "scoreTotal": 0})
        slot["count"] += 1
        slot["scoreTotal"] += record["score"]
        attempts.append({
            "id": record["id"][:8], "completedAt": record["completed_at"],
            "durationSeconds": record["duration_seconds"], "score": record["score"],
            "profile": profile, "categories": categories,
        })
    count = len(records)
    return {
        "total": count,
        "users": count,  # Anonymous attempts; unique people cannot be identified.
        "averageScore": round(sum(r["score"] for r in records) / count, 1) if count else 0,
        "averageDurationSeconds": round(sum(r["duration_seconds"] for r in records) / count) if count else 0,
        "totalDurationSeconds": sum(r["duration_seconds"] for r in records),
        "latestAt": records[0]["completed_at"] if count else None,
        "daily": [
            {"date": day, "count": item["count"],
             "averageScore": round(item["scoreTotal"] / item["count"], 1)}
            for day, item in sorted(daily.items())
        ],
        "profiles": profiles,
        "categories": {label: round(category_totals[i] / count) if count else 0
                       for i, (label, _) in enumerate(CATEGORIES)},
        "errors": sorted(
            [{"number": i, "question": QUESTIONS[i - 1],
              "count": errors[i - 1], "percent": round(100 * errors[i - 1] / count) if count else 0}
             for i in range(1, 10)], key=lambda item: (-item["count"], item["number"])
        )[:2] if count else [],
        "attempts": attempts,
    }


def sign(expiry):
    message = str(expiry).encode()
    return str(expiry) + "." + hmac.new(SESSION_SECRET, message, hashlib.sha256).hexdigest()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def json_response(self, status, data, cookie=None):
        raw = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        if cookie:
            self.send_header("Set-Cookie", cookie)
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def authenticated(self):
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get("Cookie", ""))
            value = cookie["museo_admin"].value
            expiry, _ = value.split(".", 1)
            return int(expiry) > time.time() and hmac.compare_digest(value, sign(expiry))
        except (KeyError, ValueError):
            return False

    def read_json(self):
        try:
            size = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            size = 0
        if not 0 < size <= 4096:
            raise ValueError("Неверный размер запроса")
        if "application/json" not in self.headers.get("Content-Type", ""):
            raise ValueError("Ожидается JSON")
        try:
            return json.loads(self.rfile.read(size))
        except (UnicodeDecodeError, json.JSONDecodeError):
            raise ValueError("Неверный JSON") from None

    def same_origin(self):
        origin = self.headers.get("Origin")
        if not origin:
            return True
        parsed = urlsplit(origin)
        return parsed.netloc == self.headers.get("Host") and parsed.scheme in ("http", "https")

    def static_allowed(self):
        decoded = unquote(urlsplit(self.path).path)
        if "\\" in decoded or "\0" in decoded:
            return False
        parts = decoded.split("/")
        if decoded == "/":
            return True
        if parts[0] or any(not part or part.startswith(".") for part in parts[1:]):
            return False
        if decoded in ("/index.html", "/admin.html"):
            return True
        return len(parts) >= 3 and parts[1] in ("css", "script", "images", "fonts")

    def end_headers(self):
        if urlsplit(self.path).path == "/admin.html":
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_POST(self):
        path = urlsplit(self.path).path
        if not path.startswith("/api/"):
            return self.json_response(HTTPStatus.NOT_FOUND, {"error": "Не найдено"})
        if not self.same_origin():
            return self.json_response(HTTPStatus.FORBIDDEN, {"error": "Недопустимый источник"})
        try:
            data = self.read_json()
            if path == "/api/attempts":
                created = save_attempt(data)
                return self.json_response(HTTPStatus.CREATED if created else HTTPStatus.OK,
                                          {"saved": True, "duplicate": not created})
            if path == "/api/admin/login":
                client = self.client_address[0]
                now = time.time()
                with LOCK:
                    recent = [t for t in FAILED_LOGINS.get(client, []) if t > now - 900]
                    if len(recent) >= 5:
                        FAILED_LOGINS[client] = recent
                        return self.json_response(HTTPStatus.TOO_MANY_REQUESTS,
                                                  {"error": "Слишком много попыток. Повторите через 15 минут."})
                    valid = isinstance(data, dict) and isinstance(data.get("password"), str) and \
                        hmac.compare_digest(data["password"], ADMIN_PASSWORD)
                    FAILED_LOGINS[client] = [] if valid else recent + [now]
                if not valid:
                    return self.json_response(HTTPStatus.UNAUTHORIZED, {"error": "Неверный пароль"})
                secure = "; Secure" if self.headers.get("X-Forwarded-Proto") == "https" else ""
                cookie = f"museo_admin={sign(int(now + SESSION_TTL))}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age={SESSION_TTL}{secure}"
                return self.json_response(HTTPStatus.OK, {"ok": True}, cookie)
            if path == "/api/admin/logout":
                return self.json_response(HTTPStatus.OK, {"ok": True},
                                          "museo_admin=; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=0")
            return self.json_response(HTTPStatus.NOT_FOUND, {"error": "Не найдено"})
        except ValueError as error:
            return self.json_response(HTTPStatus.BAD_REQUEST, {"error": str(error)})
        except sqlite3.Error:
            self.log_error("Database error")
            return self.json_response(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "Ошибка хранилища"})

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == "/healthz":
            return self.json_response(HTTPStatus.OK, {"ok": True})
        if path == "/api/admin/stats":
            if not self.authenticated():
                return self.json_response(HTTPStatus.UNAUTHORIZED, {"error": "Требуется вход"})
            try:
                return self.json_response(HTTPStatus.OK, statistics(parse_qs(urlsplit(self.path).query)))
            except ValueError as error:
                return self.json_response(HTTPStatus.BAD_REQUEST, {"error": str(error)})
        if path.startswith("/api/"):
            return self.json_response(HTTPStatus.NOT_FOUND, {"error": "Не найдено"})
        if not self.static_allowed():
            return self.send_error(HTTPStatus.NOT_FOUND, "Not found")
        super().do_GET()

    def do_HEAD(self):
        if not self.static_allowed():
            return self.send_error(HTTPStatus.NOT_FOUND, "Not found")
        super().do_HEAD()


def serve():
    init_db()
    port = int(os.environ.get("PORT", "8080"))
    httpd = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"Museo analytics serving on :{port}", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    serve()
