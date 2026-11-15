import LegacyPage from "../components/LegacyPage";
import InteractiveHeritageTimeline from "../components/InteractiveHeritageTimeline";
import AtoZDirectory from "../components/AtoZDirectory";

const markup = `<main class="page-shell inner-page">
<section class="inner-hero"><div><span class="eyebrow">A LEGACY IN MOTION / SINCE 1903</span><h1>More than a century<br>of <em>moving forward.</em></h1><p>From a simple idea to a global automotive story, Ford's history is filled with bold engineering, memorable design and machines that changed how people move.</p><a class="button button-orange" href="/carmodel/models/">Explore the collection ↗</a></div><img src="/carmodel/assets/images/ford_model_t.png" alt="Ford Model T" loading="lazy" decoding="async"></section>
<section class="inner-feature"><img src="/carmodel/assets/images/Ford_GT-40.jpg" alt="Ford GT40 racing car" loading="eager" fetchpriority="high" decoding="async"><div><span class="eyebrow">THE RACING YEARS</span><h2>Built to challenge<br>the <em>impossible.</em></h2><p>The GT40 became one of Ford's defining motorsport stories, taking four consecutive overall victories at the 24 Hours of Le Mans from 1966 to 1969.</p><a href="/carmodel/models/">Meet the GT40 ↗</a></div></section>
<div id="interactiveHeritageTimelineMount"></div>
<section class="heritage-directory-section az-heritage-section"><div id="azArchiveMount"></div></section>
</main>
<footer class="site-footer inner-footer"><a class="brand" href="/carmodel/"><span class="brand-mark">F</span><span>CLASSIC FORD<small>THE HERITAGE COLLECTION</small></span></a><p>A visual tribute to the cars that moved generations.</p><p class="image-credits">Image credits: Ford Mustang 1965 — Bene Riobó; Ford GT40 — Calreyn88. Wikimedia Commons, CC BY-SA 4.0.</p><div class="footer-bottom"><span>© 2026 Classic Ford Collection</span><span>Built for automotive enthusiasts</span></div></footer>`;
export default function Page(){return <><link rel="stylesheet" href="/carmodel/pages.css?v=20261115-heritage-directory"/><LegacyPage markup={markup}/><InteractiveHeritageTimeline/><AtoZDirectory/></>;}
