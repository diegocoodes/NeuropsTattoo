export async function isAuthenticated() {
  const response = await fetch("/api/session", { credentials: "same-origin" });
  if (!response.ok) return false;
  const data = await response.json().catch(() => null) as { authenticated?: boolean } | null;
  return data?.authenticated === true;
}

export async function login(username: string, password: string) {
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json().catch(() => null) as { authenticated?: boolean; error?: string } | null;
    if (response.ok && data?.authenticated === true) return { ok: true, error: "" };
    if (response.status === 401) return { ok: false, error: "Usuário ou senha incorretos." };
    return { ok: false, error: data?.error || "Serviço de login indisponível neste endereço." };
  } catch {
    return { ok: false, error: "Não foi possível conectar ao serviço de login." };
  }
}

export async function logout() {
  await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
}
