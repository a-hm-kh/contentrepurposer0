/** Clipboard helper with a fallback for non-secure contexts / older browsers. */
export async function writeToClipboard(value: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "-1000px";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();

  try {
    const ok = document.execCommand("copy");
    if (!ok) throw new Error("execCommand('copy') failed");
  } finally {
    document.body.removeChild(area);
  }
}
