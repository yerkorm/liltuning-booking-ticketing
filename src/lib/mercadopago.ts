import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import crypto from "node:crypto";

function getClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN no está configurado");
  }
  return new MercadoPagoConfig({ accessToken });
}

interface CreatePreferenceArgs {
  bookingId: string;
  serviceName: string;
  depositAmountClp: number;
  customerEmail: string;
}

export async function createBookingPreference({
  bookingId,
  serviceName,
  depositAmountClp,
  customerEmail,
}: CreatePreferenceArgs) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const preference = new Preference(getClient());

  const response = await preference.create({
    body: {
      items: [
        {
          id: bookingId,
          title: `Abono de reserva — ${serviceName} — LilTuning`,
          quantity: 1,
          unit_price: depositAmountClp,
          currency_id: "CLP",
        },
      ],
      payer: { email: customerEmail },
      back_urls: {
        success: `${siteUrl}/reservar/confirmacion?booking=${bookingId}`,
        failure: `${siteUrl}/reservar/confirmacion?booking=${bookingId}`,
        pending: `${siteUrl}/reservar/confirmacion?booking=${bookingId}`,
      },
      auto_return: "approved",
      notification_url: `${siteUrl}/api/mercadopago/webhook`,
      // Prefixed so the webhook can tell bookings and ticket orders apart.
      external_reference: `booking:${bookingId}`,
      statement_descriptor: "LILTUNING",
    },
  });

  return response;
}

interface TicketOrderItemInput {
  ticketTypeId: string;
  name: string;
  quantity: number;
  unitPriceClp: number;
}

interface CreateTicketOrderPreferenceArgs {
  orderId: string;
  eventName: string;
  items: TicketOrderItemInput[];
  buyerEmail: string;
}

export async function createTicketOrderPreference({
  orderId,
  eventName,
  items,
  buyerEmail,
}: CreateTicketOrderPreferenceArgs) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const preference = new Preference(getClient());

  const response = await preference.create({
    body: {
      items: items.map((item) => ({
        id: item.ticketTypeId,
        title: `${eventName} — Entrada ${item.name} — LilTuning`,
        quantity: item.quantity,
        unit_price: item.unitPriceClp,
        currency_id: "CLP",
      })),
      payer: { email: buyerEmail },
      back_urls: {
        success: `${siteUrl}/eventos/orden/${orderId}`,
        failure: `${siteUrl}/eventos/orden/${orderId}`,
        pending: `${siteUrl}/eventos/orden/${orderId}`,
      },
      auto_return: "approved",
      notification_url: `${siteUrl}/api/mercadopago/webhook`,
      external_reference: `ticket:${orderId}`,
      statement_descriptor: "LILTUNING",
    },
  });

  return response;
}

export async function getPayment(paymentId: string) {
  const payment = new Payment(getClient());
  return payment.get({ id: paymentId });
}

// Validates the `x-signature` header Mercado Pago sends on every webhook
// call. Format: "ts=<unix_ms>,v1=<hmac_sha256_hex>" over
// "id:<dataId>;request-id:<xRequestId>;ts:<ts>;" signed with the webhook
// secret configured in the MP developer panel.
export function verifyWebhookSignature({
  xSignature,
  xRequestId,
  dataId,
}: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
}): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || !xSignature) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim(), v?.trim()];
    })
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const template = `id:${dataId.toLowerCase()};request-id:${xRequestId ?? ""};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(template).digest("hex");

  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(v1);
  if (expectedBuf.length !== actualBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
