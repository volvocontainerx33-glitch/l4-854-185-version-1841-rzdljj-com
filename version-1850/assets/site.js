(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function initMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (!toggle || !menu) {
      return;
    }
    toggle.addEventListener("click", function () {
      menu.classList.toggle("is-open");
    });
  }

  function initHero() {
    var slider = document.querySelector("[data-hero-slider]");
    if (!slider) {
      return;
    }
    var slides = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-dot]"));
    if (slides.length <= 1) {
      return;
    }
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        stop();
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        start();
      });
    });
    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    start();
  }

  function filterCards(cards, category, query) {
    var activeCategory = normalize(category || "all");
    var text = normalize(query);
    cards.forEach(function (card) {
      var cardCategory = normalize(card.getAttribute("data-category"));
      var haystack = normalize([
        card.getAttribute("data-title"),
        card.getAttribute("data-region"),
        card.getAttribute("data-type"),
        card.getAttribute("data-year"),
        card.textContent
      ].join(" "));
      var categoryMatch = activeCategory === "all" || cardCategory === activeCategory;
      var textMatch = !text || haystack.indexOf(text) !== -1;
      card.classList.toggle("is-hidden-by-filter", !(categoryMatch && textMatch));
    });
  }

  function initLibraryFilter() {
    var grid = document.querySelector("[data-library-grid]");
    if (!grid) {
      return;
    }
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".movie-card"));
    var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-home-filter]"));
    var input = document.querySelector("[data-library-search]");
    var category = "all";

    function apply() {
      filterCards(cards, category, input ? input.value : "");
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        buttons.forEach(function (item) {
          item.classList.remove("is-active");
        });
        button.classList.add("is-active");
        category = button.getAttribute("data-home-filter") || "all";
        apply();
      });
    });

    if (input) {
      input.addEventListener("input", apply);
    }
  }

  function initPageFilter() {
    var input = document.querySelector("[data-page-filter]");
    var grid = document.querySelector("[data-page-card-grid]");
    if (!input || !grid) {
      return;
    }
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".movie-card"));
    input.addEventListener("input", function () {
      filterCards(cards, "all", input.value);
    });
  }

  function movieCardMarkup(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");
    return [
      "<article class=\"movie-card\" data-title=\"" + escapeHtml(movie.title) + "\" data-category=\"" + escapeHtml(movie.categorySlug) + "\" data-region=\"" + escapeHtml(movie.region) + "\" data-type=\"" + escapeHtml(movie.type) + "\" data-year=\"" + escapeHtml(movie.year) + "\">",
      "<a href=\"video/" + escapeHtml(movie.id) + ".html\" class=\"movie-card-link\" aria-label=\"观看" + escapeHtml(movie.title) + "\">",
      "<div class=\"movie-poster\">",
      "<img src=\"./" + escapeHtml(movie.cover) + ".jpg\" alt=\"" + escapeHtml(movie.title) + "\" loading=\"lazy\">",
      "<div class=\"poster-shade\"></div>",
      "<span class=\"poster-category\">" + escapeHtml(movie.category) + "</span>",
      "<span class=\"poster-year\">" + escapeHtml(movie.year) + "</span>",
      "<span class=\"poster-play\">▶</span>",
      "</div>",
      "<div class=\"movie-info\">",
      "<h3>" + escapeHtml(movie.title) + "</h3>",
      "<p>" + escapeHtml(movie.oneLine) + "</p>",
      "<div class=\"movie-meta\"><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.type) + "</span></div>",
      "<div class=\"movie-tags\">" + tags + "</div>",
      "</div>",
      "</a>",
      "</article>"
    ].join("");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function initSearchPage() {
    var results = document.getElementById("searchResults");
    if (!results || !window.SEARCH_MOVIES) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";
    var input = document.getElementById("searchQuery");
    var status = document.querySelector("[data-search-status]");
    var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-search-category]"));
    var category = "all";

    if (input) {
      input.value = query;
      input.addEventListener("input", function () {
        query = input.value;
        render();
      });
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        buttons.forEach(function (item) {
          item.classList.remove("is-active");
        });
        button.classList.add("is-active");
        category = button.getAttribute("data-search-category") || "all";
        render();
      });
    });

    function render() {
      var text = normalize(query);
      var filtered = window.SEARCH_MOVIES.filter(function (movie) {
        var categoryMatch = category === "all" || movie.categorySlug === category;
        var haystack = normalize([
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genre,
          movie.category,
          movie.oneLine,
          (movie.tags || []).join(" ")
        ].join(" "));
        var textMatch = !text || haystack.indexOf(text) !== -1;
        return categoryMatch && textMatch;
      }).slice(0, 160);
      results.innerHTML = filtered.map(movieCardMarkup).join("");
      if (status) {
        if (!text && category === "all") {
          status.textContent = "输入关键词查找影片，或选择频道浏览推荐结果";
        } else if (filtered.length) {
          status.textContent = "已展示与条件匹配的影片";
        } else {
          status.textContent = "没有找到匹配影片";
        }
      }
    }

    render();
  }

  ready(function () {
    initMenu();
    initHero();
    initLibraryFilter();
    initPageFilter();
    initSearchPage();
  });
})();
