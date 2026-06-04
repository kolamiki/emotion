/**
 * Resolves a public asset path relative to the Vite `base` setting.
 * In dev mode, `import.meta.env.BASE_URL` is `/`, in production it is `/emotion/`.
 * This ensures assets from the `public/` folder are always found,
 * both locally and on GitHub Pages.
 *
 * Usage: getAssetUrl('/logo.png') => '/emotion/logo.png' (prod) or '/logo.png' (dev)
 */
export function getAssetUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  // Remove leading slash from path to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}
