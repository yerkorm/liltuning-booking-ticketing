-- LilTuning — datos iniciales
-- Correr DESPUÉS de schema.sql. Todo esto es contenido de ejemplo/editable
-- desde el panel de administración (Configuración / Servicios) una vez
-- exista el primer super_admin — ver README.md "Primer usuario".

-- Servicios de ejemplo (car audio) — ajustar nombres/precios reales luego.
insert into services (name, slug, description, duration_minutes, sort_order) values
  ('Instalación de equipo de audio', 'instalacion-audio', 'Instalación de radio, parlantes y amplificadores.', 90, 1),
  ('Aislación acústica', 'aislacion-acustica', 'Aislación de puertas y cabina para mejorar la calidad de sonido.', 120, 2),
  ('Instalación de subwoofer', 'instalacion-subwoofer', 'Instalación de caja/subwoofer y amplificador dedicado.', 90, 3),
  ('Diagnóstico y revisión', 'diagnostico-revision', 'Revisión de sistema de audio existente.', 45, 4)
on conflict (slug) do nothing;

-- Horario base: lunes a sábado, bloques de 1 hora.
insert into availability_rules (day_of_week, start_time, end_time, slot_duration_minutes) values
  (1, '09:30', '18:30', 60),
  (2, '09:30', '18:30', 60),
  (3, '09:30', '18:30', 60),
  (4, '09:30', '18:30', 60),
  (5, '09:30', '18:30', 60),
  (6, '09:30', '14:00', 60)
on conflict do nothing;

-- Configuración general del sitio.
insert into site_settings (key, value) values
  ('deposit_amount_clp', '10000'),
  ('business_name', '"LilTuning"'),
  ('business_slogan', '"CAR AUDIO FOR FANATICS"'),
  ('contact_phone', '"+56 9 0000 0000"'),
  ('contact_whatsapp', '"+56900000000"'),
  ('contact_email', '""'),
  ('contact_address', '""'),
  ('social_instagram', '"https://www.instagram.com/liltuning/"'),
  ('social_facebook', '""'),
  ('about_content', '"Contenido de ejemplo: reemplaza este texto en Admin -> Configuracion con la historia real de LilTuning."')
on conflict (key) do nothing;
