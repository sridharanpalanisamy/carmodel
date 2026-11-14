document.addEventListener("DOMContentLoaded", () => {
  const search = document.getElementById("carSearch");
  const cards = [...document.querySelectorAll(".car-card")];
  const filters = [...document.querySelectorAll(".filter-button")];
  const noResults = document.getElementById("noResults");
  const modal = document.getElementById("carModal");
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");
  let activeFilter = "all";

  function filterCards() {
    const query = (search?.value || "").trim().toLowerCase();
    let visible = 0;
    cards.forEach(card => {
      const matchesName = card.dataset.name.toLowerCase().includes(query);
      const matchesFilter = activeFilter === "all" || card.dataset.category === activeFilter;
      const show = matchesName && matchesFilter;
      card.hidden = !show;
      if (show) visible++;
    });
    if (noResults) noResults.hidden = visible !== 0;
  }

  search?.addEventListener("input", filterCards);
  filters.forEach(button => button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filters.forEach(item => item.classList.toggle("active", item === button));
    filterCards();
  }));

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  document.querySelectorAll(".details-button").forEach(button => button.addEventListener("click", () => {
    const data = button.dataset;
    document.getElementById("modalTitle").textContent = data.model;
    document.getElementById("modalYear").textContent = data.year;
    document.getElementById("modalEngine").textContent = data.engine;
    document.getElementById("modalFuel").textContent = data.fuel;
    document.getElementById("modalDescription").textContent = data.description;
    const image = document.getElementById("modalImage");
    image.src = data.image;
    image.alt = data.model;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    document.getElementById("modalClose").focus();
  }));

  document.getElementById("modalClose").addEventListener("click", closeModal);
  modal.addEventListener("click", event => {
    if (event.target.hasAttribute("data-close-modal")) closeModal();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  menuToggle?.addEventListener("click", () => {
    const open = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
});