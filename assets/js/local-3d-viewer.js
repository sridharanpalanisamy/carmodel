/* Local procedural Ford 3D viewer. No remote libraries, embeds, or viewer services. */
(() => {
  "use strict";
  const palette = { ink:"#202126", orange:"#e95a2b", body:"#b8c0c4", glass:"#263d4b", rubber:"#17191c", metal:"#d5d7d8" };
  const familyFor = name => {
    const n=name.toLowerCase();
    if(/bronco|explorer|escape|expedition|excursion|ranger|maverick|suv/.test(n)) return "suv";
    if(/f-100|f-series|transit|econoline|e-series|pickup/.test(n)) return "pickup";
    if(/gt40|^gt$|mustang|capri|thunderbird|probe|sports/.test(n)) return "sports";
    if(/model t|model a|v8|deluxe|anglia|consul|cortina|fairlane|galaxie|granada|falcon|crown victoria|ltd|taurus|tempo|sierra|scorpio|mondeo|contour|five hundred/.test(n)) return "classic";
    if(/van|windstar|freestar|c-max|s-max|b-max/.test(n)) return "van";
    return "compact";
  };
  const safeName = s => String(s || "Ford concept").replace(/[<>]/g,"");
  function createViewer(canvas, name, status) {
    const ctx=canvas.getContext("2d");
    if(!ctx) { if(status) status.textContent="Your browser does not support the local 3D canvas."; return null; }
    let yaw=-0.58, pitch=0.18, zoom=1, dragging=false, lastX=0,lastY=0,auto=true,raf=0;
    const family=familyFor(name);
    const dims=({sports:[2.25,.56,.82],classic:[2.05,.7,.84],suv:[1.95,.92,.9],pickup:[2.15,.78,.9],van:[2.2,.88,.94],compact:[1.82,.64,.8]})[family];
    const [length,height,width]=dims;
    const vertices=[];
    function project(p,w,h) {
      const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
      const x=p[0]*cy-p[2]*sy, z=p[0]*sy+p[2]*cy, y=p[1]*cp-z*sp, depth=p[1]*sp+z*cp;
      const f=4.5/(4.5+depth), scale=Math.min(w,h)*.34*zoom;
      return [w/2+x*scale*f,h*.57-y*scale*f,depth];
    }
    function addBox(x1,x2,y1,y2,z1,z2,color,stroke) {
      const v=[[x1,y1,z1],[x2,y1,z1],[x2,y2,z1],[x1,y2,z1],[x1,y1,z2],[x2,y1,z2],[x2,y2,z2],[x1,y2,z2]];
      const faces=[[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]];
      faces.forEach((face,i)=>{const pts=face.map(k=>v[k]);const avg=pts.reduce((a,p)=>a+project(p,canvas.clientWidth,canvas.clientHeight)[2],0)/4;vertices.push({pts,color:i===0?color:i===1?shade(color,-24):i===2?shade(color,-12):i===3?shade(color,12):shade(color,20),stroke,depth:avg});});
    }
    function shade(hex,amt){const n=parseInt(hex.slice(1),16);const r=Math.max(0,Math.min(255,(n>>16)+amt)),g=Math.max(0,Math.min(255,((n>>8)&255)+amt)),b=Math.max(0,Math.min(255,(n&255)+amt));return "#"+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);}
    function addWheel(x,z) {
      const pts=[];for(let i=0;i<24;i++){const a=i*Math.PI*2/24;pts.push([x+Math.cos(a)*.24,.25+Math.sin(a)*.24,z]);}
      const avg=pts.reduce((a,p)=>a+project(p,canvas.clientWidth,canvas.clientHeight)[2],0)/pts.length;
      vertices.push({pts,color:palette.rubber,stroke:"#555b60",depth:avg});
      const hub=pts.map(p=>[x+(p[0]-x)*.55,.25+(p[1]-.25)*.55,z+(z>0?.012:-.012)]);
      vertices.push({pts:hub,color:palette.metal,stroke:"#747a80",depth:avg-.01});
    }
    function build() {
      vertices.length=0;
      const paint=family==="sports"?"#b63e2d":family==="pickup"?"#87969a":family==="suv"?"#9b9b8c":family==="classic"?"#315a76":"#a9aeb3";
      addBox(-length/2,length/2,.34,.68,-width/2,width/2,paint,"#33383d");
      // Front and rear bumpers.
      addBox(length/2-.1,length/2+.04,.31,.4,-width*.54,width*.54,palette.metal,"#4b5054");
      addBox(-length/2-.04,-length/2+.1,.31,.4,-width*.54,width*.54,palette.metal,"#4b5054");
      // Cabin proportions differ by vehicle family.
      if(family==="pickup") {
        addBox(-.28,.48,.67,1.04,-width*.39,width*.39,paint,"#343b40");
        addBox(-.23,.42,.79,.98,-width*.405,width*.405,palette.glass,"#b6c3c9");
        addBox(-length/2+.18,-.34,.68,.88,-width*.48,width*.48,"#6b777e","#343b40");
      } else {
        const cabFront=family==="sports"?.52:.42, cabRear=family==="classic"?-.46:-.5, roof=family==="suv"?.98:family==="van"?.99:family==="sports"?.88:.94;
        addBox(cabRear,cabFront,.67,roof,-width*.39,width*.39,paint,"#343b40");
        addBox(cabRear+.08,cabFront-.07,.73,roof-.08,-width*.405,width*.405,palette.glass,"#c2cbd0");
      }
      // Wheels at both axles, both sides.
      const axle=family==="sports"?.68:.7;
      [-axle,axle].forEach(x=>[-width*.52,width*.52].forEach(z=>addWheel(x,z)));
      // Headlamp details.
      addBox(length/2-.025,length/2+.012,.48,.58,-width*.43,-width*.22,"#f1e6c6","#777");
      addBox(length/2-.025,length/2+.012,.48,.58,width*.22,width*.43,"#f1e6c6","#777");
    }
    function draw() {
      const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight),dpr=Math.min(window.devicePixelRatio||1,2);
      if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const grad=ctx.createLinearGradient(0,0,0,h);grad.addColorStop(0,"#e9e8e7");grad.addColorStop(1,"#c9c7c5");ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
      // Subtle showroom floor.
      ctx.strokeStyle="#9a999755";ctx.lineWidth=1;
      for(let i=-5;i<=5;i++){const a=project([i*.45,0,-2],w,h),b=project([i*.45,0,2],w,h);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();}
      ctx.fillStyle="#26282b18";ctx.beginPath();ctx.ellipse(w/2,h*.78,w*.25,Math.max(8,h*.045),0,0,Math.PI*2);ctx.fill();
      build();vertices.sort((a,b)=>b.depth-a.depth);
      vertices.forEach(face=>{const points=face.pts.map(p=>project(p,w,h));ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fillStyle=face.color;ctx.fill();ctx.strokeStyle=face.stroke||"#353a3f";ctx.lineWidth=1;ctx.stroke();});
      ctx.fillStyle="#292b2f";ctx.font="600 10px system-ui";ctx.textAlign="center";ctx.fillText("ILLUSTRATIVE LOCAL 3D CONCEPT",w/2,h-15);
      if(auto&&!dragging) yaw+=.0035;
      raf=requestAnimationFrame(draw);
    }
    function down(e){dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture?.(e.pointerId);}
    function move(e){if(!dragging)return;yaw+=(e.clientX-lastX)*.012;pitch=Math.max(-.25,Math.min(.55,pitch+(e.clientY-lastY)*.006));lastX=e.clientX;lastY=e.clientY;}
    function up(){dragging=false;}
    canvas.addEventListener("pointerdown",down);canvas.addEventListener("pointermove",move);canvas.addEventListener("pointerup",up);canvas.addEventListener("pointercancel",up);
    canvas.addEventListener("wheel",e=>{e.preventDefault();zoom=Math.max(.7,Math.min(1.55,zoom+(e.deltaY<0?.06:-.06)));},{passive:false});
    draw();
    return {reset(){yaw=-.58;pitch=.18;zoom=1;},toggle(){auto=!auto;return auto;},destroy(){cancelAnimationFrame(raf);canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointermove",move);canvas.removeEventListener("pointerup",up);canvas.removeEventListener("pointercancel",up);}};
  }
  function mountHome() {
    const canvas=document.getElementById("home3DCanvas"),select=document.getElementById("carModelSelect"),placeholder=document.getElementById("viewerPlaceholder"),video=document.getElementById("classicCar360Video"),status=document.getElementById("viewerStatus");
    if(!canvas||!select)return;
    let viewer;
    const start=()=>{if(viewer)viewer.destroy();const title=select.options[select.selectedIndex]?.text||"Ford";viewer=createViewer(canvas,title,status);canvas.hidden=false;if(placeholder)placeholder.hidden=true;if(video){video.pause();video.hidden=true;}if(status)status.textContent=title+" · local interactive 3D concept · drag to rotate";};
    const toolbar=document.createElement("div");toolbar.className="local3d-controls";toolbar.innerHTML='<button type="button" data-action="auto">Pause rotation</button><button type="button" data-action="reset">Reset view</button><span>Drag to rotate · scroll to zoom</span>';
    canvas.parentElement.appendChild(toolbar);
    toolbar.addEventListener("click",e=>{const b=e.target.closest("button");if(!b||!viewer)return;if(b.dataset.action==="reset")viewer.reset();if(b.dataset.action==="auto"){const on=viewer.toggle();b.textContent=on?"Pause rotation":"Resume rotation";}});
    select.addEventListener("change",start);start();
  }
  function mountDirectory() {
    const grid=document.getElementById("azGrid"),modelGrid=document.getElementById("modelGrid");
    if(!grid&&!modelGrid)return;
    let active=null;
    const dialog=document.createElement("dialog");dialog.className="local3d-dialog";dialog.innerHTML='<div class="local3d-dialog-head"><div><small>CLASSIC FORD / INTERACTIVE VIEW</small><h2 id="local3dTitle">Ford model</h2><p>Illustrative 3D concept — not a factory-accurate scan or verified production model.</p></div><button type="button" class="local3d-close" aria-label="Close 3D viewer">×</button></div><div class="local3d-stage"><canvas id="directory3DCanvas" aria-label="Interactive illustrative Ford vehicle model"></canvas></div><div class="local3d-controls"><button type="button" data-action="auto">Pause rotation</button><button type="button" data-action="reset">Reset view</button><span>Drag to rotate · scroll to zoom</span></div>';
    document.body.appendChild(dialog);
    const canvas=dialog.querySelector("canvas"),close=dialog.querySelector(".local3d-close"),controls=dialog.querySelector(".local3d-controls");
    function open(name){if(active)active.destroy();document.getElementById("local3dTitle").textContent="Ford "+safeName(name);active=createViewer(canvas,"Ford "+name);dialog.showModal();}
    close.addEventListener("click",()=>dialog.close());
    dialog.addEventListener("close",()=>{if(active){active.destroy();active=null;}});
    controls.addEventListener("click",e=>{const b=e.target.closest("button");if(!b||!active)return;if(b.dataset.action==="reset")active.reset();if(b.dataset.action==="auto"){const on=active.toggle();b.textContent=on?"Pause rotation":"Resume rotation";}});
    [grid,modelGrid].filter(Boolean).forEach(root=>root.addEventListener("click",e=>{const b=e.target.closest("[data-local3d]");if(!b)return;e.preventDefault();open(b.dataset.local3d);}));
  }
  document.addEventListener("DOMContentLoaded",()=>{mountHome();mountDirectory();});
})();