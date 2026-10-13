-- ══════════════════════════════════════════════════════════════════════
--  Forma Business Lex — schéma du contenu éditable
--  À exécuter une seule fois dans Supabase : SQL Editor > New query > Run
-- ══════════════════════════════════════════════════════════════════════

-- ─────────────────────────── Tables ───────────────────────────

-- Contenu publié, celui que lit le site public.
create table if not exists public.published_content (
  lang       text primary key check (lang in ('fr', 'ar')),
  data       jsonb not null,
  version    integer not null default 1,
  updated_at timestamptz not null default now()
);

-- Brouillon de travail de l'administration (non visible du public).
create table if not exists public.content_drafts (
  lang       text primary key check (lang in ('fr', 'ar')),
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- Historique des publications : permet de revenir en arrière.
create table if not exists public.content_revisions (
  id         bigint generated always as identity primary key,
  lang       text not null check (lang in ('fr', 'ar')),
  version    integer not null,
  note       text not null default '',
  author     text not null default '',
  created_at timestamptz not null default now(),
  data       jsonb not null
);

create index if not exists content_revisions_lang_version_idx
  on public.content_revisions (lang, version desc);

comment on table public.published_content is 'Contenu publié du site, une ligne par langue.';
comment on table public.content_drafts    is 'Brouillons de l''administration, une ligne par langue.';
comment on table public.content_revisions is 'Historique des publications (restauration possible).';

-- ─────────────────────── Analytique ───────────────────────

-- Visites du site public : alimente le tableau de bord de l'administration.
-- Aucune donnée personnelle : ni adresse IP, ni empreinte, ni cookie tiers.
create table if not exists public.site_pageviews (
  id         uuid primary key default gen_random_uuid(),
  path       text not null default '/',
  referrer   text not null default '',
  source     text not null default 'Direct',
  lang       text not null default 'fr' check (lang in ('fr', 'ar')),
  visitor_id text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists site_pageviews_created_at_idx
  on public.site_pageviews (created_at desc);

-- Demandes reçues via le formulaire de contact (les « réservations »).
create table if not exists public.site_reservations (
  -- uuid fourni par le client : `insert` ne renvoie pas la ligne, l'admin a donc
  -- besoin de connaître l'identifiant dès l'envoi pour suivre le statut.
  id         uuid primary key default gen_random_uuid(),
  name       text not null default '',
  email      text not null default '',
  phone      text not null default '',
  interest   text not null default '',
  message    text not null default '',
  source     text not null default 'Direct',
  lang       text not null default 'fr' check (lang in ('fr', 'ar')),
  status     text not null default 'new'
             check (status in ('new', 'contacted', 'booked', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists site_reservations_created_at_idx
  on public.site_reservations (created_at desc);

comment on table public.site_pageviews     is 'Visites du site public (tableau de bord).';
comment on table public.site_reservations  is 'Demandes reçues via le formulaire de contact.';

-- ─────────────────── Sécurité au niveau des lignes ───────────────────
-- Lecture publique du contenu publié uniquement.
-- Écriture : uniquement un compte inscrit dans `admin_users` (liste blanche).
-- C'est cette couche — pas le mot de passe de l'interface — qui protège les données.
--
-- ⚠️  PENSEZ À DÉSACTIVER LES INSCRIPTIONS PUBLIQUES :
--     Dashboard Supabase → Authentication → Sign In / Providers →
--     désactivez « Allow new users to sign up ».
--     Sans cela, n'importe qui pourrait créer un compte… mais il resterait
--     SANS aucun pouvoir d'écriture tant que son identifiant n'est pas dans la liste.

-- Liste blanche des administrateurs (invisible du public : RLS activé, aucune policy).
create table if not exists public.admin_users (
  id       uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where id = auth.uid());
$$;

-- Après avoir créé votre compte administrateur (voir ADMIN.md), ajoutez-le :
--   insert into public.admin_users (id)
--     select id from auth.users where email = 'vous@exemple.com';

alter table public.published_content enable row level security;
alter table public.content_drafts    enable row level security;
alter table public.content_revisions enable row level security;

drop policy if exists "Lecture publique du contenu publié" on public.published_content;
create policy "Lecture publique du contenu publié"
  on public.published_content for select
  using (true);

drop policy if exists "Écriture réservée à l'administrateur (publié)" on public.published_content;
create policy "Écriture réservée à l'administrateur (publié)"
  on public.published_content for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Brouillons réservés à l'administrateur" on public.content_drafts;
create policy "Brouillons réservés à l'administrateur"
  on public.content_drafts for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Historique réservé à l'administrateur" on public.content_revisions;
create policy "Historique réservé à l'administrateur"
  on public.content_revisions for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─────────────────── Analytique ───────────────────
-- Le visiteur anonyme peut DÉPOSER une ligne (insert uniquement), mais jamais
-- lire ni modifier : la consultation reste réservée à l'administrateur.
-- C'est ce qui permet au site public de compter ses visites sans compte ni jeton.
-- Des limites de taille bloquent les dépôts abusifs (spam, données géantes).

alter table public.site_pageviews    enable row level security;
alter table public.site_reservations enable row level security;

-- Limites de taille (ré-application sans erreur si le script est relancé).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'site_pageviews_max_lengths') then
    alter table public.site_pageviews add constraint site_pageviews_max_lengths check (
      char_length(path) <= 300 and char_length(referrer) <= 300
      and char_length(source) <= 80 and char_length(visitor_id) <= 64
    );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'site_reservations_max_lengths') then
    alter table public.site_reservations add constraint site_reservations_max_lengths check (
      char_length(name) <= 120 and char_length(email) <= 160 and char_length(phone) <= 40
      and char_length(interest) <= 160 and char_length(message) <= 4000
      and char_length(source) <= 80
    );
  end if;
end $$;

drop policy if exists "Dépôt anonyme des visites" on public.site_pageviews;
create policy "Dépôt anonyme des visites"
  on public.site_pageviews for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Visites réservées à l'administrateur" on public.site_pageviews;
create policy "Visites réservées à l'administrateur"
  on public.site_pageviews for select
  using (public.is_admin());

drop policy if exists "Dépôt anonyme des demandes" on public.site_reservations;
create policy "Dépôt anonyme des demandes"
  on public.site_reservations for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Demandes réservées à l'administrateur" on public.site_reservations;
create policy "Demandes réservées à l'administrateur"
  on public.site_reservations for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─────────────────── Amorçage du contenu intégré ───────────────────
-- Facultatif : sans ligne en base, le site affiche le contenu intégré au build.
-- Exécutez `npm run seed:content` (voir ADMIN.md) pour pousser le contenu actuel.
