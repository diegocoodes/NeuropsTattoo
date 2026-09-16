import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import SplitText from "../components/SplitText";
import { useSiteContent } from "../cms/SiteContent";

export default function Hero() {
  const scopeRef = useRef(null);
  const { content } = useSiteContent();
  const { hero } = content;

  useLayoutEffect(() => {
    if (navigator.webdriver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const targets = [".hero-title", ".hero-subtitle", ".hero-actions", ".hero-photo-frame"];
      gsap.set(targets, { opacity: 0 });
      gsap.timeline({ delay: 1.15, defaults: { ease: "power3.out" } })
        .fromTo(".hero-title", { y: 24 }, { y: 0, opacity: 1, duration: 0.9 })
        .to(".hero-subtitle", { y: 0, opacity: 1, duration: 0.8 }, "-=0.4")
        .to(".hero-actions", { y: 0, opacity: 1, duration: 0.7 }, "-=0.4")
        .to(".hero-photo-frame", { opacity: 1, duration: 0.8 }, "-=0.5");
    }, scopeRef);
    return () => ctx.revert();
  }, []);

  const whatsappLink = `https://wa.me/${content.contact.whatsapp}?text=${encodeURIComponent("Olá! Quero agendar um horário. Posso enviar minha referência e medidas?")}`;

  return <section ref={scopeRef} className="hero" id="top" aria-label="Apresentação">
    <div className="container hero-content hero-grid" style={{ position: "relative", zIndex: 1 }}>
      <div className="hero-left">
        <div className="hero-title">
          <img src={content.brand.symbol} alt={`Símbolo ${content.brand.name}`} className="hero-logo" loading="eager" draggable={false} />
          <SplitText text={hero.title} tag="h1" className="hero-h1" delay={42} duration={1.1} ease="power3.out" splitType="chars" from={{ opacity: 0, y: 34 }} to={{ opacity: 1, y: 0 }} threshold={0.1} rootMargin="-120px" textAlign="left" />
          <SplitText text={hero.titleAccent} tag="h1" className="hero-h1 accent" delay={36} duration={1.05} ease="power3.out" splitType="chars" from={{ opacity: 0, y: 34 }} to={{ opacity: 1, y: 0 }} threshold={0.1} rootMargin="-120px" textAlign="left" />
        </div>
        <p className="hero-subtitle">{hero.description}</p>
        <div className="hero-actions"><a className="btn primary" href={whatsappLink} target="_blank" rel="noreferrer">{hero.primaryButton}</a><a className="btn ghost" href="#trabalhos">{hero.secondaryButton}</a></div>
      </div>
      <div className="hero-right">
        <div className="hero-photo-frame"><img src={hero.image} alt={hero.imageAlt} className="hero-photo" loading="eager" /><div className="hero-photo-glow" /></div>
      </div>
    </div>
  </section>;
}
