import LegacyPage from "./components/LegacyPage";
import FordHome3DMount from "./components/FordHome3DMount";

const markup = `<header class="site-header">
<a class="brand" href="/carmodel/" aria-label="Classic Ford home"><span class="brand-mark">F</span><span>CLASSIC FORD<small>THE HERITAGE COLLECTION</small></span></a>
<button class="menu-toggle" id="menuToggle" aria-label="Toggle navigation" aria-expanded="false">☰</button>
<nav class="main-nav" id="mainNav" aria-label="Main navigation"><a class="active" href="/carmodel/">Home</a><a href="/carmodel/models/">Models</a><a href="/carmodel/heritage/">Heritage</a><a href="/carmodel/contact/">Contact</a></nav>
<a class="header-cta" href="/carmodel/models/">Explore models <span>↗</span></a>
</header>
<main class="page-shell">
<section class="home-main-grid" aria-label="Classic Ford introduction and 3D studio">
<section class="home-hero-card">
<div class="home-hero-copy"><span class="eyebrow">A LEGACY THAT KEEPS MOVING</span><h1>Built to be<br><em>remembered.</em></h1><p>For generations, Ford has turned ambitious ideas into machines that changed the way people work, travel and experience the open road.</p><div class="hero-actions"><a class="button button-orange" href="/carmodel/models/">Explore the collection <span>↗</span></a><a class="text-link" href="/carmodel/heritage/">Our story ↗</a></div></div>
<div class="home-hero-photo"><img src="/carmodel/assets/images/Ford_GT-40.jpg" alt="Ford GT40 in a classic motorsport setting" loading="eager" fetchpriority="high" decoding="async"></div>
<div class="home-hero-highlights"><div><strong>1903</strong><span>THE BEGINNING</span></div><div><strong>120+</strong><span>YEARS OF HISTORY</span></div><div><strong>LEGENDS</strong><span>BUILT TO LAST</span></div></div>
</section>
<section class="home-studio-card" aria-labelledby="homeStudioTitle">
<div class="home-studio-heading"><span class="eyebrow">A CLOSER LOOK AT THE CRAFT</span><h2 id="homeStudioTitle">Design in three dimensions.<br><em>Explore every detail.</em></h2><p>Take a closer look at the form, details and character behind a classic Ford.</p></div>
<div class="home-single-viewer" id="homeModelMount"></div>
<div class="home-studio-note"><span>ONE VIEWER · MULTIPLE CLASSIC MODELS</span><a href="/carmodel/models/">Explore all models ↗</a></div>
</section>
</section>
<section class="home-lower-grid home-editorial-grid" aria-label="Ford heritage, engineering and design">
<section class="home-content-card home-engineering"><span class="eyebrow">A LEGACY OF INNOVATION</span><h2>Making progress<br><em>part of the journey.</em></h2><div class="home-content-image"><img src="/carmodel/assets/images/ford-v8.png" alt="Classic Ford V8 engineering heritage" loading="lazy" decoding="async"></div><p>Ford's story is one of bold ideas becoming everyday realities. From new approaches to production to enduring engineering, each generation has helped shape how the world moves.</p><a class="text-link" href="/carmodel/heritage/">Explore the story ↗</a></section>
<section class="home-content-card home-heritage"><span class="eyebrow">DESIGN · PERFORMANCE · CULTURE</span><h2>Built for the road.<br><em>Remembered everywhere.</em></h2><div class="home-content-image"><img src="/carmodel/assets/images/ford-thunderbird.png" alt="Classic Ford Thunderbird design" loading="lazy" decoding="async"></div><p>From the racetrack to the open road, Ford vehicles have become part of people's lives, memories and milestones. Their influence reaches far beyond the machines themselves.</p><a class="text-link" href="/carmodel/heritage/">Discover the heritage ↗</a></section>
</section>
<section class="home-story-row" aria-labelledby="homeOriginsTitle">
<div class="home-story-heading"><span class="eyebrow">THE STORY SO FAR</span><h2 id="homeOriginsTitle">A journey that began<br><em>over a century ago.</em></h2></div>
<div class="home-story-copy"><p>From the early days of the automobile to generations of unmistakable machines, Ford's history reflects a belief in making movement more accessible and possibility more real.</p><a class="text-link" href="/carmodel/heritage/">Explore the timeline ↗</a></div>
</section>
<section class="home-story-row home-story-reverse" aria-labelledby="homeMotorsportTitle">
<div class="home-story-heading"><span class="eyebrow">BUILT TO BE TESTED</span><h2 id="homeMotorsportTitle">From the track<br><em>to the open road.</em></h2></div>
<div class="home-story-copy"><p>Competition has always pushed engineering forward. The lessons of performance, durability and design continue to shape the character of the cars enthusiasts remember.</p><a class="text-link" href="/carmodel/models/">Discover the collection ↗</a></div>
</section>
<div class="home-split-panels">
<section class="home-milestones" aria-labelledby="homeMilestonesTitle">
<div class="home-extra-heading"><div><span class="eyebrow">LOOK CLOSER</span><h2 id="homeMilestonesTitle">Details make the <em>difference.</em></h2></div><p>When viewing a classic, the character often lives in the details.</p></div>
<div class="home-milestone-grid">
<article><span class="home-milestone-year">01</span><h3>Body proportions</h3><p>Notice the balance between bonnet, cabin and rear body. Small changes define each model's personality.</p></article>
<article><span class="home-milestone-year">02</span><h3>Signature profile</h3><p>Roofline, grille shape and wheel placement help distinguish one generation from another.</p></article>
<article><span class="home-milestone-year">03</span><h3>Interior character</h3><p>Dashboard layout, materials and controls reveal the priorities of the era in which a car was made.</p></article>
<article><span class="home-milestone-year">04</span><h3>Mechanical details</h3><p>Engine layout, suspension design and drivetrain choices explain how a vehicle was intended to be used.</p></article>
</div>
</section>
<section class="home-discover" aria-labelledby="homeDiscoverTitle">
<div class="home-extra-heading"><div><span class="eyebrow">A SMARTER WAY TO APPRECIATE A CLASSIC</span><h2 id="homeDiscoverTitle">What to check <em>before you choose.</em></h2></div><p>A few practical checks can help you understand a classic vehicle beyond its appearance.</p></div>
<div class="home-discover-grid">
<div><span class="home-discover-index">01 / CONDITION</span><strong>Look beyond the shine</strong><small>Check panel alignment, corrosion-prone areas, underbody condition and signs of previous repairs.</small></div>
<div><span class="home-discover-index">02 / ORIGINALITY</span><strong>Understand what is original</strong><small>Compare key components, trim, engine details and finishes with the correct model-year specification.</small></div>
<div><span class="home-discover-index">03 / HISTORY</span><strong>Ask for its story</strong><small>Service records, ownership documents and restoration photographs help build a clearer picture.</small></div>
</div>
</section>
</div>
<section class="home-closing"><span class="eyebrow">THE SPIRIT OF FORD</span><h2>More than machines.<br><em>A lasting legacy.</em></h2><p>Discover the stories, ideas and engineering that continue to inspire.</p><a class="button button-orange" href="/carmodel/heritage/">Explore the heritage <span>↗</span></a></section>
<footer class="site-footer"><a class="brand" href="/carmodel/"><span class="brand-mark">F</span><span>CLASSIC FORD<small>THE HERITAGE COLLECTION</small></span></a><p>A visual tribute to the cars that moved generations.</p><p class="image-credits">Vehicle photographs are loaded locally from the project's assets/images folder.</p><div class="footer-bottom"><span>© 2026 Classic Ford Collection</span><span>Built for automotive enthusiasts</span></div></footer>
</main>`;
const scripts = ["/carmodel/index.js", "/carmodel/assets/js/local-3d-viewer.js"];

export default function Page() {
  return <><LegacyPage markup={markup} scripts={scripts} /><FordHome3DMount /></>;
}
