// lib/fracttal-auth.ts
// Manejo del token OAuth de Fracttal con caché automático

interface TokenCache {
  access_token: string;
  expires_at: number; // timestamp en ms
}

let tokenCache: TokenCache | null = null;

export async function getFracttalToken(): Promise<string> {
  const now = Date.now();

  // Si el token existe y aún tiene más de 5 minutos de vida, reutilizarlo
  if (tokenCache && tokenCache.expires_at - now > 5 * 60 * 1000) {
    return tokenCache.access_token;
  }

  // Pedir nuevo token
  const response = await fetch(process.env.FRACTTAL_TOKEN_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.FRACTTAL_CLIENT_ID!,
      client_secret: process.env.FRACTTAL_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error obteniendo token Fracttal: ${response.status}`);
  }

  const data = await response.json();

  // Guardar en caché (expires_in viene en segundos)
  tokenCache = {
    access_token: data.access_token,
    expires_at: now + data.expires_in * 1000,
  };

  return tokenCache.access_token;
}
