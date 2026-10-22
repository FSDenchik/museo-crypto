import importlib.util
import json
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone
from http.server import ThreadingHTTPServer
from pathlib import Path

SOURCE = Path(__file__).resolve().parent / "server.py"
spec = importlib.util.spec_from_file_location("museo_server", SOURCE)
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)


class AnalyticsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        server.DB_PATH = Path(cls.temp.name) / "analytics.sqlite3"
        server.init_db()
        cls.httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        cls.base = f"http://127.0.0.1:{cls.httpd.server_port}"
        cls.worker = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.worker.start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.temp.cleanup()

    def request(self, path, payload=None, cookie=None):
        data = json.dumps(payload).encode() if payload is not None else None
        headers = {"Content-Type": "application/json"} if data else {}
        if cookie:
            headers["Cookie"] = cookie
        req = urllib.request.Request(self.base + path, data, headers,
                                     method="POST" if data else "GET")
        try:
            response = urllib.request.urlopen(req)
        except urllib.error.HTTPError as error:
            response = error
        return response.status, json.load(response), response.headers

    def test_01_empty_auth_and_attempt_lifecycle(self):
        status, _, _ = self.request("/api/admin/stats")
        self.assertEqual(status, 401)
        status, _, _ = self.request("/api/admin/login", {"password": "wrong"})
        self.assertEqual(status, 401)
        status, _, headers = self.request("/api/admin/login", {"password": "123"})
        self.assertEqual(status, 200)
        cookie = headers["Set-Cookie"].split(";", 1)[0]
        status, stats, _ = self.request("/api/admin/stats", cookie=cookie)
        self.assertEqual((status, stats["total"]), (200, 0))

        end = datetime.now(timezone.utc)
        attempt = {
            "id": str(uuid.uuid4()),
            "startedAt": (end - timedelta(minutes=7)).isoformat(),
            "completedAt": end.isoformat(),
            "scores": {str(i): maximum for i, maximum in enumerate(server.MAX_SCORES, 1)}
        }
        status, response, _ = self.request("/api/attempts", attempt)
        self.assertEqual((status, response["saved"]), (201, True))
        status, response, _ = self.request("/api/attempts", attempt)
        self.assertEqual((status, response["duplicate"]), (200, True))
        status, stats, _ = self.request("/api/admin/stats", cookie=cookie)
        self.assertEqual((status, stats["total"], stats["averageScore"]), (200, 1, 22))
        self.assertEqual(stats["attempts"][0]["profile"], "Киберзнаток")
        self.assertEqual(stats["averageDurationSeconds"], 420)
        self.assertEqual(stats["categories"]["Пароли"], 100)
        self.assertEqual(stats["daily"][0]["count"], 1)
        status, filtered, _ = self.request("/api/admin/stats?from=1999-01-01&to=1999-12-31", cookie=cookie)
        self.assertEqual((status, filtered["total"]), (200, 0))

        invalid = dict(attempt, id=str(uuid.uuid4()), scores=dict(attempt["scores"], **{"6": 99}))
        status, _, _ = self.request("/api/attempts", invalid)
        self.assertEqual(status, 400)
        invalid_time = dict(attempt, id=str(uuid.uuid4()), completedAt="2099-01-01T00:00:00+00:00")
        status, _, _ = self.request("/api/attempts", invalid_time)
        self.assertEqual(status, 400)
        with server.connect() as db:
            self.assertEqual(db.execute("SELECT count(*) FROM attempts").fetchone()[0], 1)

    def test_02_static_files_do_not_expose_configuration(self):
        for path in ("/server.py", "/.env", "/%2eenv", "/images/../server.py",
                     "/data/analytics.sqlite3", "/Dockerfile"):
            with self.subTest(path=path):
                with self.assertRaises(urllib.error.HTTPError) as result:
                    urllib.request.urlopen(self.base + path)
                self.assertEqual(result.exception.code, 404)
        self.assertEqual(urllib.request.urlopen(self.base + "/admin.html").status, 200)
        self.assertEqual(urllib.request.urlopen(self.base + "/script/admin.js").status, 200)


if __name__ == "__main__":
    unittest.main()
