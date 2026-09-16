import { useSiteContent } from "../cms/SiteContent";

export default function Sobre() {
  const { content } = useSiteContent();
  return <section className="section about-section" id="sobre">
    <div className="container about-layout">
      <figure className="about-media" data-reveal>
        <img src={content.hero.image} alt={content.hero.imageAlt} loading="lazy" />
        <span className="about-frame" aria-hidden="true" />
      </figure>
      <div className="about-copy" data-reveal>
        <p className="section-eyebrow">{content.about.eyebrow}</p>
        <h2 className="section-title">{content.about.title}</h2>
        <p className="text-editorial text-lead">{content.about.description}</p>
        <p className="text-editorial">{content.about.secondary}</p>
        <a className="btn primary" href="#contato">Conversar sobre um projeto</a>
      </div>
    </div>
  </section>;
}
