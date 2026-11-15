export function whatsappLink(number: string): string {
  const digits = number.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}`;
}
