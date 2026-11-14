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

document.addEventListener("DOMContentLoaded",()=>{
 const viewer=document.getElementById("classicCarViewer");
 const reset=document.getElementById("resetCarView");
 const fullscreen=document.getElementById("fullscreenCar");
 if(!viewer)return;
 if(reset)reset.addEventListener("click",()=>{
  viewer.cameraOrbit="0deg 75deg 105%";
  viewer.cameraTarget="auto";
  viewer.fieldOfView="auto";
  viewer.jumpCameraToGoal();
 });
 if(fullscreen)fullscreen.addEventListener("click",async()=>{
  try{
   if(document.fullscreenElement)await document.exitFullscreen();
   else if(viewer.requestFullscreen)await viewer.requestFullscreen();
   else if(viewer.webkitRequestFullscreen)viewer.webkitRequestFullscreen();
  }catch(error){fullscreen.textContent="Full screen unavailable"}
 });
});
