import { useState, type FormEvent } from "react";
import { isAuthenticated, login } from "../cms/auth";
import { useSiteContent } from "../cms/SiteContent";

export default function Login() {
  const { content } = useSiteContent();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated()) {
    window.location.replace("/admin");
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (login(username.trim(), password)) {
      window.location.assign("/admin");
      return;
    }
    setError("Usuário ou senha incorretos. Verifique os dados e tente novamente.");
  };

  return (
    <main className="admin-shell login-shell">
      <div className="login-ambient" aria-hidden="true">
        <span className="login-glow login-glow-one" />
        <span className="login-glow login-glow-two" />
        <span className="login-grid" />
      </div>

      <section className="login-layout" aria-labelledby="login-title">
        <aside className="login-showcase">
          <img className="login-showcase-photo" src={content.hero.image} alt="" />
          <span className="login-showcase-shade" aria-hidden="true" />

          <a href="/" className="login-brand" aria-label="Voltar para o site">
            <img src={content.brand.logo} alt="" />
            <span>{content.brand.name} <strong>{content.brand.suffix}</strong></span>
          </a>

          <div className="login-showcase-copy">
            <p>Área de administração</p>
            <h2>Seu portfólio, sob seu controle.</h2>
            <span>Atualize trabalhos, textos e informações do estúdio em um único lugar.</span>
          </div>
        </aside>

        <div className="login-panel">
          <div className="login-heading">
            <p className="admin-kicker">Acesso restrito</p>
            <h1 id="login-title">Bem-vindo de volta</h1>
            <p className="admin-muted">Entre com seus dados para gerenciar o site da Neurops Tattoo.</p>
          </div>

          <form className="admin-form login-form" onSubmit={handleSubmit}>
            <label>
              <span>Usuário</span>
              <input
                autoComplete="username"
                value={username}
                onChange={(event) => { setUsername(event.target.value); setError(""); }}
                placeholder="Digite seu usuário"
                autoFocus
                required
              />
            </label>
            <label>
              <span>Senha</span>
              <span className="login-password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => { setPassword(event.target.value); setError(""); }}
                  placeholder="Digite sua senha"
                  required
                />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </span>
            </label>

            {error && <p className="admin-error" role="alert">{error}</p>}
            <button className="admin-primary login-submit" type="submit">Entrar no painel</button>
          </form>

          <div className="login-footer">
            <a className="back-link" href="/">Voltar ao site</a>
            <span>Conteúdo protegido</span>
          </div>
        </div>
      </section>
    </main>
  );
}
