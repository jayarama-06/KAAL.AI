/**
 * copyToClipboard
 * ─────────────────────────────────────────────────────────────────────────────
 * Tries the modern Clipboard API first.
 * Falls back to the legacy execCommand approach when the Clipboard API is
 * blocked by a permissions policy (e.g. inside iframes / Figma Make preview).
 */
export async function copyToClipboard(text: string): Promise<void> {
  // Modern path
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to legacy path
    }
  }

  // Legacy fallback — works in iframe / restricted contexts
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(ta);
  }
}
