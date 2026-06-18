(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    function normalize(value) {
        return String(value || "").trim().toLowerCase();
    }

    function initMenu() {
        var button = document.querySelector(".menu-toggle");
        var panel = document.querySelector(".mobile-panel");
        if (!button || !panel) {
            return;
        }
        button.addEventListener("click", function () {
            panel.classList.toggle("is-open");
        });
    }

    function initFilters() {
        var input = document.querySelector(".movie-filter-input");
        var select = document.querySelector(".category-select");
        var clear = document.querySelector(".clear-filter");
        var list = document.querySelector(".movie-list");
        var empty = document.querySelector(".empty-state");
        if (!list) {
            return;
        }
        var cards = Array.prototype.slice.call(list.querySelectorAll(".movie-card"));
        var apply = function () {
            var query = input ? normalize(input.value) : "";
            var category = select ? select.value : "";
            var visible = 0;
            cards.forEach(function (card) {
                var text = normalize(card.getAttribute("data-filter"));
                var cardCategory = card.getAttribute("data-category") || "";
                var matchedText = !query || text.indexOf(query) !== -1;
                var matchedCategory = !category || cardCategory === category;
                var show = matchedText && matchedCategory;
                card.classList.toggle("is-hidden", !show);
                if (show) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.hidden = visible !== 0;
            }
        };
        if (input) {
            var params = new URLSearchParams(window.location.search);
            var q = params.get("q");
            if (q) {
                input.value = q;
            }
            input.addEventListener("input", apply);
        }
        if (select) {
            select.addEventListener("change", apply);
        }
        if (clear) {
            clear.addEventListener("click", function () {
                if (input) {
                    input.value = "";
                }
                if (select) {
                    select.value = "";
                }
                apply();
            });
        }
        apply();
    }

    function initCategoryButtons() {
        var buttons = document.querySelectorAll("[data-category-filter]");
        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                var slug = button.getAttribute("data-category-filter");
                if (slug) {
                    window.location.href = "./category-" + slug + ".html";
                }
            });
        });
    }

    ready(function () {
        initMenu();
        initFilters();
        initCategoryButtons();
    });

    window.initVideoPlayer = function (videoId, coverId, sourceUrl) {
        var video = document.getElementById(videoId);
        var cover = document.getElementById(coverId);
        if (!video) {
            return;
        }
        var loaded = false;
        var hls = null;
        var load = function () {
            if (loaded) {
                return;
            }
            loaded = true;
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = sourceUrl;
            } else if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(sourceUrl);
                hls.attachMedia(video);
            } else {
                video.src = sourceUrl;
            }
        };
        var play = function () {
            load();
            if (cover) {
                cover.classList.add("is-hidden");
            }
            var attempt = video.play();
            if (attempt && typeof attempt.catch === "function") {
                attempt.catch(function () {});
            }
        };
        if (cover) {
            cover.addEventListener("click", play);
        }
        video.addEventListener("click", function () {
            if (video.paused) {
                play();
            }
        });
        video.addEventListener("play", function () {
            if (cover) {
                cover.classList.add("is-hidden");
            }
        });
        window.addEventListener("beforeunload", function () {
            if (hls) {
                hls.destroy();
            }
        });
    };
}());
