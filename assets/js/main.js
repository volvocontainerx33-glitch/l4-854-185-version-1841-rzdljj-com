(function () {
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function initMobileMenu() {
    const toggle = qs('[data-mobile-toggle]');
    const panel = qs('[data-mobile-panel]');
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  function initBackTop() {
    const button = qs('[data-back-top]');
    if (!button) {
      return;
    }
    const refresh = function () {
      button.classList.toggle('is-visible', window.scrollY > 420);
    };
    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.addEventListener('scroll', refresh, { passive: true });
    refresh();
  }

  function initHero() {
    const root = qs('[data-hero]');
    if (!root) {
      return;
    }
    const slides = qsa('[data-hero-slide]', root);
    const dots = qsa('[data-hero-dot]', root);
    const prev = qs('[data-hero-prev]', root);
    const next = qs('[data-hero-next]', root);
    let index = 0;
    let timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initPageFilter() {
    const grid = qs('[data-filter-grid]');
    if (!grid) {
      return;
    }
    const items = qsa('.filter-item', grid);
    const input = qs('[data-filter-input]');
    const empty = qs('[data-empty-result]');
    const valueButtons = qsa('[data-filter-value]');
    const yearButtons = qsa('[data-filter-year]');
    const reset = qs('[data-filter-reset]');
    let activeValue = '';
    let activeYear = '';

    function matchItem(item) {
      const text = (item.dataset.keywords || '').toLowerCase();
      const query = input ? input.value.trim().toLowerCase() : '';
      const genre = item.dataset.genre || '';
      const year = item.dataset.year || '';
      const matchQuery = !query || text.includes(query);
      const matchValue = !activeValue || genre.includes(activeValue) || text.includes(activeValue.toLowerCase());
      const matchYear = !activeYear || year === activeYear;
      return matchQuery && matchValue && matchYear;
    }

    function render() {
      let visible = 0;
      items.forEach(function (item) {
        const ok = matchItem(item);
        item.hidden = !ok;
        if (ok) {
          visible += 1;
        }
      });
      if (empty) {
        empty.hidden = visible !== 0;
      }
    }

    valueButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        activeValue = button.dataset.filterValue || '';
        valueButtons.forEach(item => item.classList.toggle('is-active', item === button));
        render();
      });
    });

    yearButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        activeYear = button.dataset.filterYear || '';
        yearButtons.forEach(item => item.classList.toggle('is-active', item === button));
        render();
      });
    });

    if (input) {
      input.addEventListener('input', render);
    }

    if (reset) {
      reset.addEventListener('click', function () {
        activeValue = '';
        activeYear = '';
        valueButtons.forEach(item => item.classList.toggle('is-active', !item.dataset.filterValue));
        yearButtons.forEach(item => item.classList.toggle('is-active', !item.dataset.filterYear));
        window.setTimeout(render, 0);
      });
    }

    render();
  }

  function loadHlsLibrary() {
    return new Promise(function (resolve, reject) {
      if (window.Hls) {
        resolve(window.Hls);
        return;
      }
      const existing = document.querySelector('script[data-hls-loader]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.Hls));
        existing.addEventListener('error', reject);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js';
      script.async = true;
      script.dataset.hlsLoader = 'true';
      script.addEventListener('load', () => resolve(window.Hls));
      script.addEventListener('error', reject);
      document.head.appendChild(script);
    });
  }

  function initPlayer() {
    const shell = qs('[data-player-shell]');
    const video = qs('[data-video-player]');
    const start = qs('[data-player-start]');
    const message = qs('[data-player-message]');
    if (!shell || !video || !start) {
      return;
    }
    const source = video.dataset.src;
    let initialized = false;

    function showMessage(text) {
      if (!message) {
        return;
      }
      message.textContent = text;
      message.hidden = false;
    }

    async function setup() {
      if (initialized) {
        return;
      }
      if (!source) {
        showMessage('视频不存在');
        return;
      }
      initialized = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        return;
      }
      try {
        const Hls = await loadHlsLibrary();
        if (Hls && Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
          hls.loadSource(source);
          hls.attachMedia(video);
          hls.on(Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              showMessage('视频加载失败，请稍后重试');
            }
          });
          shell._hls = hls;
        } else {
          showMessage('您的浏览器不支持HLS视频播放');
        }
      } catch (error) {
        showMessage('视频加载失败，请稍后重试');
      }
    }

    start.addEventListener('click', async function () {
      await setup();
      try {
        await video.play();
        start.classList.add('is-hidden');
      } catch (error) {
        showMessage('请再次点击播放器开始播放');
      }
    });

    video.addEventListener('play', function () {
      start.classList.add('is-hidden');
    });
  }

  function initSearchPage() {
    const form = qs('[data-search-form]');
    const input = qs('[data-search-input]');
    const category = qs('[data-search-category]');
    const results = qs('[data-search-results]');
    const status = qs('[data-search-status]');
    if (!form || !input || !results || !window.MOVIE_SEARCH_DATA) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q') || '';
    input.value = initialQuery;

    function createCard(movie) {
      const tags = movie.tags.slice(0, 3).map(tag => `<span>${escapeHtml(tag)}</span>`).join('');
      return `
        <article class="movie-card">
          <a class="poster-wrap" href="${movie.url}" aria-label="观看${escapeHtml(movie.title)}">
            <img src="${movie.cover}" alt="${escapeHtml(movie.title)}" loading="lazy">
            <span class="poster-shade"></span>
            <span class="play-mark">▶</span>
          </a>
          <div class="movie-card-body">
            <h3><a href="${movie.url}">${escapeHtml(movie.title)}</a></h3>
            <p class="movie-meta">${escapeHtml(movie.year)} · ${escapeHtml(movie.region)} · ${escapeHtml(movie.type)}</p>
            <p class="movie-line">${escapeHtml(movie.oneLine)}</p>
            <div class="tag-row">${tags}</div>
          </div>
        </article>`;
    }

    function escapeHtml(value) {
      return String(value || '').replace(/[&<>"']/g, function (char) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[char];
      });
    }

    function render() {
      const query = input.value.trim().toLowerCase();
      const cat = category ? category.value : '';
      const list = window.MOVIE_SEARCH_DATA.filter(function (movie) {
        const text = movie.searchText.toLowerCase();
        const matchQuery = !query || text.includes(query);
        const matchCategory = !cat || movie.category === cat;
        return matchQuery && matchCategory;
      }).slice(0, 120);
      results.innerHTML = list.map(createCard).join('');
      if (status) {
        status.textContent = list.length ? `已显示 ${list.length} 个匹配结果` : '没有匹配结果，请尝试其他关键词。';
      }
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const nextUrl = new URL(window.location.href);
      if (input.value.trim()) {
        nextUrl.searchParams.set('q', input.value.trim());
      } else {
        nextUrl.searchParams.delete('q');
      }
      window.history.replaceState(null, '', nextUrl.toString());
      render();
    });

    input.addEventListener('input', render);
    if (category) {
      category.addEventListener('change', render);
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initBackTop();
    initHero();
    initPageFilter();
    initPlayer();
    initSearchPage();
  });
})();
