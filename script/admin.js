(() => {
  'use strict';
  const app = document.getElementById('admin-app');
  const categoryNames = ['Пароли', 'Фишинг', 'Wi-Fi', 'Приватность', 'Устройства', 'Финансы'];
  const profileNames = ['Нужна цифровая прокачка', 'Осмотрительный пользователь',
    'Уверенный пользователь', 'Киберзнаток'];
  const state = { stats: null, page: 0, from: '', to: '' };
  const theme = new URLSearchParams(location.search).get('theme');
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;

  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const formatDate = value => value ? new Date(value).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '—';
  const formatDuration = seconds => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}м ${String(seconds % 60).padStart(2, '0')}с`;
  };
  const css = key => getComputedStyle(document.documentElement).getPropertyValue(key).trim();

  async function getStats() {
    const query = new URLSearchParams();
    if (state.from) query.set('from', state.from);
    if (state.to) query.set('to', state.to);
    const response = await fetch('/api/admin/stats?' + query, {
      credentials: 'same-origin', cache: 'no-store'
    });
    if (response.status === 401) return null;
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Не удалось загрузить статистику');
    return data;
  }

  async function boot() {
    try {
      let data = await getStats();
      if (!data) {
        alert('Админ-панель защищена паролем.');
        while (!data) {
          const password = prompt('Введите пароль:');
          if (password === null) return;
          const response = await fetch('/api/admin/login', {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
          });
          if (!response.ok) {
            const error = await response.json();
            alert(error.error || 'Неверный пароль');
            if (response.status === 429) return;
            continue;
          }
          data = await getStats();
        }
      }
      app.style.display = 'block';
      app.setAttribute('aria-hidden', 'false');
      update(data);
    } catch (error) {
      alert('Не удалось связаться с сервером статистики. Откройте страницу через сервер проекта.');
    }
  }

  function update(data) {
    state.stats = data;
    state.page = 0;
    const cards = document.querySelectorAll('.stat-card');
    const values = [data.total, data.users, `${data.averageScore}/22`,
      formatDuration(data.averageDurationSeconds)];
    const notes = [
      `Последнее: ${formatDate(data.latestAt)}`,
      'анонимные сессии, без персональных данных',
      'мин 0 | макс 22',
      `всего ${Math.round(data.totalDurationSeconds / 60)} мин`
    ];
    cards.forEach((card, i) => {
      card.querySelector('.stat-value').textContent = values[i];
      card.querySelector('.stat-note').textContent = notes[i];
    });
    document.querySelector('.results-title strong').textContent = data.total;
    document.querySelector('.date-control span').textContent = state.from || state.to
      ? `${state.from || 'начало'} — ${state.to || 'сегодня'}` : 'Весь период';
    renderErrors();
    renderRows();
    drawAll();
  }

  function tags(categories) {
    return categoryNames.map(name => `<span class="tag">${escape(name)} ${categories[name] ?? 0}%</span>`).join('');
  }

  function renderRows() {
    const attempts = state.stats.attempts;
    const pages = Math.max(1, Math.ceil(attempts.length / 10));
    state.page = Math.min(state.page, pages - 1);
    const rows = attempts.slice(state.page * 10, state.page * 10 + 10);
    document.getElementById('results-body').innerHTML = rows.map(row => `<tr>
      <td>⌄&nbsp; ${escape(row.id)}</td><td>${escape(formatDate(row.completedAt))}</td>
      <td>${escape(formatDuration(row.durationSeconds))}</td><td>${row.score}/22</td>
      <td>${escape(row.profile)}</td><td><div class="category-tags">${tags(row.categories)}</div></td>
    </tr>`).join('') || '<tr><td colspan="6">За выбранный период прохождений нет</td></tr>';
    document.getElementById('mobile-results').innerHTML = rows.slice(0, 5).map(row => `
      <article class="mobile-result-card"><div class="mobile-result-grid">
        <div><span class="mobile-result-label">Прохождение</span><span class="mobile-result-value">◉ ${escape(row.id)}</span></div>
        <div><span class="mobile-result-label">Длительность</span><span class="mobile-result-value">◴ ${escape(formatDuration(row.durationSeconds))}</span></div>
        <div><span class="mobile-result-label">Дата и время</span><span class="mobile-result-value">▣ ${escape(formatDate(row.completedAt))}</span></div>
        <div><span class="mobile-result-label">Индекс</span><span class="mobile-result-value">▧ ${row.score}/22</span></div>
        <div class="mobile-result-profile"><span class="mobile-result-label">Профиль</span>
          <span class="mobile-result-value">⌂ ${escape(row.profile)}</span></div>
        <div class="mobile-tags">${tags(row.categories)}</div>
      </div></article>`).join('');
    document.querySelector('.pagination > span').textContent = `Стр. ${state.page + 1} из ${pages}`;
    document.querySelectorAll('.pagination-actions span').forEach((element, i) => {
      element.style.opacity = (i === 0 ? state.page === 0 : state.page >= pages - 1) ? '.35' : '1';
    });
  }

  function renderErrors() {
    const section = document.querySelector('.errors-panel .section-content');
    section.querySelectorAll('.error-row').forEach(node => node.remove());
    const more = section.querySelector('.error-more');
    if (!state.stats.errors.length) {
      more.textContent = 'Ошибки появятся после первых прохождений';
      return;
    }
    more.textContent = 'Вопросы с наибольшей долей неполных баллов';
    state.stats.errors.forEach(item => {
      const article = document.createElement('article');
      article.className = 'error-row';
      article.innerHTML = `<div class="error-meta"><strong class="error-title">${String(item.number).padStart(2, '0')} вопрос</strong>
        <span class="error-rate">${item.percent}% ошибок</span></div>
        <p class="error-question">${escape(item.question)}</p>
        <div class="answer">${item.count} из ${state.stats.total} прохождений получили неполный балл</div>`;
      section.insertBefore(article, more);
    });
  }

  function canvasContext(id) {
    const canvas = document.getElementById(id);
    const { width, height } = canvas.getBoundingClientRect();
    const dpr = devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.font = '11px Inter';
    ctx.fillStyle = css('--text');
    ctx.strokeStyle = css('--border');
    ctx.lineWidth = 1;
    return { ctx, width, height };
  }

  function axes(ctx, left, top, right, bottom) {
    ctx.beginPath();
    ctx.moveTo(left, top); ctx.lineTo(left, bottom); ctx.lineTo(right, bottom);
    ctx.stroke();
  }

  function drawLine() {
    const { ctx, width, height } = canvasContext('line-chart');
    const left = 32, right = width - 8, top = 16, bottom = height - 28;
    axes(ctx, left, top, right, bottom);
    const days = state.stats.daily;
    const max = Math.max(5, ...days.map(day => day.count));
    for (let i = 0; i <= 4; i++) ctx.fillText(String(Math.round(max * i / 4)), 0, bottom - (bottom - top) * i / 4 + 3);
    if (!days.length) return;
    const points = days.slice(-15);
    ctx.strokeStyle = css('--accent');
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((day, i) => {
      const x = left + (right - left) * (points.length === 1 ? .5 : i / (points.length - 1));
      const y = bottom - (bottom - top) * day.count / max;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = css('--text');
    points.forEach((day, i) => {
      if (i % Math.max(1, Math.ceil(points.length / 5)) === 0 || i === points.length - 1)
        ctx.fillText(day.date.slice(5).split('-').reverse().join('.'),
          left + (right - left) * (points.length === 1 ? .5 : i / (points.length - 1)) - 13, height - 8);
    });
  }

  function drawBars() {
    const { ctx, width, height } = canvasContext('profile-chart');
    const left = 32, right = width - 8, top = 14, bottom = height - 35;
    axes(ctx, left, top, right, bottom);
    const max = Math.max(1, ...Object.values(state.stats.profiles));
    const colors = ['#cbd5ee', '#c4e5ed', '#aeb0b5', css('--accent')];
    profileNames.forEach((name, i) => {
      const x = left + (i + .5) * (right - left) / 4;
      const barWidth = Math.min(50, (right - left) / 8);
      const barHeight = (bottom - top) * (state.stats.profiles[name] || 0) / max;
      ctx.fillStyle = colors[i];
      ctx.fillRect(x - barWidth / 2, bottom - barHeight, barWidth, barHeight);
      if (width >= 500) {
        ctx.fillStyle = css('--text');
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(name.split(' ')[0], x, height - 10);
        ctx.textAlign = 'left';
      }
    });
    ctx.fillStyle = css('--text');
    ctx.fillText(String(max), 0, top + 5);
    ctx.fillText('0', 16, bottom + 3);
  }

  function drawCategories() {
    const { ctx, width, height } = canvasContext('category-chart');
    const left = width < 400 ? 78 : 100, right = width - 34, top = 10, bottom = height - 25;
    axes(ctx, left, top, right, bottom);
    const row = (bottom - top) / categoryNames.length;
    categoryNames.forEach((name, i) => {
      const y = top + i * row + row / 2;
      const value = state.stats.categories[name] || 0;
      ctx.fillStyle = css('--text');
      ctx.fillText(name, 0, y + 3);
      ctx.fillStyle = css('--accent');
      ctx.fillRect(left, y - 5, (right - left) * value / 100, 10);
      ctx.fillStyle = css('--text');
      ctx.fillText(`${value}%`, Math.min(right + 3, left + (right - left) * value / 100 + 4), y + 3);
    });
    [0, 20, 40, 60, 80, 100].forEach(value => {
      ctx.fillText(String(value), left + (right - left) * value / 100 - 5, height - 7);
    });
  }

  function drawAll() {
    if (!state.stats) return;
    drawLine(); drawBars(); drawCategories();
  }

  document.querySelectorAll('[data-section] .section-toggle').forEach(button =>
    button.addEventListener('click', () => {
      button.parentElement.classList.toggle('is-collapsed');
      drawAll();
    }));
  document.querySelector('.pagination-actions').addEventListener('click', event => {
    const items = [...event.currentTarget.children];
    if (event.target === items[0]) state.page--;
    if (event.target === items[1]) state.page++;
    state.page = Math.max(0, state.page);
    renderRows();
  });
  document.querySelector('.date-control').addEventListener('click', async () => {
    const from = prompt('Начальная дата (ГГГГ-ММ-ДД), пусто — без ограничения:', state.from);
    if (from === null) return;
    const to = prompt('Конечная дата (ГГГГ-ММ-ДД), пусто — без ограничения:', state.to);
    if (to === null) return;
    const previous = { from: state.from, to: state.to };
    state.from = from.trim(); state.to = to.trim();
    try { update(await getStats()); }
    catch (error) {
      Object.assign(state, previous);
      alert(error.message);
    }
  });
  document.querySelectorAll('[data-export]').forEach(button => button.addEventListener('click', () => {
    const header = ['Прохождение', 'Дата и время', 'Длительность, сек', 'Балл', 'Профиль', ...categoryNames];
    const lines = [header, ...state.stats.attempts.map(row => [
      row.id, formatDate(row.completedAt), row.durationSeconds, row.score, row.profile,
      ...categoryNames.map(name => row.categories[name] ?? 0)
    ])];
    const csv = lines.map(line => line.map(value =>
      '"' + String(value).replaceAll('"', '""') + '"').join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'museo-statistics.csv'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }));
  document.querySelector('.logout').addEventListener('click', () =>
    navigator.sendBeacon('/api/admin/logout', new Blob(['{}'], { type: 'application/json' })));
  window.addEventListener('resize', drawAll);
  boot();
})();

