(function () {
    function ready(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    function normalize(value) {
        return String(value || '').trim().toLowerCase();
    }

    function initMobileMenu() {
        var toggle = document.querySelector('[data-mobile-toggle]');
        var panel = document.querySelector('[data-mobile-panel]');
        if (!toggle || !panel) {
            return;
        }
        toggle.addEventListener('click', function () {
            panel.classList.toggle('is-open');
        });
    }

    function initHeaderSearch() {
        var forms = document.querySelectorAll('[data-header-search]');
        forms.forEach(function (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                var input = form.querySelector('input[name="q"]');
                var query = input ? input.value.trim() : '';
                var target = 'videos.html';
                if (query) {
                    target += '?q=' + encodeURIComponent(query);
                }
                window.location.href = target;
            });
        });
    }

    function initHero() {
        var hero = document.querySelector('[data-hero]');
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        if (!slides.length) {
            return;
        }
        var current = 0;
        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === current);
            });
        }
        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                show(index);
            });
        });
        show(0);
        window.setInterval(function () {
            show(current + 1);
        }, 5200);
    }

    function initFilters() {
        var page = document.querySelector('[data-filter-page]');
        if (!page) {
            return;
        }
        var input = page.querySelector('[data-filter-input]');
        var typeSelect = page.querySelector('[data-filter-type]');
        var regionSelect = page.querySelector('[data-filter-region]');
        var yearSelect = page.querySelector('[data-filter-year]');
        var cards = Array.prototype.slice.call(page.querySelectorAll('[data-filter-card]'));
        var noResults = page.querySelector('[data-no-results]');
        var params = new URLSearchParams(window.location.search);
        var q = params.get('q');
        if (q && input) {
            input.value = q;
        }
        function active(select) {
            return select ? normalize(select.value) : '';
        }
        function apply() {
            var query = input ? normalize(input.value) : '';
            var type = active(typeSelect);
            var region = active(regionSelect);
            var year = active(yearSelect);
            var visible = 0;
            cards.forEach(function (card) {
                var search = normalize(card.getAttribute('data-search'));
                var cardType = normalize(card.getAttribute('data-type'));
                var cardRegion = normalize(card.getAttribute('data-region'));
                var cardYear = normalize(card.getAttribute('data-year'));
                var matched = true;
                if (query && search.indexOf(query) === -1) {
                    matched = false;
                }
                if (type && cardType !== type) {
                    matched = false;
                }
                if (region && cardRegion !== region) {
                    matched = false;
                }
                if (year && cardYear !== year) {
                    matched = false;
                }
                card.hidden = !matched;
                if (matched) {
                    visible += 1;
                }
            });
            if (noResults) {
                noResults.classList.toggle('is-visible', visible === 0);
            }
        }
        [input, typeSelect, regionSelect, yearSelect].forEach(function (control) {
            if (control) {
                control.addEventListener('input', apply);
                control.addEventListener('change', apply);
            }
        });
        apply();
    }

    window.initMoviePlayer = function (stream) {
        var video = document.querySelector('[data-player-video]');
        var button = document.querySelector('[data-player-button]');
        if (!video || !button || !stream) {
            return;
        }
        var loaded = false;
        var hlsInstance = null;
        function start() {
            button.classList.add('is-hidden');
            if (!loaded) {
                loaded = true;
                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = stream;
                } else if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
                    hlsInstance.loadSource(stream);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        video.play().catch(function () {});
                    });
                } else {
                    video.src = stream;
                }
            }
            video.play().catch(function () {});
        }
        button.addEventListener('click', start);
        video.addEventListener('click', function () {
            if (video.paused) {
                start();
            }
        });
        window.addEventListener('beforeunload', function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    };

    ready(function () {
        initMobileMenu();
        initHeaderSearch();
        initHero();
        initFilters();
    });
}());
