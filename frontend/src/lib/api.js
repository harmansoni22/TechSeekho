const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; // External backend

export async function api(path, options = {}) {
  const isAbsolutePath = /^https?:\/\//i.test(path);
  const url = isAbsolutePath
    ? path
    : API_BASE_URL
      ? `${API_BASE_URL}${path}`
      : path;

  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown network error";
    throw new Error(`Network error calling ${url}: ${message}`);
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error ${res.status}: ${errorText}`);
  }

  return res.json();
}
