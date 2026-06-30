// Returns favicon URLs for bookmarks. `websiteFaviconUrl()` fetches
// the website HTML and extracts the declared favicon, while
// `faviconUrl()` remains a simple same-origin fallback to /favicon.ico.
//
// The presentation layer wraps the URL in an <img> with fallback.
// We never embed the URL as an <a href> or as a string injected
// into the DOM, so the "src" attribute is the only XSS surface.

const faviconCache = new Map();

/**
 * @param {string} pageUrl - a fully-qualified http(s) URL
 * @returns {string|null}
 */
export function faviconUrl(pageUrl) {
  if (typeof pageUrl !== "string" || pageUrl.length === 0) return null;
  try {
    const url = new URL(pageUrl);
    if (!/^https?:$/.test(url.protocol)) return null;
    return `${url.origin}/favicon.ico`;
  } catch {
    return null;
  }
}

/**
 * Fetches the favicon referenced by the website itself.
 * Uses Google's Favicon service to avoid CORS issues and manual fetching.
 * Falls back to /favicon.ico when no icon link is declared.
 *
 * @param {string} pageUrl
 * @returns {Promise<string|null>}
 */
export function websiteFaviconUrl(pageUrl) {
  if (typeof pageUrl !== "string" || pageUrl.length === 0) return Promise.resolve(null);
  let normalized;
  try {
    normalized = new URL(pageUrl);
    if (!/^https?:$/.test(normalized.protocol)) return Promise.resolve(null);
  } catch {
    return Promise.resolve(null);
  }

  const url = `https://www.google.com/s2/favicons?domain=${normalized.hostname}&sz=64`;
  return Promise.resolve(url);
}

/** First letter of the bookmark title, uppercased. Used as
 *  a fallback when the favicon fails to load. */
export function initial(title) {
  if (typeof title !== "string") return "?";
  const trimmed = title.trim();
  if (trimmed.length === 0) return "?";
  return trimmed.charAt(0).toUpperCase();
}
