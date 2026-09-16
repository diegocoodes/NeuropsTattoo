import { useMemo, useState } from "react";
import { useSiteContent } from "../cms/SiteContent";

export default function Contato() {
  const { content } = useSiteContent();
  const { contact } = content;
  const [nome, setNome] = useState("");
  const [estilo, setEstilo] = useState("Realismo Preto e Cinza");
  const [tamanho, setTamanho] = useState("");
  const [local, setLocal] = useState("");
  const [mensagem, setMensagem] = useState("");
  const whatsappLink = useMemo(() => {
    const text = `Olá! Meu nome é ${nome || "[seu nome]"}. Quero um orçamento para ${estilo}. ${tamanho ? `Tamanho: ${tamanho}. ` : ""}${local ? `Local do corpo: ${local}. ` : ""}${mensagem || "Posso enviar minhas referências?"}`;
    return `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(text)}`;
  }, [contact.whatsapp, estilo, local, mensagem, nome, tamanho]);

  return <section className="section section-dark contact-section" id="contato"><div className="container"><div className="section-intro" data-reveal><div><p className="section-eyebrow">{contact.eyebrow}</p><h2 className="section-title">{contact.title}</h2></div><p className="text-editorial text-lead">{contact.description}</p></div><div className="contact-grid" data-reveal-group>
    <div className="panel" data-reveal-item><div className="panel-inner"><div className="panel-title"><h3>{contact.panelTitle}</h3></div><div className="kv"><div className="kv-row"><div className="kv-label">WhatsApp</div><div className="kv-value">{contact.whatsappDisplay}</div></div><div className="kv-row"><div className="kv-label">Instagram</div><div className="kv-value">@{contact.instagram}</div></div><div className="kv-row"><div className="kv-label">Especialidade</div><div className="kv-value">{contact.specialty}</div></div></div><div className="contact-actions"><a className="btn primary" href={whatsappLink} target="_blank" rel="noreferrer">Agendar pelo WhatsApp</a><a className="btn secondary" href={`https://instagram.com/${contact.instagram}`} target="_blank" rel="noreferrer">Ver Instagram</a></div></div></div>
    <div className="panel" data-reveal-item><div className="panel-inner"><div className="panel-title"><h3>Pedido de orçamento</h3></div><form className="form" onSubmit={(event) => event.preventDefault()}><div className="field"><label>Seu nome</label><input value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Ex.: Diego" /></div><div className="field"><label>Estilo</label><select value={estilo} onChange={(event) => setEstilo(event.target.value)}><option>Realismo Preto e Cinza</option><option>Portrait (Rosto)</option><option>Projeto autoral</option></select></div><div className="field"><label>Tamanho/medidas</label><input value={tamanho} onChange={(event) => setTamanho(event.target.value)} placeholder="Ex.: 12 cm" /></div><div className="field"><label>Local do corpo</label><input value={local} onChange={(event) => setLocal(event.target.value)} placeholder="Ex.: antebraço" /></div><div className="field"><label>Detalhes</label><textarea value={mensagem} onChange={(event) => setMensagem(event.target.value)} /></div><div className="contact-actions"><a className="btn primary" href={whatsappLink} target="_blank" rel="noreferrer">Enviar no WhatsApp</a></div></form></div></div>
  </div></div></section>;
}
