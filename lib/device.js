// Client-side: generate a stable browser fingerprint
// Called once on login and sent with every request as a header

export function getDeviceId() {
  // Try stored ID first
  try {
    const stored = localStorage.getItem('tb_device');
    if (stored) return stored;
  } catch {}

  // Build fingerprint from stable browser properties
  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency,
  ].join('|');

  // Simple hash
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  const id = Math.abs(hash).toString(36) + Date.now().toString(36);

  try { localStorage.setItem('tb_device', id); } catch {}
  return id;
}
