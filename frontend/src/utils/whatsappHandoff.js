const PENDING_WHATSAPP_KEY = 'nexora_pending_whatsapp'

export function stashPendingWhatsApp(url) {
  if (!url) return
  try {
    sessionStorage.setItem(PENDING_WHATSAPP_KEY, url)
  } catch {
    // Ignore quota / private-mode failures; signup still succeeds.
  }
}

export function consumePendingWhatsApp() {
  try {
    const url = sessionStorage.getItem(PENDING_WHATSAPP_KEY)
    if (url) sessionStorage.removeItem(PENDING_WHATSAPP_KEY)
    return url
  } catch {
    return null
  }
}
