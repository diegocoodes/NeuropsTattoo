import { useMemo, useState } from "react";
import { useSiteContent } from "../cms/SiteContent";

export default function Trabalhos() {
  const { content } = useSiteContent();
  const works = content.portfolio.items;
  const categories = useMemo(
    () => ["Todos", ...content.portfolio.categories],
    [content.portfolio.categories],
  );
  const [category, setCategory] = useState("Todos");
  const activeCategory = categories.includes(category) ? category : "Todos";
  const visibleWorks = activeCategory === "Todos" ? works : works.filter((work) => work.category === activeCategory);

  const chooseCategory = (nextCategory: string) => {
    setCategory(nextCategory);
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
          {visibleWorks.map((work, itemIndex) => <div key={`${work.image}-${itemIndex}`} className="work" data-reveal-item>
            <img src={work.image} alt={work.title} loading="lazy" />
          </div>)}
          {!visibleWorks.length && <p className="portfolio-empty">Ainda não há imagens nesta categoria.</p>}
        </div>
      </div>
    </section>
  </>;
}
