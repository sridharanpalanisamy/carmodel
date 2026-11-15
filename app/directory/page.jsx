import LegacyPage from "../components/LegacyPage";
import ModelDirectory from "../components/ModelDirectory";

const markup = "<main class=\"page-shell inner-page directory-page\"><section class=\"inner-hero collection-hero\"><div><span class=\"eyebrow\">THE COMPLETE NAMEPLATE INDEX</span><h1>Find every Ford.<br><em>A to Z.</em></h1><p>Explore the wider Ford nameplate archive in one dedicated place. Search by model name or browse alphabetically across passenger cars, performance icons, SUVs, pickups and commercial vehicles.</p><a class=\"button button-orange\" href=\"/carmodel/models/\">Featured models & specifications ↗</a></div><img src=\"/carmodel/assets/images/ford-mustang.png\" alt=\"Classic Ford Mustang\" loading=\"eager\" decoding=\"async\"></section><div id=\"azArchiveMount\"></div></main><footer class=\"site-footer inner-footer\"><a class=\"brand\" href=\"/carmodel/\"><span class=\"brand-mark\">F</span><span>CLASSIC FORD<small>THE HERITAGE COLLECTION</small></span></a><p>A visual tribute to the cars that moved generations.</p><p class=\"image-credits\">Vehicle photographs are loaded locally from the project's assets/images folder.</p><div class=\"footer-bottom\"><span>© 2026 Classic Ford Collection</span><span>Built for automotive enthusiasts</span></div></footer>";

const scripts = ["/carmodel/assets/js/local-3d-viewer.js"];

export default function DirectoryPage() {
  return <><link rel="stylesheet" href="/carmodel/pages.css" /><LegacyPage markup={markup} scripts={scripts} /><ModelDirectory /></>;
}
