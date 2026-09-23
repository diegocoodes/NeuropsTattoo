import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Tabs } from "@base-ui/react/tabs";
import { isAuthenticated, logout } from "../cms/auth";
import { defaultContent, useSiteContent, type SiteContent } from "../cms/SiteContent";

type Tab = "inicio" | "portfolio" | "videos" | "servicos" | "contato";
type ImagePreset = { width: number; height: number; fit: "cover" | "contain"; description: string };
const VIDEO_SLOT_COUNT = 3;

const imagePresets = {
  logo: { width: 480, height: 480, fit: "contain", description: "quadrado, sem cortes" },
  hero: { width: 630, height: 780, fit: "cover", description: "vertical, corte central" },
  portfolio: { width: 1080, height: 1440, fit: "cover", description: "vertical 3:4, preenchimento total" },
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

async function uploadImage(file: File, preset: ImagePreset) {
  const formatted = await formatImage(file, preset);
  const baseName = file.name.replace(/\.[^.]+$/, "") || "imagem";
  const extension = formatted.type === "image/png" ? "png" : "webp";
  const form = new FormData();
  form.append("file", formatted, `${baseName}.${extension}`);
  const response = await fetch("/api/media", { method: "POST", body: form, credentials: "same-origin" });
  const result = await response.json().catch(() => null) as { url?: string; error?: string } | null;
  if (!response.ok || !result?.url) throw new Error(result?.error || "Não foi possível enviar a imagem.");
  return result.url;
}

async function uploadVideo(file: File) {
  if (!["video/mp4", "video/webm"].includes(file.type)) throw new Error("Envie um vídeo MP4 ou WebM.");
  if (file.size > 50_000_000) throw new Error("O vídeo deve ter no máximo 50 MB.");
  const form = new FormData();
  form.append("file", file, file.name);
  const response = await fetch("/api/media", { method: "POST", body: form, credentials: "same-origin" });
  const result = await response.json().catch(() => null) as { url?: string; error?: string } | null;
  if (!response.ok || !result?.url) throw new Error(result?.error || "Não foi possível enviar o vídeo.");
  return result.url;
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
      onChange(await uploadImage(file, preset));
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
          <label className="upload-button">{processing ? "Formatando..." : "Enviar imagem"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} disabled={processing} /></label>
          <small className="field-help">Formato automático: {preset.description} ({preset.width} × {preset.height}px).</small>
        </div>
      </div>
    </Field>
  );
}

function PortfolioEditor({
  portfolio,
  onChange,
}: {
  portfolio: SiteContent["portfolio"];
  onChange: (portfolio: SiteContent["portfolio"]) => void;
}) {
  const [newCategory, setNewCategory] = useState("");
  const [uploadCategory, setUploadCategory] = useState(portfolio.categories[0] ?? "");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!portfolio.categories.includes(uploadCategory)) setUploadCategory(portfolio.categories[0] ?? "");
  }, [portfolio.categories, uploadCategory]);

  const addCategory = (event: FormEvent) => {
    event.preventDefault();
    const category = newCategory.trim();
    if (!category) return;
    if (portfolio.categories.some((item) => item.toLocaleLowerCase() === category.toLocaleLowerCase())) {
      window.alert("Essa categoria já existe.");
      return;
    }
    onChange({ ...portfolio, categories: [...portfolio.categories, category] });
    setUploadCategory(category);
    setNewCategory("");
  };

  const renameCategory = (index: number, value: string) => {
    const previous = portfolio.categories[index];
    const categories = [...portfolio.categories];
    categories[index] = value;
    const items = portfolio.items.map((item) => item.category === previous ? { ...item, category: value } : item);
    onChange({ ...portfolio, categories, items });
  };

  const removeCategory = (index: number) => {
    const removed = portfolio.categories[index];
    if (!window.confirm(`Excluir a categoria “${removed}”?`)) return;
    const categories = portfolio.categories.filter((_, itemIndex) => itemIndex !== index);
    const fallback = categories[0] ?? "";
    const items = portfolio.items.map((item) => item.category === removed ? { ...item, category: fallback } : item);
    onChange({ ...portfolio, categories, items });
  };

  const addImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    if (!uploadCategory) {
      window.alert("Crie uma categoria antes de adicionar imagens.");
      event.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map(async (file) => ({
        title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
        category: uploadCategory,
        image: await uploadImage(file, imagePresets.portfolio),
      })));
      onChange({ ...portfolio, items: [...portfolio.items, ...uploaded] });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível enviar as imagens.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const updateItem = (index: number, value: SiteContent["portfolio"]["items"][number]) => {
    const items = [...portfolio.items];
    items[index] = value;
    onChange({ ...portfolio, items });
  };

  const removeItem = (index: number) => {
    if (!window.confirm("Remover esta imagem do portfólio?")) return;
    onChange({ ...portfolio, items: portfolio.items.filter((_, itemIndex) => itemIndex !== index) });
  };

  return <div className="editor-stack">
    <section className="editor-card">
      <h2>Portfólio</h2>
      <TextField label="Texto superior" value={portfolio.eyebrow} onChange={(eyebrow) => onChange({ ...portfolio, eyebrow })} />
      <TextField label="Título" value={portfolio.title} onChange={(title) => onChange({ ...portfolio, title })} />
      <TextArea label="Descrição" value={portfolio.description} onChange={(description) => onChange({ ...portfolio, description })} />
    </section>

    <section className="editor-card">
      <div className="editor-card-heading"><div><h2>Categorias</h2><p>Crie os filtros que aparecem acima da galeria.</p></div></div>
      <div className="category-editor-list">
        {portfolio.categories.map((category, index) => <div className="category-editor-row" key={index}>
          <input aria-label={`Nome da categoria ${index + 1}`} value={category} maxLength={40} onChange={(event) => renameCategory(index, event.target.value)} />
          <button type="button" className="admin-danger-link" onClick={() => removeCategory(index)}>Excluir</button>
        </div>)}
        {!portfolio.categories.length && <p className="admin-empty">Nenhuma categoria criada.</p>}
      </div>
      <form className="category-add-form" onSubmit={addCategory}>
        <input value={newCategory} maxLength={40} placeholder="Nome da nova categoria" onChange={(event) => setNewCategory(event.target.value)} />
        <button type="submit" className="admin-secondary">Criar categoria</button>
      </form>
    </section>

    <section className="editor-card portfolio-upload-card">
      <div className="editor-card-heading"><div><h2>Adicionar imagens</h2><p>Selecione uma categoria e envie uma ou várias imagens de uma vez.</p></div></div>
      <div className="portfolio-upload-controls">
        <Field label="Categoria">
          <select value={uploadCategory} onChange={(event) => setUploadCategory(event.target.value)} disabled={!portfolio.categories.length}>
            {!portfolio.categories.length && <option value="">Crie uma categoria</option>}
            {portfolio.categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </Field>
        <label className="admin-primary portfolio-upload-button">
          {uploading ? "Enviando imagens..." : "Selecionar imagens"}
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addImages} disabled={uploading || !portfolio.categories.length} />
        </label>
      </div>
    </section>

    {portfolio.items.map((item, index) => <section className="editor-card portfolio-item-card" key={`${item.image}-${index}`}>
      <div className="editor-card-heading"><h2>Trabalho {index + 1}</h2><button type="button" className="admin-danger-link" onClick={() => removeItem(index)}>Remover imagem</button></div>
      <TextField label="Título" value={item.title} onChange={(title) => updateItem(index, { ...item, title })} />
      <Field label="Categoria"><select value={item.category} onChange={(event) => updateItem(index, { ...item, category: event.target.value })}>
        {!portfolio.categories.includes(item.category) && item.category && <option value={item.category}>{item.category}</option>}
        <option value="">Sem categoria</option>
        {portfolio.categories.map((category) => <option key={category} value={category}>{category}</option>)}
      </select></Field>
      <ImageField label="Imagem" value={item.image} preset={imagePresets.portfolio} onChange={(image) => updateItem(index, { ...item, image })} />
    </section>)}
  </div>;
}

function VideoEditor({
  demonstration,
  onChange,
}: {
  demonstration: SiteContent["demonstration"];
  onChange: (demonstration: SiteContent["demonstration"]) => void;
}) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const slots = Array.from(
    { length: VIDEO_SLOT_COUNT },
    (_, index) => demonstration.items[index] ?? { title: "", video: "" },
  );

  const attachVideo = async (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingIndex(index);
    try {
      const uploaded = {
        title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
        video: await uploadVideo(file),
      };
      const items = [...slots];
      items[index] = uploaded;
      onChange({ ...demonstration, items });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível enviar os vídeos.");
    } finally {
      setUploadingIndex(null);
      event.target.value = "";
    }
  };

  const updateItem = (index: number, value: SiteContent["demonstration"]["items"][number]) => {
    const items = [...slots];
    items[index] = value;
    onChange({ ...demonstration, items });
  };

  const clearSlot = (index: number) => {
    if (!window.confirm(`Remover o vídeo ${index + 1} da seção de demonstração?`)) return;
    const items = [...slots];
    items[index] = { title: "", video: "" };
    onChange({ ...demonstration, items });
  };

  return <div className="editor-stack">
    <section className="editor-card">
      <h2>Seção de vídeos</h2>
      <TextField label="Texto superior" value={demonstration.eyebrow} onChange={(eyebrow) => onChange({ ...demonstration, eyebrow })} />
      <TextField label="Título" value={demonstration.title} onChange={(title) => onChange({ ...demonstration, title })} />
      <TextArea label="Descrição" value={demonstration.description} onChange={(description) => onChange({ ...demonstration, description })} />
    </section>

    <section className="editor-card video-upload-card">
      <div className="editor-card-heading"><div><h2>Os 3 vídeos do site</h2><p>Anexe um vídeo em cada espaço abaixo. Cada posição corresponde ao mesmo espaço na seção de demonstração.</p></div></div>
      <small className="field-help">MP4 ou WebM, proporção recomendada 9:16 e até 50 MB por arquivo.</small>
    </section>

    <div className="video-editor-grid">
      {slots.map((item, index) => <section className="editor-card video-editor-card" key={index}>
        <div className="editor-card-heading"><h2>Vídeo {index + 1} de {VIDEO_SLOT_COUNT}</h2>{item.video && <button type="button" className="admin-danger-link" onClick={() => clearSlot(index)}>Remover vídeo</button>}</div>
        {item.video
          ? <video src={item.video} controls playsInline preload="metadata" />
          : <div className="video-editor-placeholder"><span>Espaço {index + 1}</span><small>Nenhum vídeo anexado</small></div>}
        <label className="admin-primary video-upload-button">
          {uploadingIndex === index ? "Enviando vídeo..." : item.video ? "Trocar vídeo" : "Anexar vídeo"}
          <input type="file" accept="video/mp4,video/webm" onChange={(event) => attachVideo(index, event)} disabled={uploadingIndex !== null} />
        </label>
        <TextField label="Título acessível" value={item.title} onChange={(title) => updateItem(index, { ...item, title })} />
        <Field label="Endereço do vídeo"><input value={item.video} onChange={(event) => updateItem(index, { ...item, video: event.target.value })} /></Field>
      </section>)}
    </div>
  </div>;
}

export default function Admin() {
  const { content, loading, setContent, resetContent } = useSiteContent();
  const [draft, setDraft] = useState<SiteContent>(content);
  const [tab, setTab] = useState<Tab>("inicio");
  const [saved, setSaved] = useState(true);
  const [saving, setSaving] = useState(false);
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
    const categories = Array.from(new Set(draft.portfolio.categories.map((category) => category.trim()).filter(Boolean)));
    const next = {
      ...draft,
      portfolio: {
        ...draft.portfolio,
        categories,
        items: draft.portfolio.items.map((item) => ({ ...item, title: item.title.trim(), category: item.category.trim() })),
      },
      demonstration: {
        ...draft.demonstration,
        items: draft.demonstration.items.map((item) => ({ ...item, title: item.title.trim() })),
      },
    };
    setSaving(true);
    try {
      await setContent(next);
      setDraft(next);
      setSaved(true);
      setSaveError("");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
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
    { id: "videos", index: "03", label: "Vídeos", description: "Demonstrações verticais" },
    { id: "servicos", index: "04", label: "Serviços", description: "Especialidades do estúdio" },
    { id: "contato", index: "05", label: "Contato e local", description: "Canais e endereço" },
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
            <span className={saved ? "saved-message is-saved" : "saved-message is-pending"}>{saving ? "Salvando..." : saved ? "Tudo salvo" : "Alterações pendentes"}</span>
            <button className="admin-secondary" onClick={reset}>Restaurar</button>
            <button className="admin-primary" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar alterações"}</button>
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

        <Tabs.Panel value="portfolio" className="admin-tab-panel"><PortfolioEditor portfolio={draft.portfolio} onChange={(portfolio) => update("portfolio", portfolio)} /></Tabs.Panel>

        <Tabs.Panel value="videos" className="admin-tab-panel"><VideoEditor demonstration={draft.demonstration} onChange={(demonstration) => update("demonstration", demonstration)} /></Tabs.Panel>

        <Tabs.Panel value="servicos" className="admin-tab-panel"><div className="editor-stack"><section className="editor-card"><h2>Serviços</h2><TextField label="Texto superior" value={draft.services.eyebrow} onChange={(value) => update("services", { ...draft.services, eyebrow: value })} /><TextField label="Título" value={draft.services.title} onChange={(value) => update("services", { ...draft.services, title: value })} /><TextArea label="Descrição" value={draft.services.description} onChange={(value) => update("services", { ...draft.services, description: value })} /></section>{draft.services.items.map((item, index) => <section className="editor-card" key={index}><h2>Serviço {index + 1}</h2><TextField label="Nome" value={item.title} onChange={(value) => { const items = [...draft.services.items]; items[index] = { ...item, title: value }; update("services", { ...draft.services, items }); }} /><TextArea label="Descrição" value={item.description} onChange={(value) => { const items = [...draft.services.items]; items[index] = { ...item, description: value }; update("services", { ...draft.services, items }); }} /></section>)}</div></Tabs.Panel>

        <Tabs.Panel value="contato" className="admin-tab-panel"><div className="editor-stack"><section className="editor-card"><h2>Contato</h2><div className="editor-grid"><TextField label="Título" value={draft.contact.title} onChange={(value) => update("contact", { ...draft.contact, title: value })} /><TextArea label="Descrição" value={draft.contact.description} onChange={(value) => update("contact", { ...draft.contact, description: value })} /><TextField label="Título do card" value={draft.contact.panelTitle} onChange={(value) => update("contact", { ...draft.contact, panelTitle: value })} /><TextField label="WhatsApp (somente números)" value={draft.contact.whatsapp} onChange={(value) => update("contact", { ...draft.contact, whatsapp: value.replace(/\D/g, "") })} /><TextField label="WhatsApp exibido" value={draft.contact.whatsappDisplay} onChange={(value) => update("contact", { ...draft.contact, whatsappDisplay: value })} /><TextField label="Instagram (sem @)" value={draft.contact.instagram} onChange={(value) => update("contact", { ...draft.contact, instagram: value.replace(/^@/, "") })} /><TextField label="Especialidade" value={draft.contact.specialty} onChange={(value) => update("contact", { ...draft.contact, specialty: value })} /></div></section><section className="editor-card"><h2>Localização</h2><div className="editor-grid"><TextField label="Título" value={draft.location.title} onChange={(value) => update("location", { ...draft.location, title: value })} /><TextArea label="Descrição" value={draft.location.description} onChange={(value) => update("location", { ...draft.location, description: value })} /><TextArea label="Endereço completo (mapa)" value={draft.location.address} onChange={(value) => update("location", { ...draft.location, address: value })} /><TextField label="CEP" value={draft.location.zipCode} onChange={(value) => update("location", { ...draft.location, zipCode: value })} /><TextField label="Rua" value={draft.location.street} onChange={(value) => update("location", { ...draft.location, street: value })} /><TextField label="Bairro" value={draft.location.neighborhood} onChange={(value) => update("location", { ...draft.location, neighborhood: value })} /><TextField label="Atendimento" value={draft.location.appointment} onChange={(value) => update("location", { ...draft.location, appointment: value })} /></div></section></div></Tabs.Panel>
      </main>
    </Tabs.Root>
  );
}
