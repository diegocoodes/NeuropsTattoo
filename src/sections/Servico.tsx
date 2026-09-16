import { useSiteContent } from "../cms/SiteContent";

export default function Servicos() {
  const { content } = useSiteContent();
  return <section className="section section-dark services-section" id="servicos">
    <div className="container">
      <div className="section-intro" data-reveal>
        <div><p className="section-eyebrow">{content.services.eyebrow}</p><h2 className="section-title">{content.services.title}</h2></div>
        <p className="text-editorial text-lead">{content.services.description}</p>
      </div>
      <div className="services-grid" data-reveal-group>
        {content.services.items.map((service) => <article className="card service" key={service.title} data-reveal-item><span className="service-rule" /><h3>{service.title}</h3><p className="text-editorial">{service.description}</p></article>)}
      </div>
    </div>
  </section>;
}
