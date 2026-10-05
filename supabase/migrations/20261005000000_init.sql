-- =============================================================================
-- Coach de Ventas · Mente Fría — esquema inicial
-- =============================================================================
-- Separación por dominio:
--   usuarios        → profiles
--   productos       → products
--   manual / docs   → knowledge_documents
--   escenarios      → scenarios, difficulty_levels, preset_profiles
--   evaluación      → scoring_config
--   simulaciones    → simulations, simulation_secrets, simulation_turns
--   configuración   → app_settings
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Usuarios
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('seller', 'manager', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role public.user_role not null default 'seller',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Rol del usuario actual. security definer para poder usarse dentro de
-- políticas RLS de la propia tabla profiles sin recursión.
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.is_manager_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('manager', 'admin'), false)
$$;

-- Crea el perfil al registrarse un usuario. El primer usuario del sistema es admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first boolean;
begin
  select not exists (select 1 from public.profiles) into is_first;
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case
      when is_first then 'admin'::public.user_role
      when new.raw_user_meta_data ->> 'role' in ('seller', 'manager', 'admin')
        then (new.raw_user_meta_data ->> 'role')::public.user_role
      else 'seller'::public.user_role
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Productos
-- -----------------------------------------------------------------------------
create type public.stock_status as enum ('in_stock', 'backorder', 'unavailable');
create type public.market_segment as enum ('residential', 'commercial', 'both');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  description text not null default '',
  price numeric(12, 2),
  currency text not null default 'MXN',
  price_notes text not null default '',
  shipping_cost numeric(12, 2),
  delivery_time text not null default '',
  stock_status public.stock_status not null default 'in_stock',
  stock_notes text not null default '',
  segment public.market_segment not null default 'both',
  features text[] not null default '{}',
  benefits text[] not null default '{}',
  specs jsonb not null default '{}'::jsonb,         -- { "Dimensiones": "195 × 80 × 71 cm", ... }
  ideal_use text not null default '',
  recommended_customer text not null default '',
  installation_requirements text not null default '',
  warranty text not null default '',
  images text[] not null default '{}',
  faqs jsonb not null default '[]'::jsonb,          -- [{ "q": "...", "a": "..." }]
  objections jsonb not null default '[]'::jsonb,    -- [{ "objection": "...", "response": "..." }]
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Base de conocimiento (manual de ventas, políticas, FAQs, objeciones…)
-- -----------------------------------------------------------------------------
create table public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,  -- ver src/lib/knowledge/categories.ts
  content text not null default '',
  source_file_name text,
  storage_path text,
  priority int not null default 50,     -- mayor = más importante; el manual va primero
  use_in_customer boolean not null default false,  -- ¿lo puede "saber" el cliente simulado?
  use_in_evaluation boolean not null default true, -- ¿lo usa el coach?
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Escenarios, dificultad y perfiles predeterminados
-- -----------------------------------------------------------------------------
create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null default '',
  segment public.market_segment not null default 'residential',
  prompt_hints text not null default '',     -- guía para el generador del perfil
  likely_products text[] not null default '{}',  -- slugs sugeridos (no obligatorios)
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.difficulty_levels (
  key text primary key,
  name text not null,
  description text not null default '',
  -- rangos [min, max] por parámetro de personalidad
  param_ranges jsonb not null default '{}'::jsonb,
  -- instrucciones de comportamiento que se inyectan al agente cliente
  behavior_prompt text not null default '',
  -- cuánta info muestra la ficha de preparación: full | partial | minimal
  prep_detail text not null default 'partial',
  sort_order int not null default 0
);

create table public.preset_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scenario_key text,
  difficulty_key text references public.difficulty_levels (key) on delete set null,
  profile jsonb not null,
  active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Configuración de la evaluación (pesos, reglas, campos de descubrimiento)
-- -----------------------------------------------------------------------------
create table public.scoring_config (
  id int primary key default 1 check (id = 1),
  categories jsonb not null,
  rules jsonb not null,
  discovery_fields jsonb not null,
  coach_notes text not null default '',
  updated_at timestamptz not null default now()
);

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Simulaciones
-- -----------------------------------------------------------------------------
create type public.simulation_status as enum (
  'ready', 'in_progress', 'evaluating', 'completed', 'failed', 'abandoned'
);

create table public.simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  scenario_key text not null,
  scenario_name text not null,
  difficulty_key text not null,
  difficulty_name text not null,
  prep_mode text not null default 'prep' check (prep_mode in ('prep', 'cold')),
  status public.simulation_status not null default 'ready',
  -- Datos visibles para el vendedor (nombre, etiqueta, ficha de preparación)
  customer_name text not null,
  customer_label text not null,
  prep_brief jsonb,
  voice_hint jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds int,
  -- Resultados
  score int,
  rating text,
  category_scores jsonb,
  outcome text,
  evaluation jsonb,
  followup_message text,
  followup_evaluation jsonb,
  error text,
  created_at timestamptz not null default now()
);

create index simulations_user_created_idx on public.simulations (user_id, created_at desc);

-- El perfil secreto vive en una tabla aparte: el vendedor sólo puede leerlo
-- cuando la simulación ya terminó y fue evaluada.
create table public.simulation_secrets (
  simulation_id uuid primary key references public.simulations (id) on delete cascade,
  profile jsonb not null,
  -- estado oculto del cliente que evoluciona durante la llamada
  customer_state jsonb not null default '{}'::jsonb,
  -- campos descubiertos detectados en vivo: { "budget": { "turn": 12, "value": "..." } }
  discovery_live jsonb not null default '{}'::jsonb
);

create type public.speaker as enum ('seller', 'customer');

create table public.simulation_turns (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid not null references public.simulations (id) on delete cascade,
  seq int not null,
  speaker public.speaker not null,
  text text not null,
  t_offset_ms int not null default 0,  -- ms desde el inicio de la llamada
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (simulation_id, seq)
);

-- -----------------------------------------------------------------------------
-- updated_at automático
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger knowledge_touch before update on public.knowledge_documents
  for each row execute function public.touch_updated_at();
create trigger scoring_touch before update on public.scoring_config
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- RLS
-- Las escrituras sensibles (simulaciones, secretos, turnos, usuarios) se hacen
-- desde el servidor con la service role key. Aquí sólo se habilita lectura.
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.scenarios enable row level security;
alter table public.difficulty_levels enable row level security;
alter table public.preset_profiles enable row level security;
alter table public.scoring_config enable row level security;
alter table public.app_settings enable row level security;
alter table public.simulations enable row level security;
alter table public.simulation_secrets enable row level security;
alter table public.simulation_turns enable row level security;

create policy "profiles: ver el propio" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_manager_or_admin());

-- Catálogo y configuración: lectura para usuarios autenticados, escritura admin
create policy "products: lectura" on public.products
  for select to authenticated using (true);
create policy "products: admin" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "knowledge: lectura" on public.knowledge_documents
  for select to authenticated using (true);
create policy "knowledge: admin" on public.knowledge_documents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "scenarios: lectura" on public.scenarios
  for select to authenticated using (true);
create policy "scenarios: admin" on public.scenarios
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "difficulty: lectura" on public.difficulty_levels
  for select to authenticated using (true);
create policy "difficulty: admin" on public.difficulty_levels
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "scoring: lectura" on public.scoring_config
  for select to authenticated using (true);
create policy "scoring: admin" on public.scoring_config
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "settings: admin" on public.app_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Los perfiles predeterminados contienen información secreta: sólo gerentes/admin
create policy "presets: gerentes" on public.preset_profiles
  for select to authenticated using (public.is_manager_or_admin());
create policy "presets: admin" on public.preset_profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "simulations: propias o equipo" on public.simulations
  for select to authenticated
  using (user_id = auth.uid() or public.is_manager_or_admin());

create policy "turns: propias o equipo" on public.simulation_turns
  for select to authenticated
  using (exists (
    select 1 from public.simulations s
    where s.id = simulation_id
      and (s.user_id = auth.uid() or public.is_manager_or_admin())
  ));

create policy "secrets: sólo después de evaluar" on public.simulation_secrets
  for select to authenticated
  using (exists (
    select 1 from public.simulations s
    where s.id = simulation_id
      and s.status in ('completed', 'failed', 'abandoned')
      and (s.user_id = auth.uid() or public.is_manager_or_admin())
  ));

-- -----------------------------------------------------------------------------
-- Storage: imágenes de producto (públicas) y documentos fuente (privados)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true), ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "product-images: lectura pública" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "product-images: admin escribe" on storage.objects
  for all to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "documents: admin" on storage.objects
  for all to authenticated
  using (bucket_id = 'documents' and public.is_admin())
  with check (bucket_id = 'documents' and public.is_admin());
