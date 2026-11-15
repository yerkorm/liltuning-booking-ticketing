-- LilTuning — evento de ejemplo (opcional, solo para probar el flujo).
-- Correr DESPUÉS de tickets.sql si quieres datos de prueba.
-- Bórralo desde Admin -> Eventos cuando tengas el evento real.

with new_event as (
  insert into events (name, slug, description, venue, starts_at, status)
  values (
    'Encuentro LilTuning Car Audio',
    'encuentro-liltuning-car-audio',
    'Exhibición de autos con sistemas de audio instalados por LilTuning, música en vivo y competencia de sonido (SPL).',
    'Por confirmar',
    now() + interval '30 days',
    'published'
  )
  on conflict (slug) do nothing
  returning id
)
insert into ticket_types (event_id, name, price_clp, quantity_total, sort_order)
select id, 'General', 5000, 100, 1 from new_event
union all
select id, 'VIP (acceso zona reservada)', 12000, 30, 2 from new_event;
