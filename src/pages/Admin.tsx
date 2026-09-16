import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import { Tabs } from "@base-ui/react/tabs";
import { isAuthenticated, logout } from "../cms/auth";
import { defaultContent, useSiteContent, type SiteContent } from "../cms/SiteContent";

type Tab = "inicio" | "portfolio" | "servicos" | "contato";
type ImagePreset = { width: number; height: number; fit: "cover" | "contain"; description: string };

const imagePresets = {
  logo: { width: 480, height: 480, fit: "contain", description: "quadrado, sem cortes" },
  hero: { width: 630, height: 780, fit: "cover", description: "vertical, corte central" },
  portfolio: { width: 960, height: 540, fit: "cover", description: "horizontal 16:9, corte central" },
} satisfies Record<string, ImagePreset>;

function formatImage(file: File, preset: ImagePreset): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const source = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = preset.width;
      canvas.height = preset.height;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(source);
        reject(new Error("Não foi possível processar a imagem."));
        return;
      }
      const scale = preset.fit === "cover"
        ? Math.max(preset.width / image.width, preset.height / image.height)
        : Math.min(preset.width / image.width, preset.height / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, (preset.width - width) / 2, (preset.height - height) / 2, width, height);
      URL.revokeObjectURL(source);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Não foi possível processar a imagem.")), preset.fit === "contain" ? "image/png" : "image/webp", 0.86);
    };
    image.onerror = () => {
      URL.revokeObjectURL(source);
      reject(new Error("Formato de imagem inválido."));
    };
    image.src = source;
  });
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="admin-field"><span>{label}</span>{children}</label>;
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return <Field label={label}><input value={value} maxLength={100} onChange={(event) => onChange(event.target.value)} /></Field>;
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return <Field label={label}><textarea value={value} maxLength={500} onChange={(event) => onChange(event.target.value)} /><small className="field-help">A fonte, o tamanho e o espaçamento são aplicados automaticamente no site.</small></Field>;
}

function ImageField({
  label,
  value,
  onChange,
  preset,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  preset: ImagePreset;
}) {
  const [processing, setProcessing] = useState(false);
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    try {
      const form = new FormData();
      form.append("file", await formatImage(file, preset), file.name);
      const response = await fetch("/api/media", { method: "POST", body: form, credentials: "same-origin" });
      if (!response.ok) throw new Error("Não foi possível enviar a imagem.");
      const result = await response.json() as { url: string };
      onChange(result.url);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível processar a imagem.");
    } finally {
      setProcessing(false);
      event.target.value = "";
    }
  };

  return (
    <Field label={label}>
      <div className="image-field">
        <img src={value} alt="Pré-visualização" />
        <div>
          <input value={value} onChange={(event) => onChange(event.target.value)} />
          <label className="upload-button">{processing ? "Formatando..." : "Enviar imagem"}<input type="file" accept="image/*" onChange={upload} disabled={processing} /></label>
          <small className="field-help">Formato automático: {preset.description} ({preset.width} × {preset.height}px).</small>
        </div>
      </div>
    </Field>
  );
}

export default function Admin() {
  const { content, loading, setContent, resetContent } = useSiteContent();
  const [draft, setDraft] = useState<SiteContent>(content);
  const [tab, setTab] = useState<Tab>("inicio");
  const [saved, setSaved] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    isAuthenticated().then((valid) => {
      if (!valid) window.location.replace("/login");
      else setAuthorized(true);
    });
  }, []);

  useEffect(() => { setDraft(content); }, [content]);

  const update = <K extends keyof SiteContent>(section: K, value: SiteContent[K]) => {
    setDraft((current) => ({ ...current, [section]: value }));
    setSaved(false);
  };

  const save = async () => {
    try {
      await setContent(draft);
      setSaved(true);
      setSaveError("");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Falha ao salvar.");
    }
  };

  const reset = async () => {
    if (!window.confirm("Restaurar todo o conteúdo original do site?")) return;
    try {
      await resetContent();
      setDraft(structuredClone(defaultContent));
      setSaved(true);
      setSaveError("");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Falha ao restaurar.");
    }
  };

  const signOut = async () => {
    await logout();
    window.location.assign("/login");
  };

  if (!authorized || loading) return null;

  const navigation: Array<{ id: Tab; index: string; label: string; description: string }> = [
    { id: "inicio", index: "01", label: "Identidade", description: "Marca, cores e apresentação" },
    { id: "portfolio", index: "02", label: "Portfólio", description: "Galeria de trabalhos" },
    { id: "servicos", index: "03", label: "Serviços", description: "Especialidades do estúdio" },
    { id: "contato", index: "04", label: "Contato e local", description: "Canais e endereço" },
  ];

  return (
    <Tabs.Root className="admin-layout" value={tab} onValueChange={(value) => setTab(value as Tab)} orientation="vertical">
      <aside className="admin-sidebar">
        <div className="sidebar-brand-wrap">
          <a href="/" className="admin-brand"><span className="admin-brand-mark"><img src={draft.brand.symbol} alt="" /></span><span className="admin-brand-copy"><strong>Neurops</strong><small>Administração do site</small></span></a>
        </div>
        <div className="admin-nav-group">
          <p className="admin-nav-label">Conteúdo</p>
          <Tabs.List className="admin-nav-list" aria-label="Seções do editor">
            {navigation.map((item) => <Tabs.Tab key={item.id} value={item.id} className="admin-nav-tab"><span className="admin-nav-index">{item.index}</span><span><strong>{item.label}</strong><small>{item.description}</small></span></Tabs.Tab>)}
            <Tabs.Indicator className="admin-nav-indicator" />
          </Tabs.List>
        </div>
        <div className="admin-sidebar-actions"><a href="/" target="_blank">Visualizar site</a><button onClick={signOut}>Sair</button></div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-heading"><div className="admin-breadcrumb"><span>Painel</span><strong>{navigation.find((item) => item.id === tab)?.label}</strong></div><h1>Central de conteúdo</h1><p className="admin-heading-copy">Edite as informações do site mantendo a identidade visual.</p></div>
          <div className="admin-save-actions">
            {saveError && <span className="admin-error" role="alert">{saveError}</span>}
            <span className={saved ? "saved-message is-saved" : "saved-message is-pending"}>{saved ? "Tudo salvo" : "Alterações pendentes"}</span>
            <button className="admin-secondary" onClick={reset}>Restaurar</button>
            <button className="admin-primary" onClick={save}>Salvar alterações</button>
          </div>
        </header>

        <Tabs.Panel value="inicio" className="admin-tab-panel"><div className="editor-stack">
          <section className="editor-card"><h2>Cores</h2><div className="color-grid">
            {(["background", "text", "accent"] as const).map((key) => <Field key={key} label={{ background: "Fundo", text: "Texto", accent: "Destaque" }[key]}><div className="color-control"><input type="color" value={draft.theme[key]} onChange={(event) => update("theme", { ...draft.theme, [key]: event.target.value })} /><input value={draft.theme[key]} onChange={(event) => update("theme", { ...draft.theme, [key]: event.target.value })} /></div></Field>)}
          </div></section>
          <section className="editor-card"><h2>Marca</h2><div className="editor-grid">
            <TextField label="Nome" value={draft.brand.name} onChange={(value) => update("brand", { ...draft.brand, name: value })} />
            <TextField label="Complemento" value={draft.brand.suffix} onChange={(value) => update("brand", { ...draft.brand, suffix: value })} />
            <ImageField label="Logotipo" value={draft.brand.logo} preset={imagePresets.logo} onChange={(value) => update("brand", { ...draft.brand, logo: value })} />
            <ImageField label="Símbolo" value={draft.brand.symbol} preset={imagePresets.logo} onChange={(value) => update("brand", { ...draft.brand, symbol: value })} />
          </div></section>
          <section className="editor-card"><h2>Apresentação</h2><div className="editor-grid">
            <TextField label="Texto superior" value={draft.hero.eyebrow} onChange={(value) => update("hero", { ...draft.hero, eyebrow: value })} />
            <TextField label="Título" value={draft.hero.title} onChange={(value) => update("hero", { ...draft.hero, title: value })} />
            <TextField label="Título em destaque" value={draft.hero.titleAccent} onChange={(value) => update("hero", { ...draft.hero, titleAccent: value })} />
            <TextArea label="Descrição" value={draft.hero.description} onChange={(value) => update("hero", { ...draft.hero, description: value })} />
            <TextField label="Botão principal" value={draft.hero.primaryButton} onChange={(value) => update("hero", { ...draft.hero, primaryButton: value })} />
            <TextField label="Botão secundário" value={draft.hero.secondaryButton} onChange={(value) => update("hero", { ...draft.hero, secondaryButton: value })} />
            <ImageField label="Foto principal" value={draft.hero.image} preset={imagePresets.hero} onChange={(value) => update("hero", { ...draft.hero, image: value })} />
          </div></section>
          <section className="editor-card"><h2>Sobre</h2><TextField label="Texto superior" value={draft.about.eyebrow} onChange={(value) => update("about", { ...draft.about, eyebrow: value })} /><TextField label="Título" value={draft.about.title} onChange={(value) => update("about", { ...draft.about, title: value })} /><TextArea label="Descrição" value={draft.about.description} onChange={(value) => update("about", { ...draft.about, description: value })} /><TextArea label="Texto complementar" value={draft.about.secondary} onChange={(value) => update("about", { ...draft.about, secondary: value })} /></section>
        </div></Tabs.Panel>

        <Tabs.Panel value="portfolio" className="admin-tab-panel"><div className="editor-stack"><section className="editor-card"><h2>Portfólio</h2><TextField label="Texto superior" value={draft.portfolio.eyebrow} onChange={(value) => update("portfolio", { ...draft.portfolio, eyebrow: value })} /><TextField label="Título" value={draft.portfolio.title} onChange={(value) => update("portfolio", { ...draft.portfolio, title: value })} /><TextArea label="Descrição" value={draft.portfolio.description} onChange={(value) => update("portfolio", { ...draft.portfolio, description: value })} /></section>{draft.portfolio.items.map((item, index) => <section className="editor-card" key={index}><h2>Trabalho {index + 1}</h2><TextField label="Título" value={item.title} onChange={(value) => { const items = [...draft.portfolio.items]; items[index] = { ...item, title: value }; update("portfolio", { ...draft.portfolio, items }); }} /><TextField label="Categoria" value={item.category} onChange={(value) => { const items = [...draft.portfolio.items]; items[index] = { ...item, category: value }; update("portfolio", { ...draft.portfolio, items }); }} /><ImageField label="Imagem" value={item.image} preset={imagePresets.portfolio} onChange={(value) => { const items = [...draft.portfolio.items]; items[index] = { ...item, image: value }; update("portfolio", { ...draft.portfolio, items }); }} /></section>)}</div></Tabs.Panel>

        <Tabs.Panel value="servicos" className="admin-tab-panel"><div className="editor-stack"><section className="editor-card"><h2>Serviços</h2><TextField label="Texto superior" value={draft.services.eyebrow} onChange={(value) => update("services", { ...draft.services, eyebrow: value })} /><TextField label="Título" value={draft.services.title} onChange={(value) => update("services", { ...draft.services, title: value })} /><TextArea label="Descrição" value={draft.services.description} onChange={(value) => update("services", { ...draft.services, description: value })} /></section>{draft.services.items.map((item, index) => <section className="editor-card" key={index}><h2>Serviço {index + 1}</h2><TextField label="Nome" value={item.title} onChange={(value) => { const items = [...draft.services.items]; items[index] = { ...item, title: value }; update("services", { ...draft.services, items }); }} /><TextArea label="Descrição" value={item.description} onChange={(value) => { const items = [...draft.services.items]; items[index] = { ...item, description: value }; update("services", { ...draft.services, items }); }} /></section>)}</div></Tabs.Panel>

        <Tabs.Panel value="contato" className="admin-tab-panel"><div className="editor-stack"><section className="editor-card"><h2>Contato</h2><div className="editor-grid"><TextField label="Título" value={draft.contact.title} onChange={(value) => update("contact", { ...draft.contact, title: value })} /><TextArea label="Descrição" value={draft.contact.description} onChange={(value) => update("contact", { ...draft.contact, description: value })} /><TextField label="Título do card" value={draft.contact.panelTitle} onChange={(value) => update("contact", { ...draft.contact, panelTitle: value })} /><TextField label="WhatsApp (somente números)" value={draft.contact.whatsapp} onChange={(value) => update("contact", { ...draft.contact, whatsapp: value.replace(/\D/g, "") })} /><TextField label="WhatsApp exibido" value={draft.contact.whatsappDisplay} onChange={(value) => update("contact", { ...draft.contact, whatsappDisplay: value })} /><TextField label="Instagram (sem @)" value={draft.contact.instagram} onChange={(value) => update("contact", { ...draft.contact, instagram: value.replace(/^@/, "") })} /><TextField label="Especialidade" value={draft.contact.specialty} onChange={(value) => update("contact", { ...draft.contact, specialty: value })} /></div></section><section className="editor-card"><h2>Localização</h2><div className="editor-grid"><TextField label="Título" value={draft.location.title} onChange={(value) => update("location", { ...draft.location, title: value })} /><TextArea label="Descrição" value={draft.location.description} onChange={(value) => update("location", { ...draft.location, description: value })} /><TextArea label="Endereço completo (mapa)" value={draft.location.address} onChange={(value) => update("location", { ...draft.location, address: value })} /><TextField label="CEP" value={draft.location.zipCode} onChange={(value) => update("location", { ...draft.location, zipCode: value })} /><TextField label="Rua" value={draft.location.street} onChange={(value) => update("location", { ...draft.location, street: value })} /><TextField label="Bairro" value={draft.location.neighborhood} onChange={(value) => update("location", { ...draft.location, neighborhood: value })} /><TextField label="Atendimento" value={draft.location.appointment} onChange={(value) => update("location", { ...draft.location, appointment: value })} /></div></section></div></Tabs.Panel>
      </main>
    </Tabs.Root>
  );
}
