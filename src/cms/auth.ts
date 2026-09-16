const SESSION_KEY = "neurops-admin-session";

export function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === "authenticated";
}

export function login(username: string, password: string) {
  const expectedUser = import.meta.env.VITE_ADMIN_USER || "ogoatatu";
  const expectedPassword = import.meta.env.VITE_ADMIN_PASSWORD || "netinhoalenda2026";
  const valid = username === expectedUser && password === expectedPassword;
  if (valid) sessionStorage.setItem(SESSION_KEY, "authenticated");
  return valid;
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}
