(function () {
  var menu = document.querySelector(".menu-toggle");
  var mobileNav = document.querySelector(".mobile-nav");
  if (menu && mobileNav) {
    menu.addEventListener("click", function () {
      mobileNav.classList.toggle("open");
    });
  }

  document.querySelectorAll(".search-redirect").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      var input = form.querySelector('input[name="q"]');
      if (!input || !input.value.trim()) {
        event.preventDefault();
        input && input.focus();
      }
    });
  });

  var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
  var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
  var current = 0;
  function showSlide(index) {
    if (!slides.length) return;
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      slide.classList.toggle("active", i === current);
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle("active", i === current);
    });
  }
  dots.forEach(function (dot, i) {
    dot.addEventListener("click", function () {
      showSlide(i);
    });
  });
  if (slides.length > 1) {
    setInterval(function () {
      showSlide(current + 1);
    }, 5200);
  }

  function normalize(value) {
    return (value || "").toString().toLowerCase().trim();
  }

  function applyCardFilters(scope) {
    var root = scope || document;
    var queryInput = root.querySelector(".filter-input");
    var regionSelect = root.querySelector(".region-filter");
    var typeSelect = root.querySelector(".type-filter");
    var yearSelect = root.querySelector(".year-filter");
    var cards = Array.prototype.slice.call(root.querySelectorAll(".movie-card"));
    if (!cards.length || (!queryInput && !regionSelect && !typeSelect && !yearSelect)) return;

    function run() {
      var q = normalize(queryInput && queryInput.value);
      var region = normalize(regionSelect && regionSelect.value);
      var type = normalize(typeSelect && typeSelect.value);
      var year = normalize(yearSelect && yearSelect.value);

      cards.forEach(function (card) {
        var title = normalize(card.getAttribute("data-title"));
        var tags = normalize(card.getAttribute("data-tags"));
        var cRegion = normalize(card.getAttribute("data-region"));
        var cType = normalize(card.getAttribute("data-type"));
        var cYear = normalize(card.getAttribute("data-year"));
        var matchText = !q || title.indexOf(q) > -1 || tags.indexOf(q) > -1 || cRegion.indexOf(q) > -1 || cType.indexOf(q) > -1 || cYear.indexOf(q) > -1;
        var matchRegion = !region || cRegion === region;
        var matchType = !type || cType === type;
        var matchYear = !year || cYear === year;
        card.classList.toggle("is-filtered-out", !(matchText && matchRegion && matchType && matchYear));
      });
    }

    [queryInput, regionSelect, typeSelect, yearSelect].forEach(function (control) {
      if (control) {
        control.addEventListener("input", run);
        control.addEventListener("change", run);
      }
    });
    run();
  }
  applyCardFilters(document);

  var player = document.querySelector("[data-video-player]");
  if (player) {
    var video = player.querySelector("video");
    var overlay = player.querySelector(".play-overlay");
    var url = video && video.getAttribute("data-video");
    var initialized = false;

    function setup() {
      if (!video || !url || initialized) return;
      initialized = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
      } else if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (_, data) {
          if (!data || !data.fatal) return;
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            hls.destroy();
          }
        });
      } else {
        video.src = url;
      }
    }

    function play() {
      setup();
      if (overlay) overlay.classList.add("is-hidden");
      var promise = video.play();
      if (promise && promise.catch) {
        promise.catch(function () {});
      }
    }

    if (overlay) {
      overlay.addEventListener("click", play);
    }
    video.addEventListener("click", function () {
      if (video.paused) {
        play();
      }
    });
    video.addEventListener("play", function () {
      if (overlay) overlay.classList.add("is-hidden");
    });
    setup();
  }

  var resultsRoot = document.querySelector("[data-search-results]");
  if (resultsRoot && window.MOVIES_INDEX) {
    var params = new URLSearchParams(window.location.search);
    var q = normalize(params.get("q"));
    var input = document.querySelector(".search-page-input");
    if (input) input.value = params.get("q") || "";

    function renderResults(keyword) {
      var term = normalize(keyword);
      var matches = window.MOVIES_INDEX.filter(function (item) {
        var haystack = normalize([item.title, item.region, item.type, item.year, item.genre, item.tags].join(" "));
        return !term || haystack.indexOf(term) > -1;
      }).slice(0, 120);

      if (!matches.length) {
        resultsRoot.innerHTML = '<div class="search-results-empty">没有找到匹配内容</div>';
        return;
      }

      resultsRoot.innerHTML = matches.map(function (item) {
        return '<a class="movie-card" href="./' + item.url + '" data-title="' + escapeHtml(item.title) + '" data-tags="' + escapeHtml(item.tags + " " + item.genre) + '" data-region="' + escapeHtml(item.region) + '" data-type="' + escapeHtml(item.type) + '" data-year="' + escapeHtml(item.year) + '">' +
          '<div class="poster-frame"><img src="./' + item.cover + '" alt="' + escapeHtml(item.title) + '" loading="lazy"><span class="poster-badge">' + escapeHtml(item.year || item.type) + '</span></div>' +
          '<div class="movie-card-body"><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.one) + '</p><div class="card-meta"><span>' + escapeHtml(item.region) + '</span><span>' + escapeHtml(item.type) + '</span></div><div class="card-tags">' + escapeHtml(item.tags) + '</div></div>' +
          '</a>';
      }).join("");
    }

    function escapeHtml(value) {
      return (value || "").toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    renderResults(q);
    if (input) {
      input.addEventListener("input", function () {
        renderResults(input.value);
      });
    }
  }
})();
