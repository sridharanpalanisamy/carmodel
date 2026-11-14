"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const featuredModels = [
  { name: "Ford Model T", year: "1908", period: "1908 — 1927", type: "classic", era: "1900", image: "ford_model_t.png", description: "The car that brought affordable motoring to millions." },
  { name: "Ford Model A", year: "1927", period: "1927 — 1931", type: "classic", era: "1900", image: "ford-model-a.png", description: "A new generation of styling, comfort and engineering." },
  { name: "Ford V8", year: "1932", period: "1932 onward", type: "classic", era: "1930", image: "ford-v8.png", description: "The flathead V8 made eight-cylinder power more accessible." },
  { name: "Ford Deluxe Coupe", year: "1940", period: "1940", type: "classic", era: "1930", image: "ford_deluxe.png", description: "Pre-war styling with the character of Ford's V8 era." },
  { name: "Ford Thunderbird", year: "1955", period: "1955 — 2005", type: "luxury", era: "1950", image: "ford-thunderbird.png", description: "American personal luxury and grand-touring style." },
  { name: "Ford F-100", year: "1953", period: "1953 — 1983", type: "utility", era: "1950", image: "ford-f100.png", description: "A landmark name in the long-running F-Series pickup story." },
  { name: "Ford Mustang", year: "1964", period: "1964 — TODAY", type: "sports", era: "1960", image: "ford-mustang.png", description: "An enduring performance icon with unmistakable proportions.", eager: true },
  { name: "Ford GT40", year: "1964", period: "1964 — 1969", type: "sports", era: "1960", image: "Ford_GT-40.jpg", description: "A racing legend celebrated for its Le Mans success." },
  { name: "Ford Bronco", year: "1966", period: "1966 — TODAY", type: "utility", era: "1960", image: "ford-bronco.png", description: "A rugged off-road name built around exploration." },
  { name: "Ford Falcon", year: "1960", period: "1960 — 1970", type: "classic", era: "1960", image: "ford-falcon.png", description: "A practical compact that helped shape the Mustang story." },
  { name: "Ford Pinto", year: "1971", period: "1971 — 1980", type: "classic", era: "1970", image: "ford-pinto.png", description: "A subcompact reflecting the priorities of the 1970s." }
];

export default function FeaturedModels() {
  const [mount, setMount] = useState(null);

  useEffect(() => {
    setMount(document.getElementById("modelGrid"));
  }, []);

  if (!mount) return null;

  return createPortal(
    featuredModels.map((model, index) => (
      <article
        className="model-card"
        data-name={model.name.toLowerCase()}
        data-year={model.year}
        data-type={model.type}
        data-era={model.era}
        data-index={index}
        key={model.name}
      >
        <a href="#model-detail" className="model-image" data-gallery={index}>
          <img
            src={"/carmodel/assets/images/" + model.image}
            alt={model.name}
            loading={model.eager ? "eager" : "lazy"}
            decoding="async"
          />
          <span>{model.period}</span>
        </a>
        <div className="model-copy">
          <span className="eyebrow">CLASSIC FORD / {String(index + 1).padStart(2, "0")}</span>
          <h3>{model.name}</h3>
          <p>{model.description}</p>
          <div className="card-actions">
            <a href="/carmodel/heritage/">Discover its story ↗</a>
            <button className="save-model" type="button" aria-label={"Save " + model.name} aria-pressed="false">♡</button>
            <label className="compare-check"><input type="checkbox" className="compare-model" /> Compare</label>
          </div>
        </div>
      </article>
    )),
    mount
  );
}
