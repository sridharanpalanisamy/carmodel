export default function ModelDialogs() {
  return (
    <>
      <div className="compare-dock" id="compareDock" hidden>
        <span><strong id="compareCount">0</strong> / 3 selected for comparison</span>
        <div>
          <button id="clearCompare" type="button">Clear</button>
          <button id="openCompare" className="button button-orange" type="button" disabled>Compare models ↗</button>
        </div>
      </div>
      <dialog className="feature-dialog" id="compareDialog" aria-labelledby="compareTitle">
        <div className="dialog-heading">
          <div><span className="eyebrow">SIDE-BY-SIDE</span><h2 id="compareTitle">Compare Ford models</h2></div>
          <button className="dialog-close" data-close="compareDialog" aria-label="Close comparison">×</button>
        </div>
        <div id="comparisonContent" className="comparison-content" />
      </dialog>
      <dialog className="gallery-dialog" id="galleryDialog" aria-label="Model photo gallery">
        <button className="dialog-close gallery-close" data-close="galleryDialog" aria-label="Close gallery">×</button>
        <button className="gallery-arrow previous" id="galleryPrevious" aria-label="Previous image">‹</button>
        <figure><img id="galleryImage" src="" alt="" decoding="async" /><figcaption id="galleryCaption" /></figure>
        <button className="gallery-arrow next" id="galleryNext" aria-label="Next image">›</button>
        <p className="gallery-help">Use ← and → keys to browse · Esc to close</p>
      </dialog>
    </>
  );
}
