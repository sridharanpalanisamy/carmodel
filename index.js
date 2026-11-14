document.addEventListener("DOMContentLoaded",()=>{const toggle=document.getElementById("menuToggle");const nav=document.getElementById("mainNav");if(toggle&&nav){toggle.addEventListener("click",()=>{const open=nav.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open))});nav.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>{nav.classList.remove("open");toggle.setAttribute("aria-expanded","false")}));}});
document.addEventListener("DOMContentLoaded",()=>{
 const viewer=document.getElementById("classicCarViewer");
 const toggle=document.getElementById("toggleAutoRotate");
 if(!viewer||!toggle)return;
 toggle.addEventListener("click",()=>{
  const shouldPause=viewer.hasAttribute("auto-rotate");
  if(shouldPause){viewer.removeAttribute("auto-rotate");toggle.textContent="Resume rotation ▶";toggle.setAttribute("aria-pressed","false")}
  else{viewer.setAttribute("auto-rotate","");toggle.textContent="Pause rotation Ⅱ";toggle.setAttribute("aria-pressed","true")}
 });
});
