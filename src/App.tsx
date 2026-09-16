import DarkVeilBackground from "./components/DarkVeilBackground";
import Navbar from "./components/Navbar";
import Hero from "./sections/Hero";
import Sobre from "./sections/Sobre";
import Trabalhos from "./sections/Trabalho";
import Servicos from "./sections/Servico";
import Contato from "./sections/Contato";
import Localizacao from "./sections/Localizacao";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import { useSiteContent } from "./cms/SiteContent";
import SiteIntro from "./components/SiteIntro";
import SiteMotion from "./components/SiteMotion";

export default function App() {
  const { content } = useSiteContent();
  const path = window.location.pathname.replace(/\/$/, "") || "/";

  if (path === "/login") return <Login />;
  if (path === "/admin") return <Admin />;

  const whatsappLink = `https://wa.me/${content.contact.whatsapp}?text=${encodeURIComponent(
    "Olá! Quero agendar um horário. Posso enviar minha referência e medidas?",
  )}`;

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <SiteIntro />
      <SiteMotion />
      <DarkVeilBackground />
      <div style={{ position: "relative", zIndex: 10 }}>
        <Navbar />
        <main>
          <Hero />
          <Sobre />
          <Trabalhos />
          <Servicos />
          <Contato />
          <Localizacao />
        </main>
        <a className="whatsapp-float" href={whatsappLink} target="_blank" rel="noreferrer">
          {content.hero.primaryButton}
        </a>
      </div>
    </div>
  );
}
