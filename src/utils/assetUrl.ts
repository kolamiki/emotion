/**
 * Resolves a public asset path relative to the Vite `base` setting.
 * With custom domain emotion.net.pl, `import.meta.env.BASE_URL` is `/`.
 * This ensures assets from the `public/` folder are always found,
 * both locally and in production.
 *
 * Usage: getAssetUrl('/logo.png') => '/logo.png'
 */
export function getAssetUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  // Remove leading slash from path to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}
