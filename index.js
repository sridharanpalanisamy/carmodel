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
  const selector = document.getElementById("carModelSelect");
  const status = document.getElementById("viewerStatus");
  const credit = document.getElementById("viewerCredit");
  const source = document.getElementById("viewerSource");
  if (!viewer || !selector) return;

  const models = {
    "model-t": {
      id: "8cb1c1243c394144837a15f4722a2867",
      title: "Ford Model T",
      credit: "Ford Model T Downloadable by Libau Media · CC BY",
      url: "https://sketchfab.com/3d-models/ford-model-t-downloadable-8cb1c1243c394144837a15f4722a2867"
    },
    "model-a": {
      id: "7c5b1727026b407baa67a10ba9e2be23",
      title: "Ford Model A",
      credit: "Ford Model A V2 Downloadable by Libau Media · CC BY",
      url: "https://sketchfab.com/3d-models/ford-model-a-v2-downloadable-7c5b1727026b407baa67a10ba9e2be23"
    },
    "mustang-1965": {
      id: "46e5bb2562f2423faedfe3f5ea0444f3",
      title: "1965 Ford Mustang",
      credit: "1965 Ford Mustang by mertuzulmez · CC BY",
      url: "https://sketchfab.com/3d-models/1965-ford-mustang-46e5bb2562f2423faedfe3f5ea0444f3"
    }
  };

  function loadModel(key) {
    const model = models[key];
    if (!model) return;
    viewer.src = "https://sketchfab.com/models/" + model.id + "/embed?autostart=1&ui_theme=dark";
    viewer.title = model.title + " interactive 3D model";
    credit.textContent = "3D model: " + model.credit;
    source.href = model.url;
    source.setAttribute("aria-label", "View " + model.title + " model and license on Sketchfab");
    status.textContent = model.title + " · drag to rotate · scroll or pinch to zoom";
  }

  selector.addEventListener("change", () => loadModel(selector.value));
  loadModel(selector.value);
});
