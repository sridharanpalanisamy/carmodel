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

  const video = document.getElementById("classicCar360Video");
  const selector = document.getElementById("carModelSelect");
  const status = document.getElementById("viewerStatus");
  const placeholder = document.getElementById("viewerPlaceholder");
  if (!selector || !status || !placeholder) return;

  // Self-hosted only: never embed or contact a third-party 3D platform.
  const models = {
    "model-t": { title: "Ford Model T", video: null },
    "model-a": { title: "Ford Model A", video: null },
    "mustang-1965": { title: "1965 Ford Mustang", video: null }
  };

  function showPlaceholder(message) {
    placeholder.hidden = false;
    const small = placeholder.querySelector("small");
    if (small) small.textContent = message;
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.hidden = true;
    }
  }

  function selectModel() {
    const model = models[selector.value];
    if (!model) return;
    if (!model.video) {
      showPlaceholder("A locally hosted 360° turntable for this exact car has not been added yet. No external viewer is loaded.");
      status.textContent = model.title + " · awaiting its own 360° asset";
      return;
    }
    if (!video) {
      status.textContent = "The local video player is unavailable.";
      return;
    }
    showPlaceholder("Loading the locally hosted 360° turntable…");
    video.src = model.video;
    video.hidden = false;
    video.oncanplay = () => {
      placeholder.hidden = true;
      status.textContent = model.title + " · self-hosted 360° turntable";
      video.play().catch(() => {
        status.textContent = model.title + " · press play to rotate";
      });
    };
    video.onerror = () => {
      showPlaceholder("The local 360° video file is not available yet. Add the exact-model MP4 to assets/360/.");
      status.textContent = model.title + " · local 360° asset not found";
    };
    video.load();
  }

  selector.addEventListener("change", selectModel);
  selectModel();
});
