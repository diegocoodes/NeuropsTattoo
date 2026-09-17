import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSiteContent } from "../cms/SiteContent";

const links = [
  ["Sobre", "sobre"],
  ["Portfólio", "trabalhos"],
  ["Serviços", "servicos"],
  ["Contato", "contato"],
  ["Estúdio", "localizacao"],
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const { content } = useSiteContent();
  const whatsappLink = `https://wa.me/${content.contact.whatsapp}?text=${encodeURIComponent("Olá! Quero conversar sobre um projeto.")}`;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (!("IntersectionObserver" in window)) {
      return () => window.removeEventListener("scroll", onScroll);
    }

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id); }),
      { rootMargin: "-35% 0px -55%", threshold: 0 },
    );
    links.forEach(([, id]) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  const close = () => setOpen(false);

  return <><header className={`navbar${scrolled ? " is-scrolled" : ""}`}>
    <div className="container navbar-inner">
      <a href="#top" className="brand" aria-label={`${content.brand.name} ${content.brand.suffix}`} onClick={close}>
        <img src={content.brand.logo} alt="" className="brand-logo" draggable={false} />
        <div className="brand-text"><span className="brand-title">{content.brand.name}</span><span className="brand-title accent">{content.brand.suffix}</span></div>
      </a>

      <div className="nav-desktop-wrap">
        <nav className="nav nav-desktop" aria-label="Navegação principal">
          {links.map(([label, id]) => <a key={id} href={`#${id}`} className={active === id ? "active" : ""}>{label}</a>)}
        </nav>
        <a className="nav-action" href={whatsappLink} target="_blank" rel="noreferrer">Agendar</a>
      </div>

      <button className="nav-toggle" type="button" aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className={open ? "bar bar1 open" : "bar bar1"} /><span className={open ? "bar bar2 open" : "bar bar2"} /><span className={open ? "bar bar3 open" : "bar bar3"} />
      </button>
    </div>
  </header>

    {createPortal(<div className={open ? "mobile-drawer open" : "mobile-drawer"} role="dialog" aria-modal="true" aria-label="Menu principal">
      <button className="drawer-backdrop" aria-label="Fechar menu" onClick={close} />
      <div className="drawer-panel">
        <div className="drawer-head">
          <a href="#top" className="drawer-brand" onClick={close}><img src={content.brand.logo} alt="" className="drawer-logo" /><div className="drawer-title"><span>{content.brand.name}</span> <span className="accent">{content.brand.suffix}</span></div></a>
          <button className="drawer-close" onClick={close}>Fechar</button>
        </div>
        <div className="drawer-intro">
          <p>Menu</p>
          <span>Conheça o trabalho, o processo e o estúdio.</span>
        </div>
        <nav className="nav-mobile" aria-label="Navegação mobile">{links.map(([label, id]) => <a key={id} href={`#${id}`} className={active === id ? "active" : ""} aria-current={active === id ? "page" : undefined} onClick={close}><span>{label}</span><span className="nav-mobile-line" aria-hidden="true" /></a>)}</nav>
        <div className="drawer-actions"><a className="btn primary" href={whatsappLink} target="_blank" rel="noreferrer" onClick={close}>{content.hero.primaryButton}</a></div>
      </div>
    </div>, document.body)}
  </>;
}
