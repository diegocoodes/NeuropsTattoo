/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import valdirImage from "../assets/valdir.jpg";

export type PortfolioItem = { title: string; image: string; category: string };
export type ServiceItem = { title: string; description: string };

export type SiteContent = {
  theme: { background: string; text: string; accent: string };
  brand: { name: string; suffix: string; logo: string; symbol: string };
  hero: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    description: string;
    primaryButton: string;
    secondaryButton: string;
    image: string;
    imageAlt: string;
  };
  about: { eyebrow: string; title: string; description: string; secondary: string };
  portfolio: { eyebrow: string; title: string; description: string; items: PortfolioItem[] };
  services: { eyebrow: string; title: string; description: string; items: ServiceItem[] };
  contact: {
    eyebrow: string;
    title: string;
    description: string;
    panelTitle: string;
    whatsapp: string;
    whatsappDisplay: string;
    instagram: string;
    specialty: string;
  };
  location: {
    eyebrow: string;
    title: string;
    description: string;
    address: string;
    zipCode: string;
    street: string;
    neighborhood: string;
    appointment: string;
  };
};

export const defaultContent: SiteContent = {
  theme: { background: "#0b0b0b", text: "#f5f5f5", accent: "#ff5a1f" },
  brand: {
    name: "Neurops",
    suffix: "Tattoo",
    logo: "/logo-neurops.svg",
    symbol: "/logo-neurops-symbol.svg",
  },
  hero: {
    eyebrow: "Tatuagem autoral em Paulista",
    title: "Neurops",
    titleAccent: "Tattoo",
    description:
      "Projetos exclusivos criados para transformar referências, histórias e ideias em tatuagens com identidade.",
    primaryButton: "Agendar pelo WhatsApp",
    secondaryButton: "Ver trabalhos",
    image: valdirImage,
    imageAlt: "Valdir Neto, tatuador Neurops",
  },
  about: {
    eyebrow: "Traço, técnica e identidade",
    title: "Conheça o artista",
    description:
      "Valdir Neto construiu sua linguagem artística entre o graffiti e a tatuagem. Hoje, cada projeto combina estudo de composição, contraste e anatomia para criar uma peça que converse com o corpo.",
    secondary:
      "O atendimento começa com uma conversa sobre a ideia, o significado e o local escolhido. A partir disso, a arte é desenvolvida de forma exclusiva, respeitando a história e a individualidade de cada cliente.",
  },
  portfolio: {
    eyebrow: "Portfólio",
    title: "Trabalhos selecionados",
    description:
      "Uma seleção de projetos autorais, retratos e composições realistas. Explore as categorias para conhecer diferentes abordagens de textura, profundidade e acabamento.",
    items: [
      { image: "/portfolio/work-1.jpg", title: "Realismo Preto e Branco", category: "Realismo" },
      { image: "/portfolio/work-3.jpg", title: "Portrait", category: "Retratos" },
      { image: "/portfolio/work-2.jpg", title: "Contraste e Textura", category: "Realismo" },
      { image: "/portfolio/work-4.jpg", title: "Projeto Autoral", category: "Autorais" },
    ],
  },
  services: {
    eyebrow: "Especialidades",
    title: "Projetos feitos para você",
    description:
      "Do primeiro rascunho à finalização, cada etapa é pensada para criar uma tatuagem coerente com sua ideia, com o local do corpo e com o resultado desejado.",
    items: [
      {
        title: "Realismo Preto e Cinza",
        description:
          "Composições com profundidade, textura e contraste planejados para preservar a leitura da arte ao longo do tempo.",
      },
      {
        title: "Portrait (Realismo de Rosto)",
        description:
          "Retratos desenvolvidos a partir de boas referências, respeitando proporções, expressão e os detalhes que tornam cada rosto único.",
      },
      {
        title: "Projetos Autorais",
        description:
          "Artes exclusivas construídas a partir da sua história, das suas referências e da região do corpo escolhida.",
      },
      {
        title: "Consultoria e Orçamento",
        description:
          "Orientação sobre tamanho, posicionamento, viabilidade da ideia e preparação para a sessão antes da confirmação do projeto.",
      },
    ],
  },
  contact: {
    eyebrow: "Orçamento e agenda",
    title: "Vamos criar sua próxima tattoo",
    description:
      "Conte um pouco sobre a sua ideia e envie referências, tamanho aproximado e local do corpo. Essas informações ajudam a avaliar o projeto e tornam o orçamento mais preciso.",
    panelTitle: "Fale com o Neurops",
    whatsapp: "5581997053551",
    whatsappDisplay: "(81) 99705-3551",
    instagram: "neurops_tattooist",
    specialty: "Preto e Cinza e Portrait",
  },
  location: {
    eyebrow: "Paulista, Pernambuco",
    title: "Visite o estúdio",
    description:
      "O estúdio recebe cada cliente com horário reservado, garantindo privacidade e atenção durante toda a sessão. Confirme sua disponibilidade antes da visita.",
    address:
      "Rua Sessenta e Quatro, 135, Jardim Paulista, Paulista, PE, 53409-150, Brasil",
    zipCode: "53409-150",
    street: "Rua Sessenta e Quatro, 135",
    neighborhood: "Jardim Paulista",
    appointment: "Somente com agendamento",
  },
};

const STORAGE_KEY = "neurops-site-content-v1";

type SiteContentContextValue = {
  content: SiteContent;
  setContent: (content: SiteContent) => void;
  resetContent: () => void;
};

const SiteContentContext = createContext<SiteContentContextValue | null>(null);

function loadContent(): SiteContent {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultContent;
    const parsed = JSON.parse(saved) as Partial<SiteContent>;
    const hero = { ...defaultContent.hero, ...parsed.hero };
    const about = { ...defaultContent.about, ...parsed.about };
    const portfolio = { ...defaultContent.portfolio, ...parsed.portfolio };
    const services = { ...defaultContent.services, ...parsed.services };
    const contact = { ...defaultContent.contact, ...parsed.contact };
    const location = { ...defaultContent.location, ...parsed.location };
    if (hero.description.includes("tatuador desde 2015") || hero.description.includes("realismo preto e cinza")) hero.description = defaultContent.hero.description;
    if (hero.eyebrow.includes("•") || hero.eyebrow.toLowerCase().includes("realismo preto e cinza")) hero.eyebrow = defaultContent.hero.eyebrow;
    if (about.description.includes("tatuador desde 2015") || about.description.startsWith("Valdir Neto desenvolve trabalhos autorais")) {
      about.title = defaultContent.about.title;
      about.description = defaultContent.about.description;
    }
    if (portfolio.description.startsWith("Seleção de tatuagens")) {
      portfolio.title = defaultContent.portfolio.title;
      portfolio.description = defaultContent.portfolio.description;
    }
    if (services.description.startsWith("Trabalhos autorais e personalizados")) {
      services.title = defaultContent.services.title;
      services.description = defaultContent.services.description;
      services.items = defaultContent.services.items;
    }
    if (contact.description.startsWith("Atendimento direto para orçamento")) {
      contact.title = defaultContent.contact.title;
      contact.description = defaultContent.contact.description;
    }
    if (location.description.startsWith("Atendimento com horário marcado")) {
      location.title = defaultContent.location.title;
      location.description = defaultContent.location.description;
    }
    const savedItems = parsed.portfolio?.items ?? defaultContent.portfolio.items;
    const items = savedItems.map((item, index) => ({
      ...item,
      category: item.category || defaultContent.portfolio.items[index]?.category || "Outros",
    }));
    return {
      ...defaultContent,
      ...parsed,
      theme: { ...defaultContent.theme, ...parsed.theme },
      brand: { ...defaultContent.brand, ...parsed.brand },
      hero,
      about,
      portfolio: { ...portfolio, items },
      services,
      contact: {
        ...contact,
        specialty: contact.specialty.replace(" • ", " e "),
      },
      location: {
        ...location,
        address: location.address.replace("Paulista - PE", "Paulista, PE"),
      },
    };
  } catch {
    return defaultContent;
  }
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContentState] = useState<SiteContent>(loadContent);

  const setContent = (next: SiteContent) => {
    setContentState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const resetContent = () => {
    localStorage.removeItem(STORAGE_KEY);
    setContentState(defaultContent);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--bg", content.theme.background);
    root.style.setProperty("--text", content.theme.text);
    root.style.setProperty("--accent", content.theme.accent);
  }, [content.theme]);

  const value = useMemo(
    () => ({ content, setContent, resetContent }),
    [content],
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  const value = useContext(SiteContentContext);
  if (!value) throw new Error("useSiteContent deve ser usado dentro de SiteContentProvider");
  return value;
}
