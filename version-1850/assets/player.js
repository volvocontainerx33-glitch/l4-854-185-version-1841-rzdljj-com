function initMoviePlayer(videoId, source, coverId) {
  var video = document.getElementById(videoId);
  var cover = document.getElementById(coverId);
  var attached = false;
  var hlsInstance = null;

  function attachSource() {
    if (attached || !video || !source) {
      return;
    }
    attached = true;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source;
    } else if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({
        enableWorker: true,
        lowLatencyMode: false
      });
      hlsInstance.loadSource(source);
      hlsInstance.attachMedia(video);
    } else {
      video.src = source;
    }
  }

  function playVideo() {
    attachSource();
    if (cover) {
      cover.classList.add("is-hidden");
    }
    var promise = video.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(function () {});
    }
  }

  if (!video) {
    return;
  }

  if (cover) {
    cover.addEventListener("click", playVideo);
  }

  video.addEventListener("click", function () {
    if (video.paused) {
      playVideo();
    }
  });

  video.addEventListener("play", function () {
    if (cover) {
      cover.classList.add("is-hidden");
    }
  });

  video.addEventListener("loadedmetadata", function () {
    if (cover && !video.paused) {
      cover.classList.add("is-hidden");
    }
  });

  window.addEventListener("beforeunload", function () {
    if (hlsInstance) {
      hlsInstance.destroy();
    }
  });
}
