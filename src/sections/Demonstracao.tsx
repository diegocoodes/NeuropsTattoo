import { useState } from "react";
import { useSiteContent, type VideoItem } from "../cms/SiteContent";

function ReelVideo({ item, slot }: { item?: VideoItem; slot: number }) {
  const [available, setAvailable] = useState(Boolean(item));

  return (
    <div className={`reel-slot${available ? " has-video" : ""}`} data-reveal-item>
      {item && <video
        className="reel-video"
        controls
        playsInline
        preload="metadata"
        aria-label={item.title || `Demonstração em vídeo ${slot}`}
        onLoadedMetadata={() => setAvailable(true)}
        onError={() => setAvailable(false)}
      >
        <source src={item.video} />
      </video>}
      {!available && <div className="reel-placeholder" aria-label={`Espaço para vídeo vertical ${slot}`}>
        <span className="reel-play" aria-hidden="true">▶</span>
        <span>Vídeo em breve</span>
        <small>Formato vertical 9:16</small>
      </div>}
    </div>
  );
}

export default function Demonstracao() {
  const { content } = useSiteContent();
  const demonstration = content.demonstration;
  const slots = Array.from({ length: Math.max(3, demonstration.items.length) }, (_, index) => demonstration.items[index]);

  return (
    <section className="section section-dark demo-section" id="demonstracao" aria-labelledby="demonstracao-title">
      <div className="container">
        <div className="section-intro" data-reveal>
          <div>
            <p className="section-eyebrow">{demonstration.eyebrow}</p>
            <h2 className="section-title" id="demonstracao-title">{demonstration.title}</h2>
          </div>
          <p className="text-editorial text-lead">
            {demonstration.description}
          </p>
        </div>

        <div className="reels-grid" data-reveal-group>
          {slots.map((item, index) => <ReelVideo key={item?.video ?? `slot-${index}`} item={item} slot={index + 1} />)}
        </div>
      </div>
    </section>
  );
}
