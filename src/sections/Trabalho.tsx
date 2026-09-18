import { useEffect, useMemo, useState } from "react";
import { useSiteContent } from "../cms/SiteContent";

export default function Trabalhos() {
  const { content } = useSiteContent();
  const works = content.portfolio.items;
  const categories = useMemo(
    () => ["Todos", ...content.portfolio.categories],
    [content.portfolio.categories],
  );
  const [category, setCategory] = useState("Todos");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const activeCategory = categories.includes(category) ? category : "Todos";
  const visibleWorks = activeCategory === "Todos" ? works : works.filter((work) => work.category === activeCategory);
  const next = () => setIndex((current) => (current + 1) % visibleWorks.length);
  const prev = () => setIndex((current) => (current - 1 + visibleWorks.length) % visibleWorks.length);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowRight") setIndex((current) => (current + 1) % visibleWorks.length);
      if (event.key === "ArrowLeft") setIndex((current) => (current - 1 + visibleWorks.length) % visibleWorks.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, visibleWorks.length]);

  const chooseCategory = (nextCategory: string) => {
    setCategory(nextCategory);
    setIndex(0);
    setOpen(false);
  };

  return <>
    <section className="section" id="trabalhos" aria-label="Trabalhos">
      <div className="container">
        <div className="section-intro" data-reveal>
          <div><p className="section-eyebrow">{content.portfolio.eyebrow}</p><h2 className="section-title">{content.portfolio.title}</h2></div>
          <p className="text-editorial text-lead">{content.portfolio.description}</p>
        </div>

        <nav className="portfolio-categories" aria-label="Categorias de trabalhos" data-reveal>
          {categories.map((item) => <button key={item} type="button" className={activeCategory === item ? "active" : ""} aria-pressed={activeCategory === item} onClick={() => chooseCategory(item)}>{item}</button>)}
        </nav>

        <div className={`works-grid${activeCategory === "Todos" ? " works-grid--all" : ""}`} key={activeCategory} data-reveal-group>
          {visibleWorks.map((work, itemIndex) => <button key={`${work.image}-${itemIndex}`} type="button" className="work" aria-label={`Ampliar ${work.title}`} onClick={() => { setIndex(itemIndex); setOpen(true); }} data-reveal-item>
            <img src={work.image} alt={work.title} loading="lazy" />
          </button>)}
          {!visibleWorks.length && <p className="portfolio-empty">Ainda não há imagens nesta categoria.</p>}
        </div>
      </div>
    </section>

    {open && visibleWorks[index] && <div className="lightbox" role="dialog" aria-modal="true">
      <button className="lightbox-backdrop" aria-label="Fechar" onClick={() => setOpen(false)} />
      <div className="lightbox-content"><div className="lightbox-media"><img src={visibleWorks[index].image} alt={visibleWorks[index].title} className="lightbox-img" /></div><div className="lightbox-caption">{visibleWorks[index].title}</div><button className="icon-btn left" aria-label="Imagem anterior" onClick={prev}>‹</button><button className="icon-btn right" aria-label="Próxima imagem" onClick={next}>›</button><button className="icon-btn close" aria-label="Fechar" onClick={() => setOpen(false)}>×</button></div>
    </div>}
  </>;
}
