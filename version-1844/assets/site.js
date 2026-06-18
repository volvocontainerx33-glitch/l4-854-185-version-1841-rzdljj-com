(function () {
  var menuButton = document.querySelector('.nav-toggle');
  var menu = document.querySelector('.nav-menu');

  if (menuButton && menu) {
    menuButton.addEventListener('click', function () {
      var opened = menu.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', opened ? 'true' : 'false');
      menuButton.textContent = opened ? '×' : '☰';
    });
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function applySearch(root) {
    var input = root.querySelector('.site-search-input');
    if (!input) {
      return;
    }

    var cards = Array.prototype.slice.call(document.querySelectorAll('.searchable-card'));
    var empty = document.querySelector('.no-result');

    if (!empty) {
      empty = document.createElement('div');
      empty.className = 'no-result is-hidden';
      empty.textContent = '没有找到匹配的影片';
      var section = document.querySelector('.content-section:last-of-type') || document.body;
      section.appendChild(empty);
    }

    function filterCards(extra) {
      var keyword = normalize(input.value + ' ' + (extra || ''));
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = normalize(card.getAttribute('data-search'));
        var matched = !keyword || haystack.indexOf(keyword) !== -1;
        card.classList.toggle('is-hidden', !matched);
        if (matched) {
          visible += 1;
        }
      });

      empty.classList.toggle('is-hidden', visible !== 0);
    }

    input.addEventListener('input', function () {
      filterCards('');
    });

    var form = input.closest('form');
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        filterCards('');
      });
    }

    document.querySelectorAll('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('.chip').forEach(function (item) {
          item.classList.remove('active');
        });
        chip.classList.add('active');
        filterCards(chip.getAttribute('data-filter') || '');
      });
    });
  }

  applySearch(document);

  document.querySelectorAll('.video-player').forEach(function (box) {
    var video = box.querySelector('video');
    var button = box.querySelector('.video-play-button');
    var source = video ? video.getAttribute('data-src') : '';
    var hls = null;
    var loaded = false;

    function showError() {
      var caption = box.querySelector('.video-caption');
      if (caption) {
        caption.innerHTML = '<strong>播放遇到问题，请稍后再试</strong><span></span>';
        caption.style.opacity = '1';
      }
      if (button) {
        button.style.display = 'none';
      }
    }

    function playVideo() {
      if (!video || !source) {
        return;
      }

      if (!loaded) {
        loaded = true;

        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(source);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {});
          });
          hls.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              showError();
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          video.addEventListener('loadedmetadata', function () {
            video.play().catch(function () {});
          }, { once: true });
          video.load();
        } else {
          video.src = source;
          video.play().catch(function () {
            showError();
          });
        }
      } else if (video.paused) {
        video.play().catch(function () {});
      } else {
        video.pause();
      }
    }

    if (button) {
      button.addEventListener('click', playVideo);
    }

    if (video) {
      video.addEventListener('click', playVideo);
      video.addEventListener('play', function () {
        box.classList.add('is-playing');
        video.setAttribute('controls', 'controls');
      });
      video.addEventListener('pause', function () {
        box.classList.remove('is-playing');
      });
      video.addEventListener('ended', function () {
        box.classList.remove('is-playing');
      });
    }

    window.addEventListener('beforeunload', function () {
      if (hls) {
        hls.destroy();
      }
    });
  });
})();
