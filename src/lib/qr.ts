import QRCode from "qrcode";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I para evitar confusiones al tipear a mano

// Short, unambiguous, unique-enough ticket code (also embedded as the QR payload).
// Uses Web Crypto (available in both Node and the Cloudflare Workers runtime).
export function generateTicketCode(): string {
  const bytes = new Uint8Array(8);
  globalThis.crypto.getRandomValues(bytes);
  let suffix = "";
  for (const b of bytes) {
    suffix += CODE_ALPHABET[b % CODE_ALPHABET.length];
  }
  return `LT-${suffix}`;
}

// Server-only. Renders a QR code as an inline SVG string (no canvas/native
// deps — safe to run on Cloudflare Workers).
export async function renderQrSvg(text: string): Promise<string> {
  return QRCode.toString(text, { type: "svg", margin: 1, width: 220 });
}
