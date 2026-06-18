(function () {
  var hlsPromise = null;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function loadHls() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }
    if (!hlsPromise) {
      hlsPromise = new Promise(function (resolve, reject) {
        var script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js";
        script.onload = function () {
          resolve(window.Hls);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    return hlsPromise;
  }

  function bindPlayer(player) {
    var video = player.querySelector("video");
    var button = player.querySelector(".player-start");
    var url = player.getAttribute("data-url");
    var attached = false;

    function attach() {
      if (attached) {
        return Promise.resolve();
      }
      attached = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        return Promise.resolve();
      }
      return loadHls().then(function (Hls) {
        if (Hls && Hls.isSupported()) {
          var hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(url);
          hls.attachMedia(video);
          player._hls = hls;
        } else {
          video.src = url;
        }
      });
    }

    function start() {
      player.classList.add("is-loading");
      attach().then(function () {
        player.classList.add("is-started");
        video.controls = true;
        return video.play();
      }).catch(function () {
        player.classList.remove("is-started");
      }).finally(function () {
        player.classList.remove("is-loading");
      });
    }

    if (button) {
      button.addEventListener("click", start);
    }
    video.addEventListener("click", function () {
      if (!player.classList.contains("is-started")) {
        start();
      } else if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    });
  }

  function initPlayers() {
    document.querySelectorAll(".js-player").forEach(bindPlayer);
  }

  function initHero() {
    var hero = document.querySelector(".hero");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    var current = 0;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === current);
      });
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }
  }

  function initMenu() {
    var toggle = document.querySelector(".menu-toggle");
    var mobile = document.querySelector(".mobile-nav");
    if (!toggle || !mobile) {
      return;
    }
    toggle.addEventListener("click", function () {
      var open = mobile.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function initBackTop() {
    var button = document.querySelector(".back-top");
    if (!button) {
      return;
    }
    window.addEventListener("scroll", function () {
      button.classList.toggle("is-visible", window.scrollY > 360);
    });
    button.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }

  function createResult(item) {
    var link = document.createElement("a");
    link.className = "search-result";
    link.href = item.url;

    var image = document.createElement("img");
    image.src = item.cover;
    image.alt = item.title;
    image.loading = "lazy";

    var body = document.createElement("span");
    var title = document.createElement("strong");
    title.textContent = item.title;
    var meta = document.createElement("span");
    meta.textContent = item.year + " · " + item.region + " · " + item.category;

    body.appendChild(title);
    body.appendChild(meta);
    link.appendChild(image);
    link.appendChild(body);
    return link;
  }

  function initGlobalSearch() {
    var items = window.SEARCH_ITEMS || [];
    document.querySelectorAll(".global-search").forEach(function (form) {
      var input = form.querySelector(".global-search-input");
      var panel = form.querySelector(".global-search-panel");
      if (!input || !panel) {
        return;
      }

      function render() {
        var query = input.value.trim().toLowerCase();
        panel.textContent = "";
        if (!query) {
          panel.classList.remove("is-open");
          return [];
        }
        var matched = items.filter(function (item) {
          return item.search.indexOf(query) !== -1;
        }).slice(0, 10);
        matched.forEach(function (item) {
          panel.appendChild(createResult(item));
        });
        if (!matched.length) {
          var empty = document.createElement("div");
          empty.className = "search-result";
          empty.textContent = "暂无匹配影片";
          panel.appendChild(empty);
        }
        panel.classList.add("is-open");
        return matched;
      }

      input.addEventListener("input", render);
      input.addEventListener("focus", render);
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var matched = render();
        if (matched.length) {
          window.location.href = matched[0].url;
        }
      });
      document.addEventListener("click", function (event) {
        if (!form.contains(event.target)) {
          panel.classList.remove("is-open");
        }
      });
    });
  }

  function initPageFilters() {
    var target = document.querySelector(".filter-target");
    if (!target) {
      return;
    }
    var cards = Array.prototype.slice.call(target.querySelectorAll(".searchable-card"));
    var queryInput = document.querySelector(".page-filter");
    var yearSelect = document.querySelector(".filter-year");
    var regionSelect = document.querySelector(".filter-region");
    var count = document.querySelector(".results-count");
    var empty = document.querySelector(".empty-state");

    function filter() {
      var query = queryInput ? queryInput.value.trim().toLowerCase() : "";
      var year = yearSelect ? yearSelect.value : "";
      var region = regionSelect ? regionSelect.value : "";
      var visible = 0;
      cards.forEach(function (card) {
        var text = [
          card.getAttribute("data-title"),
          card.getAttribute("data-tags"),
          card.getAttribute("data-category"),
          card.getAttribute("data-region"),
          card.getAttribute("data-year")
        ].join(" ").toLowerCase();
        var match = true;
        if (query && text.indexOf(query) === -1) {
          match = false;
        }
        if (year && card.getAttribute("data-year") !== year) {
          match = false;
        }
        if (region && card.getAttribute("data-region") !== region) {
          match = false;
        }
        card.hidden = !match;
        if (match) {
          visible += 1;
        }
      });
      if (count) {
        count.textContent = "共 " + visible + " 部";
      }
      if (empty) {
        empty.hidden = visible !== 0;
      }
    }

    [queryInput, yearSelect, regionSelect].forEach(function (node) {
      if (node) {
        node.addEventListener("input", filter);
        node.addEventListener("change", filter);
      }
    });
  }

  ready(function () {
    initHero();
    initMenu();
    initBackTop();
    initGlobalSearch();
    initPageFilters();
    initPlayers();
  });
})();
