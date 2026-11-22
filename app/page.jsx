import LegacyPage from "./components/LegacyPage";
import FordHome3DMount from "./components/FordHome3DMount";

const markup = `<header class="site-header">
<a class="brand" href="/carmodel/" aria-label="Classic Ford home"><span class="brand-mark">F</span><span>CLASSIC FORD<small>THE HERITAGE COLLECTION</small></span></a>
<button class="menu-toggle" id="menuToggle" aria-label="Toggle navigation" aria-expanded="false">☰</button>
<nav class="main-nav" id="mainNav" aria-label="Main navigation"><a class="active" href="/carmodel/">Home</a><a href="/carmodel/models/">Models</a><a href="/carmodel/heritage/">Heritage</a><a href="/carmodel/contact/">Contact</a></nav>
<a class="header-cta" href="/carmodel/models/">Explore models <span>↗</span></a>
</header>
<main class="page-shell">

<div class="home-layout">
<div class="left-column">
<section class="hero-panel">
<div class="hero-photo"><img src="/carmodel/assets/images/Ford_GT-40.jpg" alt="Ford GT40 in a classic motorsport setting" loading="eager" fetchpriority="high" decoding="async"></div>
<div class="hero-intro">
<div class="hero-brand"><h1>Classic Ford<span>.</span></h1><p>Driven by history.<br>Designed to be remembered.</p></div>
<div class="hero-description"><p>From the first Model T to racing icons and timeless road cars, discover the machines that shaped generations of motoring.</p><div class="hero-actions"><a class="button button-orange" href="/carmodel/models/">Explore the collection <span>↗</span></a><a class="text-link" href="/carmodel/heritage/">Our story ↗</a></div></div>
</div>
<div class="feature-car">
<div class="feature-copy"><span class="eyebrow">A LEGACY IN MOTION</span><h2>Made to move<br>the world.</h2><p>More than a century of ideas, engineering and unforgettable design.</p></div>
<img src="/carmodel/assets/images/ford-mustang.png" alt="Classic Ford Mustang" loading="lazy" decoding="async">
</div>
<div class="milestone-row"><div><strong>1903</strong><span>THE BEGINNING</span></div><div><strong>120<span>+</span></strong><span>YEARS OF HISTORY</span></div><div><strong>LEGENDS</strong><span>BUILT TO LAST</span></div></div>
</section>
<section class="process-panel">
<div class="process-heading"><div><span class="eyebrow">ENGINEERING &amp; CRAFT</span><h2>Ideas that changed<br>the <em>road ahead.</em></h2></div><p>Explore the design thinking, manufacturing breakthroughs and motorsport ambition behind the badge.</p></div>
<div class="process-visual"><img src="/carmodel/assets/images/ford-v8.png" alt="Classic Ford V8 engineering heritage" loading="lazy" decoding="async"><div class="process-note"><span>01 / ENGINEERING</span><strong>Innovation with purpose.</strong><p>From accessible mass production to performance engineering, progress has always been part of the story.</p></div></div>
</section>
</div>
<aside class="right-column">
<section class="innovation-panel">
<div class="innovation-title"><span class="eyebrow">THE FORD STORY</span><h2>Icons never<br>stand still.</h2><a class="button button-orange" href="/carmodel/heritage/">Discover our heritage ↗</a></div>
<div class="innovation-image"><img src="/carmodel/assets/images/ford-thunderbird.png" alt="Ford Thunderbird" loading="lazy" decoding="async"><div class="image-caption">THE THUNDERBIRD / AN AMERICAN ORIGINAL</div></div>
<div class="innovation-grid">
<a href="home.html#performance"><span>01 / PERFORMANCE</span><strong>Racing spirit<br>and speed.</strong><b>↗</b></a>
<a href="home.html#classics"><span>02 / CLASSICS</span><strong>Design that<br>stands the test.</strong><b>↗</b></a>
<a href="home.html#utility"><span>03 / UTILITY</span><strong>Built for work<br>and adventure.</strong><b>↗</b></a>
</div>
</section>
<section class="orange-feature">
<div><span class="eyebrow">THE COLLECTION</span><h2>One name.<br>Many legends.</h2><p>Meet the cars that defined eras, inspired drivers and made history.</p><a href="/carmodel/models/">Browse all models ↗</a></div>
<div class="orange-art" aria-hidden="true"><span>F</span><span>FORD</span></div>
</section>




</aside>
<div class="home-bottom-row"><section class="latest-panel">
<div class="latest-heading"><div><span class="eyebrow">SELECTED ICONS</span><h2>Explore the classics.</h2></div><a href="/carmodel/models/">All models ↗</a></div>
<div class="latest-feature"><img src="/carmodel/assets/images/Ford_GT-40.jpg" alt="Ford GT40" loading="lazy" decoding="async"><div><span>1964 — 1969 / MOTORSPORT</span><strong>Ford GT40</strong><a href="/carmodel/models/">Discover ↗</a></div></div>
<div class="mini-cars">
<a href="/carmodel/models/"><img src="/carmodel/assets/images/ford_model_t.png" alt="Ford Model T" loading="lazy" decoding="async"><span>Model T<small>THE ORIGINAL</small></span></a>
<a href="/carmodel/models/"><img src="/carmodel/assets/images/ford-bronco.png" alt="Ford Bronco" loading="lazy" decoding="async"><span>Bronco<small>OFF-ROAD SPIRIT</small></span></a>
<a href="/carmodel/models/"><img src="/carmodel/assets/images/ford-f100.png" alt="Ford F-100" loading="lazy" decoding="async"><span>F-100<small>BUILT FOR WORK</small></span></a>
</div>
</section>
<section class="quote-panel"><span class="eyebrow">THE SPIRIT OF FORD</span><blockquote>“The road to tomorrow is built on the ideas of yesterday.”</blockquote><a href="/carmodel/heritage/">Explore the heritage ↗</a></section></div>
<section class="turntable-panel home-model-t-panel home-studio-panel" aria-labelledby="turntableTitle">
  <div class="studio-intro">
    <div><span class="eyebrow">INTERACTIVE FORD STUDIO</span><h2 id="turntableTitle">Explore the icons.<br><em>From every angle.</em></h2><p>Step inside the collection. Rotate, inspect and compare two classic Ford vehicles in the interactive 3D studio.</p></div>
    <a class="button button-orange" href="/carmodel/models/">Explore all models <span>↗</span></a>
  </div>
  <div class="studio-view-grid">
    <section class="studio-view-card" aria-labelledby="studioMustangTitle">
      <div class="studio-view-heading"><div><span class="eyebrow">01 / THE FASTBACK</span><h3 id="studioMustangTitle">1967 Mustang Fastback</h3></div><span class="studio-view-number">01</span></div>
      <div class="viewer-toolbar"><span class="viewer-count">INTERACTIVE 3D MODEL</span><span aria-live="polite">Drag to rotate · Scroll to zoom</span></div>
      <div class="viewer-frame"><div id="homeModelMustangMount"></div></div>
    </section>
    <section class="studio-view-card" aria-labelledby="studioModelTTitle">
      <div class="studio-view-heading"><div><span class="eyebrow">02 / THE ORIGINAL</span><h3 id="studioModelTTitle">Ford Model T</h3></div><span class="studio-view-number">02</span></div>
      <div class="viewer-toolbar"><span class="viewer-count">INTERACTIVE 3D MODEL</span><span aria-live="polite">Drag to rotate · Scroll to zoom</span></div>
      <div class="viewer-frame"><div id="homeModelTMount"></div></div>
    </section>
  </div>
  <div class="studio-footer"><p>Choose a model to explore. Both viewers support rotation, zoom and reset controls.</p><a class="text-link" href="/carmodel/heritage/">Discover the Ford story ↗</a></div>
  <p class="model-disclaimer">Community-created 3D models; not official Ford factory scans. Creator credits and licenses are listed with each model.</p>
</section>
</div>
<footer class="site-footer"><a class="brand" href="/carmodel/"><span class="brand-mark">F</span><span>CLASSIC FORD<small>THE HERITAGE COLLECTION</small></span></a><p>A visual tribute to the cars that moved generations.</p><p class="image-credits">Vehicle photographs are loaded locally from the project's assets/images folder.</p><div class="footer-bottom"><span>© 2026 Classic Ford Collection</span><span>Built for automotive enthusiasts</span></div></footer>
</main>`;
const scripts = ["/carmodel/index.js", "/carmodel/assets/js/local-3d-viewer.js"];

export default function Page() {
  return <><LegacyPage markup={markup} scripts={scripts} /><FordHome3DMount /></>;
}
