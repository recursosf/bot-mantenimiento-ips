-- Esquema para el bot de reportes de mantenimiento
-- Ejecutar en Supabase: Project > SQL Editor > New Query > pegar y RUN

create table if not exists usuarios (
  telegram_id bigint primary key,
  nombre text not null,
  puesto_salud text,
  rol text not null default 'reportante', -- 'reportante' o 'admin'
  created_at timestamptz not null default now()
);

create table if not exists solicitudes (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint references usuarios(telegram_id),
  puesto_salud text,
  tipo text not null check (tipo in ('infraestructura','equipo_biomedico')),
  descripcion text not null,
  prioridad text not null check (prioridad in ('alta','media','baja')),
  estado text not null default 'pendiente' check (estado in ('pendiente','en_proceso','resuelto')),
  foto_file_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists conversacion_estado (
  telegram_id bigint primary key,
  paso text not null,
  datos jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create index if not exists idx_solicitudes_estado on solicitudes(estado);
create index if not exists idx_solicitudes_telegram_id on solicitudes(telegram_id);

-- IMPORTANTE: después de crear las tablas, regístrate primero desde Telegram
-- con /start, y luego marca tu propio usuario como admin ejecutando:
-- update usuarios set rol = 'admin' where telegram_id = TU_ID_DE_TELEGRAM;

___________________________________________________________

Project ID
Reference used in APIs and URLs.:
bkwtnzeanumyhwsecogp

Service Role
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrd3RuemVhbnVteWh3c2Vjb2dwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTczNzI5NCwiZXhwIjoyMTA1MzEzMjk0fQ.g4NgPaInPyjIQzhXjwnIFyiVkcp3T0QSRvv98VbLM94
