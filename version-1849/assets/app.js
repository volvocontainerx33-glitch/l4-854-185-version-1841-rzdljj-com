(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return (value || '').toString().toLowerCase().trim();
  }

  function bindMenu() {
    var button = qs('[data-menu-toggle]');
    var menu = qs('[data-mobile-menu]');
    if (!button || !menu) return;
    button.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  function bindSearchForms() {
    qsa('[data-search-form]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var input = qs('input[type="search"], input[type="text"]', form);
        var query = input ? input.value.trim() : '';
        var target = './movies.html';
        if (query) target += '?q=' + encodeURIComponent(query);
        window.location.href = target;
      });
    });
  }

  function bindHero() {
    var root = qs('[data-hero-slider]');
    if (!root) return;
    var slides = qsa('[data-hero-slide]', root);
    var dots = qsa('[data-hero-dot]', root);
    if (slides.length < 2) return;
    var index = 0;

    function show(next) {
      slides[index].classList.remove('is-active');
      if (dots[index]) dots[index].classList.remove('is-active');
      index = (next + slides.length) % slides.length;
      slides[index].classList.add('is-active');
      if (dots[index]) dots[index].classList.add('is-active');
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
      });
    });

    window.setInterval(function () {
      show(index + 1);
    }, 5600);
  }

  function bindFilters() {
    var list = qs('[data-filterable-list]');
    if (!list) return;
    var cards = qsa('[data-movie-card]', list);
    var input = qs('[data-movie-search]');
    var chips = qsa('[data-filter-chip]');
    var activeCategory = 'all';
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';
    if (input && initialQuery) input.value = initialQuery;

    function apply() {
      var query = normalize(input ? input.value : '');
      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-type'),
          card.getAttribute('data-genre'),
          card.getAttribute('data-tags'),
          card.getAttribute('data-category')
        ].join(' '));
        var category = card.getAttribute('data-category') || '';
        var queryMatch = !query || haystack.indexOf(query) !== -1;
        var categoryMatch = activeCategory === 'all' || category === activeCategory;
        card.classList.toggle('hidden-card', !(queryMatch && categoryMatch));
      });
    }

    if (input) {
      input.addEventListener('input', apply);
      apply();
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        activeCategory = chip.getAttribute('data-filter-chip') || 'all';
        chips.forEach(function (item) {
          item.classList.remove('is-active');
        });
        chip.classList.add('is-active');
        apply();
      });
    });
  }

  function bindPlayer() {
    var video = qs('[data-stream]');
    if (!video) return;
    var overlay = qs('[data-player-overlay]');
    var stream = video.getAttribute('data-stream');
    var attached = false;
    var hlsInstance = null;

    function attach() {
      if (attached || !stream) return;
      attached = true;
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hlsInstance.loadSource(stream);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.ERROR, function (_, data) {
          if (!data || !data.fatal) return;
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            hlsInstance.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hlsInstance.recoverMediaError();
          } else {
            hlsInstance.destroy();
          }
        });
      } else {
        video.src = stream;
      }
    }

    function start() {
      attach();
      if (overlay) overlay.hidden = true;
      var played = video.play();
      if (played && typeof played.catch === 'function') {
        played.catch(function () {
          if (overlay) overlay.hidden = false;
        });
      }
    }

    attach();

    if (overlay) {
      overlay.addEventListener('click', start);
    }

    video.addEventListener('click', function () {
      if (video.paused) start();
    });

    video.addEventListener('play', function () {
      if (overlay) overlay.hidden = true;
    });

    video.addEventListener('pause', function () {
      if (overlay && !video.ended) overlay.hidden = false;
    });

    window.addEventListener('beforeunload', function () {
      if (hlsInstance) hlsInstance.destroy();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindMenu();
    bindSearchForms();
    bindHero();
    bindFilters();
    bindPlayer();
  });
})();
