# LilTuning: Website, Online Booking and Event Ticketing

Website for a car audio shop in Antofagasta, Chile, with online booking (deposit paid through Mercado Pago), event ticket sales with QR check-in at the door, and an admin panel with two roles.

> Portfolio snapshot. Credentials and contact data are replaced with placeholders. Setup guide in Spanish: [SETUP.es.md](SETUP.es.md).

## Highlights

- **3-step booking wizard** that holds the slot for 15 minutes while the customer pays the deposit.
- **No double bookings, guaranteed by the database:** a partial unique index on `(booking_date, booking_time)` for active bookings, not application logic.
- **Mercado Pago webhooks** with HMAC signature validation and idempotency (a `payment_events` table with a unique key per payment and status).
- **Event ticketing with atomic anti-overselling:** Postgres functions reserve and release ticket stock in a single `UPDATE ... WHERE sold + qty <= total`, so two simultaneous buyers can never oversell.
- **QR tickets** generated on purchase and scanned with the phone camera for check-in.
- **Row Level Security** in Supabase with two staff roles (front desk and super admin).
- Deployed on **Cloudflare Workers** without Next.js middleware (not supported there yet); the session is renewed on the client instead.

## Stack

Next.js 16 · TypeScript · Tailwind CSS v4 · Supabase (Postgres, Auth, RLS) · Mercado Pago Checkout Pro · qrcode / jsQR · Cloudflare Workers (OpenNext)

## Structure

```
src/app/(public)        public site: home, services, booking, events
src/app/admin           admin panel: bookings, availability, events, staff, settings
src/app/api             bookings, tickets, Mercado Pago webhook, admin endpoints
src/components/booking  booking wizard
supabase/               schema.sql, tickets.sql, seed.sql
```

Author: Yerko Ramos Molina · Antofagasta, Chile
