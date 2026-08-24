const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1";
const API_ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, "");

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch(path, { token, ...options } = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(body?.message || res.statusText, res.status, body);
  }
  return body;
}

export async function refreshAccessToken() {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = await res.json().catch(() => null);
  return body?.token || null;
}

export async function logoutRequest() {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  }).catch(() => {});
}

export async function uploadImage(file, token) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/uploads/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
    body: formData,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(body?.message || res.statusText, res.status, body);
  }
  return { url: `${API_ORIGIN}${body.url}` };
}
