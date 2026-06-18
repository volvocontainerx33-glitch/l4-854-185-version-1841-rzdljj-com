(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function initMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var panel = document.querySelector('[data-mobile-panel]');
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  function initHero() {
    var stage = document.querySelector('[data-hero]');
    if (!stage) {
      return;
    }
    var slides = Array.prototype.slice.call(stage.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(stage.querySelectorAll('.hero-dot'));
    if (!slides.length) {
      return;
    }
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        start();
      });
    });

    stage.addEventListener('mouseenter', stop);
    stage.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initSearchPage() {
    var box = document.querySelector('[data-search-input]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-search-card]'));
    var empty = document.querySelector('[data-empty-state]');
    if (!box || !cards.length) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';
    box.value = initial;

    function filter() {
      var query = box.value.trim().toLowerCase();
      var visible = 0;
      cards.forEach(function (card) {
        var haystack = (card.getAttribute('data-search-card') || '').toLowerCase();
        var matched = !query || haystack.indexOf(query) !== -1;
        card.style.display = matched ? '' : 'none';
        if (matched) {
          visible += 1;
        }
      });
      if (empty) {
        empty.style.display = visible ? 'none' : 'block';
      }
    }

    var button = box.parentElement ? box.parentElement.querySelector('button') : null;
    if (button) {
      button.addEventListener('click', filter);
    }
    box.addEventListener('input', filter);
    filter();
  }

  function initPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll('[data-video-url]'));
    players.forEach(function (player) {
      var video = player.querySelector('video');
      var layer = player.querySelector('.play-layer');
      var source = video ? video.querySelector('source') : null;
      var src = player.getAttribute('data-video-url') || (source ? source.getAttribute('src') : '');
      var configured = false;
      var hlsInstance = null;

      if (!video || !src) {
        return;
      }

      function configure() {
        if (configured) {
          return;
        }
        configured = true;
        if (window.Hls && window.Hls.isSupported()) {
          if (source) {
            source.remove();
          }
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hlsInstance.loadSource(src);
          hlsInstance.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
        } else {
          video.src = src;
        }
      }

      function play() {
        configure();
        var result = video.play();
        if (result && typeof result.catch === 'function') {
          result.catch(function () {});
        }
      }

      player.addEventListener('click', function () {
        play();
      });

      if (layer) {
        layer.addEventListener('click', function (event) {
          event.preventDefault();
          play();
        });
      }

      configure();

      video.addEventListener('play', function () {
        player.classList.add('is-playing');
      });

      video.addEventListener('pause', function () {
        player.classList.remove('is-playing');
      });

      video.addEventListener('ended', function () {
        player.classList.remove('is-playing');
      });

      window.addEventListener('pagehide', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
          hlsInstance = null;
        }
      });
    });
  }

  ready(function () {
    initMenu();
    initHero();
    initSearchPage();
    initPlayers();
  });
})();
