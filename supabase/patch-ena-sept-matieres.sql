-- ══════════════════════════════════════════════════════════════════════
--  Forma Business Lex — correctif ciblé : concours ENA, les sept matières
--  À exécuter dans Supabase : SQL Editor > New query > Run
-- ══════════════════════════════════════════════════════════════════════
--
--  POURQUOI CE SCRIPT
--  ------------------
--  Le programme du concours ENA a été réaligné sur ses sept matières :
--  méthodologie juridique, anglais, droit constitutionnel, droit
--  administratif, finances publiques, droit international public, droit fiscal.
--  Ce contenu est intégré au build (src/constants/content.ts) : sans ligne en
--  base, le site l'affiche déjà et ce script ne sert à rien.
--
--  En revanche, dès qu'une ligne existe dans public.published_content, c'est
--  elle qui est affichée : le contenu distant est fusionné par-dessus le
--  contenu intégré, et les tableaux distants remplacent les tableaux intégrés.
--  Une base « déjà publiée » continue donc d'afficher l'ancien programme ENA.
--  Ce script corrige précisément ces lignes, en FR et en AR.
--
--  AVANT D'EXÉCUTER (requête à part)
--  --------------------------------
--      select lang, version, updated_at from public.published_content order by lang;
--
--    • aucune ligne  → rien à faire, le site affiche déjà le nouveau contenu ;
--    • des lignes    → exécutez ce script, ou passez par l'administration
--      (Programmes phares → Concours ENA → corriger → Publier, en FR puis en AR).
--
--  CE QUE FAIT LE SCRIPT
--  ---------------------
--  Pour chaque langue (fr, ar), sur le contenu publié — et sur le brouillon de
--  l'administration s'il en existe un, pour ne pas republier l'ancien texte :
--    • meta.description                 : description du site (référencement) ;
--    • trust.highlights                 : atout « Concours ENA » ;
--    • formations.domains               : carte de cours ENA (texte + mots-clés) ;
--    • programs.items (id = « ena »)    : programme phare (titre, texte, modules) ;
--    • news.posts                       : extrait de l'actualité ENA ;
--    • pricing.offers                   : formule tarifaire ENA (accroche + avantages) ;
--    • faq.items                        : insère la question « quelles matières ? »
--                                         en deuxième position, comme dans le
--                                         contenu intégré, si elle manque.
--  La structure JSON n'est pas modifiée : mêmes clés, mêmes tableaux — seules
--  les valeurs changent, afin que l'administration continue d'éditer les mêmes
--  champs. Le script est rejouable : une seconde exécution ne modifie rien.
--
--  Chaque publication incrémente « version » et écrit une ligne dans
--  public.content_revisions : un retour en ar reste possible depuis
--  l'administration (Historique > Restaurer).
--
--  SÉCURITÉ
--  --------
--  Aucune clé n'est nécessaire : le script s'exécute avec vos droits dans le
--  SQL Editor. La clé service_role n'intervient pas (elle est réservée à
--  `npm run seed:content`, dans un terminal, jamais dans le site ni dans Git).
-- ══════════════════════════════════════════════════════════════════════

-- ── 1. Garde-fou : le schéma doit être en place ──────────────────────────
do $$
begin
  if to_regclass('public.published_content') is null
     or to_regclass('public.content_drafts') is null then
    raise exception 'Tables de contenu absentes : exécutez d''abord supabase/schema.sql.';
  end if;
end $$;

-- ── 2. Utilitaire : complète les champs d'un élément d'un tableau JSON ────
-- Remplace uniquement les éléments désignés par `p_match` (une liste de
-- couples clé/valeur, ex. [{"key":"id","value":"ena"}]) et seulement les
-- champs donnés dans `p_fields`. Une section absente, d'une autre forme ou
-- sans élément ENA est laissée telle quelle (avec un avertissement) : le
-- script ne peut ni créer ni vider une section par erreur.
create or replace function pg_temp.patch_items(
  p_data   jsonb,
  p_path   text[],
  p_match  jsonb,
  p_fields jsonb
) returns jsonb
language plpgsql
stable
as $$
declare
  v_section text := array_to_string(p_path, '.');
  v_items   jsonb;
  v_hits    integer;
begin
  if coalesce(jsonb_typeof(p_data #> p_path), '') <> 'array' then
    raise warning 'Section « % » absente ou non tableau : laissée telle quelle.', v_section;
    return p_data;
  end if;

  select count(*) into v_hits
    from jsonb_array_elements(p_data #> p_path) as item
   where exists (
     select 1
       from jsonb_array_elements(p_match) as m
      where item ->> (m ->> 'key') = (m ->> 'value')
   );

  if v_hits = 0 then
    raise warning 'Aucun élément ENA dans « % » : section laissée telle quelle.', v_section;
    return p_data;
  end if;

  select jsonb_agg(
           case
             when exists (
               select 1
                 from jsonb_array_elements(p_match) as m
                where item ->> (m ->> 'key') = (m ->> 'value')
             )
             then item || p_fields
             else item
           end
           order by ord
         )
    into v_items
    from jsonb_array_elements(p_data #> p_path) with ordinality as t(item, ord);

  return jsonb_set(p_data, p_path, coalesce(v_items, p_data #> p_path));
end;
$$;

-- ── 3. Les valeurs ciblées, une ligne par langue ─────────────────────────
-- Reprises telles quelles du contenu intégré au build : la parité FR/AR est
-- garantie, aucune ressaisie manuelle.
drop table if exists pg_temp.ena_patch;

create temp table ena_patch (
  lang                  text primary key,
  label                 text not null,
  meta_description      text not null,
  highlight_description text not null,
  formation_description text not null,
  formation_tags        jsonb not null,
  program_title         text not null,
  program_description   text not null,
  program_modules       jsonb not null,
  news_excerpt          text not null,
  pricing_tagline       text not null,
  pricing_features      jsonb not null,
  faq_question          text not null,
  faq_answer            text not null
);

insert into pg_temp.ena_patch (
  lang, label, meta_description, highlight_description, formation_description,
  formation_tags, program_title, program_description, program_modules,
  news_excerpt, pricing_tagline, pricing_features, faq_question, faq_answer
) values
  (
    'fr',
    'Concours ENA',
    'Forma Business Lex, centre de formation à Tunis : droit des affaires, fiscalité, marchés publics, gouvernance et préparation au concours ENA (méthodologie juridique, anglais, droit public, finances publiques, droit fiscal).',
    'Les sept matières du concours, en révision en ligne.',
    'Méthodologie juridique, anglais, droit constitutionnel, droit administratif, finances publiques, droit international public et droit fiscal : les sept matières du concours.',
    to_jsonb(ARRAY['Méthodologie', 'Droit public', 'Finances publiques']::text[]),
    'Préparation au concours ENA — les sept matières, en ligne',
    'Une préparation structurée qui couvre les sept matières du concours : méthodologie juridique, anglais, droit constitutionnel, droit administratif, finances publiques, droit international public et droit fiscal.',
    to_jsonb(ARRAY['Méthodologie juridique', 'Anglais', 'Droit constitutionnel', 'Droit administratif', 'Finances publiques', 'Droit international public', 'Droit fiscal']::text[]),
    'Méthodologie juridique, anglais, droit constitutionnel, droit administratif, finances publiques, droit international public, droit fiscal : les sept matières du concours.',
    'Les sept matières du concours, avec méthode et entraînement.',
    to_jsonb(ARRAY['Les 7 matières du concours', 'Méthodologie juridique & anglais', 'Droit public, finances publiques & droit fiscal', 'Entraînement sur sujets et préparation à l''oral']::text[]),
    'Quelles matières couvre la préparation au concours ENA ?',
    'La préparation couvre les sept matières du concours : méthodologie juridique, anglais, droit constitutionnel, droit administratif, finances publiques, droit international public et droit fiscal.'
  ),
  (
    'ar',
    'مناظرة ENA',
    'فورما بيزنس لاكس، مركز تكوين في تونس: قانون الأعمال والجباية والصفقات العمومية والحوكمة والامتثال، والتحضير لمناظرة ENA (المنهجية القانونية، الإنجليزية، القانون العام، المالية العمومية).',
    'المواد السبع للمناظرة مع مراجعة عن بُعد.',
    'المنهجية القانونية واللغة الإنجليزية والقانون الدستوري والقانون الإداري والمالية العمومية والقانون الدولي العام والقانون الجبائي: المواد السبع للمناظرة.',
    to_jsonb(ARRAY['المنهجية', 'القانون العام', 'المالية العمومية']::text[]),
    'التحضير لمناظرة المدرسة الوطنية للإدارة — المواد السبع عن بُعد',
    'تحضير منهجي يغطي المواد السبع للمناظرة: المنهجية القانونية، اللغة الإنجليزية، القانون الدستوري، القانون الإداري، المالية العمومية، القانون الدولي العام والقانون الجبائي.',
    to_jsonb(ARRAY['المنهجية القانونية', 'اللغة الإنجليزية', 'القانون الدستوري', 'القانون الإداري', 'المالية العمومية', 'القانون الدولي العام', 'القانون الجبائي']::text[]),
    'المنهجية القانونية، اللغة الإنجليزية، القانون الدستوري، القانون الإداري، المالية العمومية، القانون الدولي العام، القانون الجبائي: المواد السبع للمناظرة.',
    'المواد السبع للمناظرة بمنهجية وتدريب.',
    to_jsonb(ARRAY['المواد السبع للمناظرة', 'المنهجية القانونية واللغة الإنجليزية', 'القانون العام والمالية العمومية والقانون الجبائي', 'التدرب على المواضيع والتحضير للشفوي']::text[]),
    'ما هي المواد التي يغطيها التحضير لمناظرة ENA؟',
    'يغطي التحضير المواد السبع للمناظرة: المنهجية القانونية، اللغة الإنجليزية، القانون الدستوري، القانون الإداري، المالية العمومية، القانون الدولي العام والقانون الجبائي.'
  )
;

-- ── 4. Application ──────────────────────────────────────────────────────
do $$
declare
  patch    record;
  v_target text;
  v_match  jsonb;
  v_data   jsonb;
  v_before jsonb;
  v_version integer;
  v_items   jsonb;
  v_prefix  jsonb;
  v_suffix  jsonb;
  v_note   text := 'Correctif SQL : concours ENA aligné sur les sept matières';
  v_author text := 'script patch-ena-sept-matieres.sql';
begin
  for patch in
    select * from pg_temp.ena_patch order by lang
  loop
    -- Un élément ENA se reconnaît à son libellé (« Concours ENA » / « مناظرة ENA »),
    -- porté par le champ interest, title, tag ou name selon la section.
    v_match := jsonb_build_array(
      jsonb_build_object('key', 'interest', 'value', patch.label),
      jsonb_build_object('key', 'title',    'value', patch.label),
      jsonb_build_object('key', 'tag',      'value', patch.label),
      jsonb_build_object('key', 'name',     'value', patch.label)
    );

    foreach v_target in array array['published_content', 'content_drafts'] loop
      execute format(
        'select data from public.%I where lang = %L for update', v_target, patch.lang
      ) into v_data;

      if v_data is null then
        if v_target = 'published_content' then
          raise notice '  % : aucune ligne publiée — le site affiche déjà le contenu intégré au build (rien à corriger).', patch.lang;
        end if;
        continue;
      end if;

      v_before := v_data;

      -- Description du site (référencement)
      if jsonb_typeof(v_data -> 'meta') = 'object' then
        v_data := jsonb_set(v_data, '{meta,description}', to_jsonb(patch.meta_description));
      end if;

      -- Atouts de la page d'accueil
      v_data := pg_temp.patch_items(v_data, '{trust,highlights}', v_match,
        jsonb_build_object('description', patch.highlight_description));

      -- Carte de cours (texte et mots-clés)
      v_data := pg_temp.patch_items(v_data, '{formations,domains}', v_match,
        jsonb_build_object('description', patch.formation_description, 'tags', patch.formation_tags));

      -- Programme phare, identifié par sa clé stable « ena »
      v_data := pg_temp.patch_items(v_data, '{programs,items}',
        jsonb_build_array(jsonb_build_object('key', 'id', 'value', 'ena')),
        jsonb_build_object('title', patch.program_title,
                           'description', patch.program_description,
                           'modules', patch.program_modules));

      -- Extrait de l'actualité
      v_data := pg_temp.patch_items(v_data, '{news,posts}', v_match,
        jsonb_build_object('excerpt', patch.news_excerpt));

      -- Formule tarifaire (accroche et avantages)
      v_data := pg_temp.patch_items(v_data, '{pricing,offers}', v_match,
        jsonb_build_object('tagline', patch.pricing_tagline, 'features', patch.pricing_features));

      -- FAQ : la question est insérée en deuxième position, comme dans le
      -- contenu intégré, et seulement si elle n'existe pas encore.
      if jsonb_typeof(v_data -> 'faq' -> 'items') = 'array'
         and not exists (
           select 1
             from jsonb_array_elements(v_data -> 'faq' -> 'items') as question
            where question ->> 'question' = patch.faq_question
         )
      then
        v_items := v_data -> 'faq' -> 'items';

        select coalesce(jsonb_agg(e order by ord), '[]'::jsonb)
          into v_prefix
          from jsonb_array_elements(v_items) with ordinality as t(e, ord)
         where ord <= 1;

        select coalesce(jsonb_agg(e order by ord), '[]'::jsonb)
          into v_suffix
          from jsonb_array_elements(v_items) with ordinality as t(e, ord)
         where ord > 1;

        v_data := jsonb_set(
          v_data,
          '{faq,items}',
          v_prefix
            || jsonb_build_object('question', patch.faq_question, 'answer', patch.faq_answer)
            || v_suffix
        );
      end if;

      if v_data = v_before then
        raise notice '  % / % : déjà à jour, aucune modification.', patch.lang, v_target;
        continue;
      end if;

      if v_target = 'published_content' then
        execute 'select version from public.published_content where lang = '
                || quote_literal(patch.lang)
          into v_version;
        v_version := coalesce(v_version, 0) + 1;

        execute format(
          'update public.published_content
              set data = $1, version = $2, updated_at = now()
            where lang = %L',
          patch.lang
        ) using v_data, v_version;

        execute format(
          'insert into public.content_revisions (lang, version, note, author, created_at, data)
           values (%L, $1, $2, $3, now(), $4)',
          patch.lang
        ) using v_version, v_note, v_author, v_data;

        raise notice '  % : contenu publié mis à jour (version %).', patch.lang, v_version;
      else
        execute format(
          'update public.content_drafts
              set data = $1, updated_at = now()
            where lang = %L',
          patch.lang
        ) using v_data;

        raise notice '  % : brouillon de l''administration réaligné (il sera publié tel quel).', patch.lang;
      end if;
    end loop;
  end loop;
end $$;

-- ── 5. Vérification ─────────────────────────────────────────────────────
-- Contrôle rapide après exécution : le programme ENA doit annoncer sept
-- matières et la question FAQ doit être présente, dans les deux langues.
do $$
declare
  r record;
begin
  for r in
    select p.lang,
           p.version,
           (select jsonb_array_length(item -> 'modules')
              from jsonb_array_elements(p.data -> 'programs' -> 'items') as item
             where item ->> 'id' = 'ena'
             limit 1) as modules,
           exists (
             select 1
               from jsonb_array_elements(p.data -> 'faq' -> 'items') as question
              where question ->> 'question' like '%matières%'
                 or question ->> 'question' like '%المواد%'
           ) as faq_ok
      from public.published_content p
     order by p.lang
  loop
    raise notice '  % : version %, programme ENA = % matières, question FAQ = %',
      r.lang,
      r.version,
      coalesce(r.modules::text, 'introuvable'),
      case when r.faq_ok then 'présente' else 'absente' end;
  end loop;

  if not exists (select 1 from public.published_content) then
    raise notice '  Aucune ligne publiée : le site affiche le contenu intégré au build, déjà à jour.';
  end if;
end $$;
