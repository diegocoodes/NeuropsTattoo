/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type PortfolioItem = { title: string; image: string; category: string };
export type ServiceItem = { title: string; description: string };
export type VideoItem = { title: string; video: string };

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
  portfolio: { eyebrow: string; title: string; description: string; categories: string[]; items: PortfolioItem[] };
  demonstration: { eyebrow: string; title: string; description: string; items: VideoItem[] };
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
    image: "/valdir.jpg",
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
    categories: ["Realismo", "Retratos", "Autorais"],
    items: [
      { image: "/portfolio/work-1.jpg", title: "Realismo Preto e Branco", category: "Realismo" },
      { image: "/portfolio/work-3.jpg", title: "Portrait", category: "Retratos" },
      { image: "/portfolio/work-2.jpg", title: "Contraste e Textura", category: "Realismo" },
      { image: "/portfolio/work-4.jpg", title: "Projeto Autoral", category: "Autorais" },
    ],
  },
  demonstration: {
    eyebrow: "Vídeos",
    title: "Demonstração",
    description: "Registros em vídeo do processo, dos detalhes e do resultado final de cada trabalho.",
    items: [],
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

type SiteContentContextValue = {
  content: SiteContent;
  loading: boolean;
  setContent: (content: SiteContent) => Promise<void>;
  resetContent: () => Promise<void>;
};

const SiteContentContext = createContext<SiteContentContextValue | null>(null);

const computeOrigin = "https://s7e3a4d13fr61lrhlifcxim6.ewr.prisma.build";
const publicApiOrigin = ["neurops.com.br", "www.neurops.com.br"].includes(window.location.hostname)
  ? computeOrigin
  : "";

function apiUrl(path: string) {
  return `${publicApiOrigin}${path}`;
}

function mediaUrl(value: string) {
  return publicApiOrigin && value.startsWith("/api/media/") ? `${publicApiOrigin}${value}` : value;
}

function normalizeContent(saved: SiteContent): SiteContent {
  const items = Array.isArray(saved.portfolio?.items) ? saved.portfolio.items : defaultContent.portfolio.items;
  const savedCategories = (saved.portfolio as SiteContent["portfolio"] | undefined)?.categories;
  const categories = Array.isArray(savedCategories)
    ? savedCategories.filter((category) => typeof category === "string" && category.trim()).map((category) => category.trim())
    : Array.from(new Set(items.map((item) => item.category).filter(Boolean)));

  return {
    ...defaultContent,
    ...saved,
    theme: { ...defaultContent.theme, ...saved.theme },
    brand: {
      ...defaultContent.brand,
      ...saved.brand,
      logo: mediaUrl(saved.brand?.logo ?? defaultContent.brand.logo),
      symbol: mediaUrl(saved.brand?.symbol ?? defaultContent.brand.symbol),
    },
    hero: {
      ...defaultContent.hero,
      ...saved.hero,
      image: mediaUrl(saved.hero?.image ?? defaultContent.hero.image),
    },
    portfolio: {
      ...defaultContent.portfolio,
      ...saved.portfolio,
      categories: Array.from(new Set(categories)),
      items: items.map((item) => ({ ...item, image: mediaUrl(item.image) })),
    },
    demonstration: {
      ...defaultContent.demonstration,
      ...saved.demonstration,
      items: Array.isArray(saved.demonstration?.items)
        ? saved.demonstration.items.map((item) => ({ ...item, video: mediaUrl(item.video) }))
        : [],
    },
    services: { ...defaultContent.services, ...saved.services },
    contact: { ...defaultContent.contact, ...saved.contact },
    location: { ...defaultContent.location, ...saved.location },
  };
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContentState] = useState<SiteContent>(defaultContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = () => fetch(apiUrl("/api/content"), { cache: "no-store" })
        .then((response) => {
          if (!response.ok) throw new Error("Falha ao carregar conteúdo");
          return response.json();
        })
        .then(({ content: saved }: { content: SiteContent | null }) => {
          if (saved) setContentState(normalizeContent(saved));
        })
        .catch((error) => console.error(error));

    loadContent().finally(() => setLoading(false));
    if (window.location.pathname.startsWith("/admin")) return;
    const refresh = () => { void loadContent(); };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const setContent = async (next: SiteContent) => {
    const response = await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(next),
    });
    if (!response.ok) throw new Error("Não foi possível salvar o conteúdo.");
    const result = await response.json().catch(() => null) as { content?: SiteContent } | null;
    setContentState(normalizeContent(result?.content ?? next));
  };

  const resetContent = async () => setContent(defaultContent);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--bg", content.theme.background);
    root.style.setProperty("--text", content.theme.text);
    root.style.setProperty("--accent", content.theme.accent);
  }, [content.theme]);

  const value = { content, loading, setContent, resetContent };

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  const value = useContext(SiteContentContext);
  if (!value) throw new Error("useSiteContent deve ser usado dentro de SiteContentProvider");
  return value;
}
