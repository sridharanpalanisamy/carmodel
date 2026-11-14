document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }));
  }

  const viewer = document.getElementById("classicCarViewer");
  const video = document.getElementById("classicCar360Video");
  const selector = document.getElementById("carModelSelect");
  const status = document.getElementById("viewerStatus");
  const credit = document.getElementById("viewerCredit");
  const source = document.getElementById("viewerSource");
  const placeholder = document.getElementById("viewerPlaceholder");
  if (!viewer || !selector) return;

  // Local MP4s take priority. The matching Sketchfab model is only a fallback
  // until a licensed, model-specific turntable video is added to assets/360/.
  const models = {
    "model-t": {
      id: "3f601062f25f4987abf18a089e66fbb7",
      title: "Ford Model T",
      video: "assets/360/ford-model-t.mp4",
      credit: "Local 360° video pending · 3D fallback by diegor_12 · CC BY",
      url: "https://sketchfab.com/3d-models/ford-t-3f601062f25f4987abf18a089e66fbb7"
    },
    "model-a": {
      id: "7c5b1727026b407baa67a10ba9e2be23",
      title: "Ford Model A",
      video: "assets/360/ford-model-a.mp4",
      credit: "Local 360° video pending · 3D fallback by Libau Media · CC BY",
      url: "https://sketchfab.com/3d-models/ford-model-a-v2-downloadable-7c5b1727026b407baa67a10ba9e2be23"
    },
    "mustang-1965": {
      id: "46e5bb2562f2423faedfe3f5ea0444f3",
      title: "1965 Ford Mustang",
      video: "assets/360/ford-mustang-1965.mp4",
      credit: "Local 360° video pending · 3D fallback by mertuzulmez · CC BY",
      url: "https://sketchfab.com/3d-models/1965-ford-mustang-46e5bb2562f2423faedfe3f5ea0444f3"
    },
  };

  let viewerStarted = false;
  let selectedModel = selector.value;
  let activeMode = "idle";

  function showPlaceholder(message) {
    if (!placeholder) return;
    placeholder.hidden = false;
    const small = placeholder.querySelector("small");
    if (small) small.textContent = message;
  }

  function showLocalVideo(model) {
    if (!video) return false;
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.src = model.video;
    video.hidden = false;
    viewer.hidden = true;
    video.load();
    activeMode = "video";
    status.textContent = model.title + " · loading self-hosted 360° video";
    return true;
  }

  function showExternalFallback(model) {
    if (!viewer) return;
    if (video) {
      video.pause();
      video.hidden = true;
    }
    viewer.hidden = false;
    viewer.src = "https://sketchfab.com/models/" + model.id + "/embed?autostart=1&ui_theme=dark";
    activeMode = "embed";
    status.textContent = model.title + " · interactive 3D fallback · drag to rotate";
    if (placeholder) placeholder.hidden = true;
  }

  function updateModelDetails(key) {
    const model = models[key];
    if (!model) return;
    selectedModel = key;
    viewer.title = model.title + " interactive 3D model";
    credit.textContent = model.credit;
    source.href = model.url;
    source.textContent = "Model details & license ↗";
    source.setAttribute("aria-label", "View " + model.title + " model and license");
    if (viewerStarted) startSelectedModel();
    else status.textContent = model.title + " selected · loads when the showroom enters your screen";
  }

  function startSelectedModel() {
    const model = models[selectedModel];
    if (!model) return;
    viewerStarted = true;
    if (video) {
      video.onerror = () => {
        if (selectedModel === selector.value) showExternalFallback(model);
      };
      video.oncanplay = () => {
        if (selectedModel !== selector.value) return;
        activeMode = "video";
        status.textContent = model.title + " · self-hosted 360° turntable video";
        if (placeholder) placeholder.hidden = true;
        video.play().catch(() => {
          status.textContent = model.title + " · press play to view the 360° video";
        });
      };
      showLocalVideo(model);
    } else {
      showExternalFallback(model);
    }
  }

  selector.addEventListener("change", () => updateModelDetails(selector.value));
  updateModelDetails(selector.value);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        startSelectedModel();
        observer.disconnect();
      }
    }, { rootMargin: "240px 0px", threshold: 0.01 });
    observer.observe(document.querySelector(".viewer-frame") || viewer);
  } else {
    startSelectedModel();
  }

  if (video) {
    video.addEventListener("play", () => {
      if (activeMode === "video" && placeholder) placeholder.hidden = true;
    });
  }
});
