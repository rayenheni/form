import { type IconName } from "./icons";

export type Lang = "fr" | "ar";

/* ──────────────────────────────────────────────────────────────
 * Coordonnées — communiquées par le centre (mobiles + e-mail).
 * ⚠️ reste à confirmer : l'URL exacte de la page Facebook.
 * ────────────────────────────────────────────────────────────── */
export const contact = {
  name: "Forma Business Lex",
  /** Adresse e-mail du centre (utilisée par le formulaire de contact). */
  email: "forma.business.lex2025@gmail.com",
  /** Téléphones portables affichés sur le site (le 1er = numéro principal / WhatsApp). */
  phone: "+216 94 825 735",
  phones: ["+216 94 825 735", "+216 23 691 946"],
  /** Lien WhatsApp direct vers le numéro principal (sans le préfixe +). */
  whatsapp: "https://wa.me/21694825735",
  /** À REMPLACER par l'URL exacte de la page Facebook. */
  facebook: "https://www.facebook.com/search/top?q=Forma%20Business%20Lex",
};

/** Numéro au format `tel:` (espaces retirés) : « +216 94 825 735 » → « tel:+21694825735 ». */
export const telHref = (value: string) => `tel:${value.replace(/\s/g, "")}`;

/* ───────────────────────── Types ───────────────────────── */
export interface NavLink {
  label: string;
  href: string;
}

export interface Highlight {
  icon: IconName;
  title: string;
  description: string;
}

export interface Domain {
  icon: IconName;
  title: string;
  description: string;
  tags: string[];
  interest: string;
  featured?: boolean;
  badge?: string;
}

export interface FeaturedProgram {
  id: string;
  tab: string;
  icon: IconName;
  title: string;
  description: string;
  audience: string;
  format: string;
  modules: string[];
  interest: string;
}

export interface Benefit {
  icon: IconName;
  title: string;
  description: string;
}

export interface GalleryItem {
  src: string;
  alt: string;
  caption?: string;
  tag?: string;
}

export interface Post {
  tag: string;
  title: string;
  excerpt?: string;
  image: { src: string; alt: string };
}

export interface Offer {
  icon: IconName;
  name: string;
  tagline: string;
  price: string;
  priceNote: string;
  features: string[];
  cta: string;
  interest: string;
  highlighted?: boolean;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface SiteContent {
  meta: { title: string; description: string; ogTitle: string };
  skipLink: string;
  navAria: string;
  menuOpen: string;
  menuClose: string;
  navCta: string;
  navLinks: NavLink[];
  langLabel: string;
  hero: {
    badgeTag: string;
    badge: string;
    titleA: string;
    titleAccent: string;
    titleB: string;
    titleMark: string;
    titleC: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    points: string[];
    locationBadge: string;
    imgAlt: string;
    enaTitle: string;
    enaSubtitle: string;
    domainsLabel: string;
    heroDomains: { icon: IconName; label: string }[];
  };
  trust: {
    ariaLabel: string;
    audiencesLabel: string;
    highlights: Highlight[];
    audiences: string[];
  };
  formations: {
    eyebrow: string;
    titlePre: string;
    titleAccent: string;
    sideDesc: string;
    themesLabel: string;
    cta: string;
    domains: Domain[];
  };
  programs: {
    eyebrow: string;
    titlePre: string;
    titleMark: string;
    desc: string;
    tablistLabel: string;
    interested: string;
    viewFb: string;
    newTab: string;
    inProgram: string;
    items: FeaturedProgram[];
  };
  benefits: {
    eyebrow: string;
    titlePre: string;
    titleMark: string;
    desc: string;
    imgAlt: string;
    overlayTitle: string;
    overlayDesc: string;
    items: Benefit[];
  };
  gallery: {
    eyebrow: string;
    titlePre: string;
    titleAccent: string;
    desc: string;
    empty: string;
    openLabel: string;
    closeLabel: string;
    prevLabel: string;
    nextLabel: string;
    counterLabel: string;
    items: GalleryItem[];
  };
  news: {
    eyebrow: string;
    titlePre: string;
    titleAccent: string;
    desc: string;
    followFb: string;
    viewFb: string;
    newTab: string;
    posts: Post[];
  };
  pricing: {
    eyebrow: string;
    titlePre: string;
    titleMark: string;
    desc: string;
    featuredBadge: string;
    footnote: string;
    offers: Offer[];
  };
  faq: {
    eyebrow: string;
    titlePre: string;
    titleAccent: string;
    desc: string;
    cta: string;
    items: Faq[];
  };
  contactUi: {
    eyebrow: string;
    titlePre: string;
    titleAccent: string;
    desc: string;
    fbLabel: string;
    waLabel: string;
    address: string;
    reassurances: string[];
    formTitle: string;
    requiredNote: string;
    requiredMark: string;
    nameLabel: string;
    namePlaceholder: string;
    phoneLabel: string;
    emailLabel: string;
    subjectLabel: string;
    chooseSubject: string;
    messageLabel: string;
    optional: string;
    messagePlaceholder: string;
    consent: string;
    errors: { name: string; email: string; phone: string; interest: string; consent: string };
    sendErrorPre: string;
    submit: string;
    submitting: string;
    successSent: string;
    successMailto: string;
    sentDesc: string;
    mailtoPre: string;
    mailtoMid: string;
    another: string;
  };
  interests: string[];
  footer: {
    desc: string;
    colFormations: string;
    colNav: string;
    colContact: string;
    contactLink: string;
    formationsAria: string;
    navAria: string;
    fbAria: string;
    copyright: string;
    backTop: string;
  };
  mobileCta: { text: string; cta: string };
}

/* ───────────────────────── Français ───────────────────────── */
const fr: SiteContent = {
  meta: {
    title: "Forma Business Lex — Formations en droit des affaires, fiscalité & conformité | Tunis",
    description:
      "Forma Business Lex, centre de formation à Tunis : droit des affaires, fiscalité, marchés publics, gouvernance et préparation au concours ENA (méthodologie juridique, anglais, droit public, finances publiques, droit fiscal).",
    ogTitle: "Forma Business Lex — Centre de formation à Tunis",
  },
  skipLink: "Aller au contenu principal",
  navAria: "Navigation principale",
  menuOpen: "Ouvrir le menu",
  menuClose: "Fermer le menu",
  navCta: "Parler à un conseiller",
  navLinks: [
    { label: "Formations", href: "#formations" },
    { label: "Programmes", href: "#programmes" },
    { label: "Formules", href: "#formules" },
    { label: "Actualités", href: "#actualites" },
    { label: "Galerie", href: "#galerie" },
    { label: "FAQ", href: "#faq" },
  ],
  langLabel: "Changer de langue",
  hero: {
    badgeTag: "En ligne",
    badge: "Préparation au concours ENA",
    titleA: "Des formations",
    titleAccent: "juridiques",
    titleB: "qui",
    titleMark: "sécurisent",
    titleC: "vos décisions.",
    subtitle:
      "Formations pratiques et stratégiques en droit des affaires, fiscalité, marchés publics, gouvernance et conformité, à Tunis et en ligne.",
    ctaPrimary: "Parler à un conseiller",
    ctaSecondary: "Voir les formations",
    points: ["Formations pratiques", "Approche stratégique", "Formation en ligne"],
    locationBadge: "Tunis 2066",
    imgAlt: "Session de formation professionnelle en groupe",
    enaTitle: "Concours ENA",
    enaSubtitle: "Révision en ligne",
    domainsLabel: "Nos domaines",
    heroDomains: [
      { icon: "Scale", label: "Droit des affaires" },
      { icon: "Receipt", label: "Fiscalité" },
      { icon: "Landmark", label: "Marchés publics" },
      { icon: "ShieldCheck", label: "Conformité" },
    ],
  },
  trust: {
    ariaLabel: "Points clés",
    audiencesLabel: "Des formations conçues pour",
    highlights: [
      { icon: "MapPin", title: "Basé à Tunis", description: "Un centre de formation implanté à Tunis 2066." },
      { icon: "Laptop", title: "Formation en ligne", description: "Des sessions accessibles depuis toute la Tunisie." },
      { icon: "GraduationCap", title: "Concours ENA", description: "Les sept matières du concours, en révision en ligne." },
      { icon: "Layers", title: "Offre complète", description: "Du droit des affaires à la conformité." },
    ],
    audiences: [
      "Dirigeants de PME",
      "Directions juridiques",
      "Responsables RH",
      "Équipes achats & marchés publics",
      "Responsables conformité",
      "Experts-comptables",
      "Entrepreneurs & porteurs de projet",
      "Candidats aux concours administratifs",
    ],
  },
  formations: {
    eyebrow: "Nos formations",
    titlePre: "Des formations ciblées sur les",
    titleAccent: "enjeux qui comptent",
    sideDesc:
      "Chaque formation combine les fondamentaux juridiques, des cas concrets et des outils directement applicables dans votre quotidien professionnel.",
    themesLabel: "Thèmes abordés :",
    cta: "Demander le programme",
    domains: [
      {
        icon: "Scale",
        title: "Droit des affaires",
        description:
          "Contrats commerciaux, droit des sociétés, prévention des litiges : sécurisez chaque engagement de votre entreprise.",
        tags: ["Contrats", "Sociétés", "Contentieux"],
        interest: "Droit des affaires",
        featured: true,
      },
      {
        icon: "Receipt",
        title: "Fiscalité",
        description: "Comprenez vos obligations, anticipez les contrôles et prenez des décisions fiscales éclairées.",
        tags: ["Obligations fiscales", "Contrôle fiscal"],
        interest: "Fiscalité",
      },
      {
        icon: "Landmark",
        title: "Marchés publics",
        description: "Analysez un appel d'offres, construisez une offre solide et maîtrisez l'exécution du marché.",
        tags: ["Appels d'offres", "TUNEPS", "Exécution"],
        interest: "Marchés publics",
      },
      {
        icon: "ShieldCheck",
        title: "Gouvernance & conformité",
        description:
          "Instaurez des règles claires, protégez vos dirigeants et prévenez les risques de non-conformité.",
        tags: ["Gouvernance", "Données personnelles", "Anticorruption"],
        interest: "Gouvernance & conformité",
        featured: true,
      },
      {
        icon: "Users",
        title: "Droit du travail",
        description: "Contrat, discipline, rupture : sécurisez la relation de travail et prévenez les conflits.",
        tags: ["Contrat de travail", "Conflits"],
        interest: "Droit du travail",
      },
      {
        icon: "Rocket",
        title: "Création d'entreprise",
        description:
          "Choisissez votre forme juridique, accomplissez les formalités et lancez-vous sur de bonnes bases.",
        tags: ["Statuts", "Formalités"],
        interest: "Création d'entreprise",
        badge: "En ligne",
      },
      {
        icon: "GraduationCap",
        title: "Concours ENA",
        description:
          "Méthodologie juridique, anglais, droit constitutionnel, droit administratif, finances publiques, droit international public et droit fiscal : les sept matières du concours.",
        tags: ["Méthodologie", "Droit public", "Finances publiques"],
        interest: "Concours ENA",
        badge: "En ligne",
      },
      {
        icon: "Laptop",
        title: "Excel",
        description: "Formules, tableaux croisés dynamiques et tableaux de bord : gagnez en productivité au quotidien.",
        tags: ["Formules", "TCD", "Tableaux de bord"],
        interest: "Excel",
      },
      {
        icon: "Sparkles",
        title: "Intelligence artificielle (IA)",
        description: "Apprivoisez les outils d'IA pour automatiser vos tâches et prendre de meilleures décisions.",
        tags: ["Outils IA", "Automatisation", "Productivité"],
        interest: "IA",
      },
      {
        icon: "Users",
        title: "Ressources humaines",
        description: "Recrutement, paie, administration du personnel et développement des compétences.",
        tags: ["Recrutement", "Paie", "Compétences"],
        interest: "Ressources humaines",
      },
      {
        icon: "Briefcase",
        title: "Conseiller fiscal",
        description: "Devenez l'interlocuteur de référence en fiscalité : conseil, conformité et optimisation.",
        tags: ["Conseil", "Conformité", "Optimisation"],
        interest: "Conseiller fiscal",
      },
    ],
  },
  programs: {
    eyebrow: "Programmes à la une",
    titlePre: "Les programmes",
    titleMark: "du moment",
    desc: "Contenu, public visé et format : découvrez nos formations phares et recevez toutes les informations en un clic.",
    tablistLabel: "Programmes à la une",
    interested: "Je suis intéressé(e)",
    viewFb: "Voir sur Facebook",
    newTab: "(nouvel onglet)",
    inProgram: "Au programme",
    items: [
      {
        id: "ena",
        tab: "Concours ENA",
        icon: "GraduationCap",
        title: "Préparation au concours ENA — les sept matières, en ligne",
        description:
          "Une préparation structurée qui couvre les sept matières du concours : méthodologie juridique, anglais, droit constitutionnel, droit administratif, finances publiques, droit international public et droit fiscal.",
        audience: "Candidats au concours",
        format: "Révision en ligne",
        modules: [
          "Méthodologie juridique",
          "Anglais",
          "Droit constitutionnel",
          "Droit administratif",
          "Finances publiques",
          "Droit international public",
          "Droit fiscal",
        ],
        interest: "Concours ENA",
      },
      {
        id: "travail",
        tab: "Droit du travail",
        icon: "Users",
        title: "Maîtrisez le droit du travail et sécurisez durablement vos équipes",
        description:
          "Du recrutement à la rupture du contrat, apprenez à sécuriser chaque étape de la relation de travail et à prévenir les conflits professionnels.",
        audience: "Dirigeants, RH, managers",
        format: "En ligne",
        modules: [
          "Contrat de travail et période d'essai",
          "Pouvoir disciplinaire et sanctions",
          "Rupture du contrat : procédures et risques",
          "Prévention et gestion des conflits",
        ],
        interest: "Droit du travail",
      },
      {
        id: "creation",
        tab: "Création d'entreprise",
        icon: "Rocket",
        title: "Entreprendre avec succès : les clés pour créer votre entreprise",
        description:
          "Vous avez un projet d'entreprise ? Structurez-le sur des bases juridiques et fiscales solides, de l'idée jusqu'au lancement.",
        audience: "Porteurs de projet",
        format: "Formation professionnelle en ligne",
        modules: [
          "De l'idée au projet : valider et structurer",
          "Choisir la forme juridique adaptée",
          "Formalités de création, étape par étape",
          "Premières obligations fiscales et sociales",
        ],
        interest: "Création d'entreprise",
      },
    ],
  },
  benefits: {
    eyebrow: "Pourquoi nous choisir",
    titlePre: "Apprendre le droit pour",
    titleMark: "mieux décider",
    desc: "Nos formations vont à l'essentiel : comprendre les règles qui s'appliquent à votre activité et savoir les mettre en pratique.",
    imgAlt: "Apprenante suivant une formation en ligne sur son ordinateur portable",
    overlayTitle: "Pratique & stratégique",
    overlayDesc: "Le droit au service de vos décisions",
    items: [
      {
        icon: "Target",
        title: "Pratique avant tout",
        description: "Des cas concrets et des outils directement applicables à votre quotidien professionnel.",
      },
      {
        icon: "Compass",
        title: "Vision stratégique",
        description: "Comprendre les règles, mais surtout savoir les utiliser pour décider et anticiper.",
      },
      {
        icon: "Laptop",
        title: "Formation en ligne",
        description: "Formez-vous où que vous soyez en Tunisie, sans contrainte de déplacement.",
      },
      {
        icon: "MessageSquare",
        title: "Conseil personnalisé",
        description: "Un conseiller vous oriente vers le parcours adapté à votre profil et à vos objectifs.",
      },
    ],
  },
  gallery: {
    eyebrow: "Galerie",
    titlePre: "Nos formations",
    titleAccent: "en images",
    desc: "Sessions, ateliers et remises de certificats : un aperçu de la vie du centre.",
    empty: "Les photos seront publiées très prochainement.",
    openLabel: "Agrandir la photo",
    closeLabel: "Fermer la galerie",
    prevLabel: "Photo précédente",
    nextLabel: "Photo suivante",
    counterLabel: "Photo {current} sur {total}",
    items: [
      {
        src: "/galerie/formation.jpg",
        alt: "Session de formation dans une salle de classe, participants de dos prenant des notes",
        caption: "Session de formation en présentiel",
        tag: "Formation",
      },
      {
        src: "/galerie/atelier.jpg",
        alt: "Atelier juridique : deux participants annotent des documents et surlignent un texte",
        caption: "Atelier de travail sur dossiers",
        tag: "Atelier",
      },
      {
        src: "/galerie/bibliotheque.jpg",
        alt: "Bibliothèque juridique : rayonnages de livres de droit et code ouvert sur une table",
        caption: "Fonds documentaire juridique",
        tag: "Ressources",
      },
      {
        src: "/galerie/remise.jpg",
        alt: "Salle aménagée pour une remise de certificats, avec estrade et rangées de chaises",
        caption: "Remise des attestations",
        tag: "Événement",
      },
    ],
  },
  news: {
    eyebrow: "Actualités",
    titlePre: "Nos dernières",
    titleAccent: "publications",
    desc: "Annonces de formations, conseils pratiques et nouvelles sessions : suivez-nous sur Facebook pour ne rien manquer.",
    followFb: "Suivre sur Facebook",
    viewFb: "Voir sur Facebook",
    newTab: "(nouvel onglet)",
    posts: [
      {
        tag: "Concours ENA",
        title: "Préparation au concours ENA – révision en ligne",
        excerpt:
          "Méthodologie juridique, anglais, droit constitutionnel, droit administratif, finances publiques, droit international public, droit fiscal : les sept matières du concours.",
        image: {
          src: "https://images.pexels.com/photos/7972358/pexels-photo-7972358.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
          alt: "Prise de notes dans un cahier pendant une révision sur ordinateur portable",
        },
      },
      {
        tag: "Droit du travail",
        title: "Maîtrisez le droit du travail et sécurisez durablement vos équipes",
        excerpt: "Saviez-vous que la majorité des conflits professionnels…",
        image: {
          src: "https://images.pexels.com/photos/4344878/pexels-photo-4344878.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
          alt: "Échange professionnel lors d'un entretien de recrutement dans un bureau",
        },
      },
      {
        tag: "Formation en ligne",
        title: "Entreprendre avec succès : les clés pour créer votre entreprise",
        image: {
          src: "https://images.pexels.com/photos/7278886/pexels-photo-7278886.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
          alt: "Deux entrepreneurs préparent leur stratégie commerciale avec un ordinateur et des notes",
        },
      },
    ],
  },
  pricing: {
    eyebrow: "Formules",
    titlePre: "Une formule pour",
    titleMark: "chaque besoin",
    desc: "Les tarifs dépendent du programme, du format et du nombre de participants. Demandez un devis : nous vous répondons avec une proposition adaptée.",
    featuredBadge: "À la une",
    footnote: "Particuliers, entreprises et institutions : chaque proposition est établie selon vos objectifs.",
    offers: [
      {
        icon: "Briefcase",
        name: "Formation individuelle",
        tagline: "Pour monter en compétences sur un domaine précis.",
        price: "Sur devis",
        priceNote: "Selon le programme choisi",
        features: [
          "Formation en ligne",
          "Domaine au choix : affaires, fiscalité, travail…",
          "Supports de formation",
          "Orientation par un conseiller",
        ],
        cta: "Demander un devis",
        interest: "Formation individuelle",
      },
      {
        icon: "GraduationCap",
        name: "Préparation concours ENA",
        tagline: "Les sept matières du concours, avec méthode et entraînement.",
        price: "Sur devis",
        priceNote: "Révision en ligne",
        features: [
          "Les 7 matières du concours",
          "Méthodologie juridique & anglais",
          "Droit public, finances publiques & droit fiscal",
          "Entraînement sur sujets et préparation à l'oral",
        ],
        cta: "Demander les modalités",
        interest: "Concours ENA",
        highlighted: true,
      },
      {
        icon: "Building",
        name: "Entreprises & institutions",
        tagline: "Un programme construit autour des enjeux de vos équipes.",
        price: "Sur mesure",
        priceNote: "Selon vos besoins et vos effectifs",
        features: [
          "Analyse de vos besoins",
          "Programme adapté à votre secteur",
          "Formation de vos équipes",
          "Un interlocuteur dédié",
        ],
        cta: "Nous consulter",
        interest: "Entreprise / institution",
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    titlePre: "Vos questions,",
    titleAccent: "nos réponses",
    desc: "Vous ne trouvez pas votre réponse ? Écrivez-nous : un conseiller vous répond.",
    cta: "Poser une question",
    items: [
      {
        question: "Les formations se déroulent-elles en ligne ?",
        answer:
          "Oui. La préparation au concours ENA et nos formations professionnelles sont proposées en ligne. Contactez-nous pour connaître les modalités et les dates de chaque session.",
      },
      {
        question: "Quelles matières couvre la préparation au concours ENA ?",
        answer:
          "La préparation couvre les sept matières du concours : méthodologie juridique, anglais, droit constitutionnel, droit administratif, finances publiques, droit international public et droit fiscal.",
      },
      {
        question: "Où se trouve Forma Business Lex ?",
        answer: "Notre centre de formation est basé à Tunis (2066), en Tunisie.",
      },
      {
        question: "À qui s'adressent vos formations ?",
        answer:
          "Aux dirigeants, juristes, responsables RH et financiers, acheteurs publics, entrepreneurs, ainsi qu'aux candidats aux concours administratifs comme l'ENA.",
      },
      {
        question: "Faut-il des connaissances juridiques préalables ?",
        answer:
          "Pas pour les formations d'initiation. Un conseiller vous aide à choisir le parcours adapté à votre niveau et à vos objectifs.",
      },
      {
        question: "Proposez-vous des formations pour les entreprises ?",
        answer:
          "Contactez-nous pour étudier un programme adapté aux besoins de vos équipes : domaines, format et nombre de participants.",
      },
      {
        question: "Comment s'inscrire et connaître les tarifs ?",
        answer:
          "Remplissez le formulaire de contact ou écrivez-nous sur Facebook. Un conseiller vous communique les tarifs, les dates et les modalités d'inscription.",
      },
    ],
  },
  contactUi: {
    eyebrow: "Contact",
    titlePre: "Parlons de votre",
    titleAccent: "projet de formation",
    desc: "Dites-nous ce que vous souhaitez apprendre. Un conseiller vous recontacte pour vous orienter vers le bon parcours et vous communiquer les tarifs et les prochaines dates.",
    fbLabel: "Forma Business Lex sur Facebook",
    waLabel: "Écrire sur WhatsApp",
    address: "Tunis 2066, Tunisie",
    reassurances: ["Sans engagement", "Conseil personnalisé", "Réponse par e-mail ou téléphone"],
    formTitle: "Demande d'information",
    requiredNote: "Les champs marqués d'un",
    requiredMark: "*",
    nameLabel: "Nom et prénom",
    namePlaceholder: "Ex. : Ahmed Ben Salah",
    phoneLabel: "Téléphone / WhatsApp",
    emailLabel: "E-mail",
    subjectLabel: "Sujet",
    chooseSubject: "Choisissez un sujet…",
    messageLabel: "Message",
    optional: "(facultatif)",
    messagePlaceholder: "Précisez votre besoin : niveau, nombre de participants, disponibilités…",
    consent: "J'accepte d'être recontacté(e) par Forma Business Lex au sujet de ma demande.",
    errors: {
      name: "Indiquez votre nom et prénom.",
      email: "Saisissez une adresse e-mail valide.",
      phone: "Numéro de téléphone invalide.",
      interest: "Choisissez le sujet qui vous intéresse.",
      consent: "Merci d'accepter d'être recontacté(e).",
    },
    sendErrorPre: "L'envoi a échoué. Réessayez ou écrivez-nous directement à",
    submit: "Envoyer ma demande",
    submitting: "Envoi en cours…",
    successSent: "Merci, demande envoyée !",
    successMailto: "Plus qu'une étape",
    sentDesc: "Un conseiller Forma Business Lex vous recontacte très prochainement.",
    mailtoPre: "Votre messagerie s'est ouverte avec votre demande pré-remplie : il vous suffit de l'envoyer. Si rien ne s'est ouvert, écrivez-nous à",
    mailtoMid: "",
    another: "Envoyer une autre demande",
  },
  interests: [
    "Concours ENA",
    "Droit des affaires",
    "Fiscalité",
    "Marchés publics",
    "Gouvernance & conformité",
    "Droit du travail",
    "Création d'entreprise",
    "Formation individuelle",
    "Entreprise / institution",
    "Autre demande",
  ],
  footer: {
    desc: "Formations pratiques et stratégiques en droit des affaires, fiscalité, marchés publics, gouvernance et conformité.",
    colFormations: "Formations",
    colNav: "Navigation",
    colContact: "Contact",
    contactLink: "Contact",
    formationsAria: "Formations",
    navAria: "Liens du site",
    fbAria: "Forma Business Lex sur Facebook (nouvel onglet)",
    copyright: "© {year} Forma Business Lex · Tunis, Tunisie",
    backTop: "Retour en haut",
  },
  mobileCta: { text: "Une question sur nos formations ?", cta: "Contact" },
};

/* ───────────────────────── العربية ───────────────────────── */
const ar: SiteContent = {
  meta: {
    title: "فورما بيزنس لاكس — تكوينات في قانون الأعمال والجباية والامتثال | تونس",
    description:
      "فورما بيزنس لاكس، مركز تكوين في تونس: قانون الأعمال والجباية والصفقات العمومية والحوكمة والامتثال، والتحضير لمناظرة ENA (المنهجية القانونية، الإنجليزية، القانون العام، المالية العمومية).",
    ogTitle: "فورما بيزنس لاكس — مركز تكوين في تونس",
  },
  skipLink: "تخطَّ إلى المحتوى الرئيسي",
  navAria: "التنقل الرئيسي",
  menuOpen: "فتح القائمة",
  menuClose: "إغلاق القائمة",
  navCta: "تحدث مع مستشار",
  navLinks: [
    { label: "التكوينات", href: "#formations" },
    { label: "البرامج", href: "#programmes" },
    { label: "الصيغ", href: "#formules" },
    { label: "المستجدات", href: "#actualites" },
    { label: "معرض الصور", href: "#galerie" },
    { label: "الأسئلة الشائعة", href: "#faq" },
  ],
  langLabel: "تغيير اللغة",
  hero: {
    badgeTag: "عن بُعد",
    badge: "التحضير لمناظرة المدرسة الوطنية للإدارة",
    titleA: "تكوينات",
    titleAccent: "قانونية",
    titleB: "",
    titleMark: "تؤمّن",
    titleC: "قراراتكم.",
    subtitle:
      "تكوينات عملية واستراتيجية في قانون الأعمال والجباية والصفقات العمومية والحوكمة والامتثال، في تونس وعن بُعد.",
    ctaPrimary: "تحدث مع مستشار",
    ctaSecondary: "اكتشف التكوينات",
    points: ["تكوينات عملية", "مقاربة استراتيجية", "تكوين عن بُعد"],
    locationBadge: "تونس 2066",
    imgAlt: "حصة تكوين مهني جماعية",
    enaTitle: "مناظرة ENA",
    enaSubtitle: "مراجعة عن بُعد",
    domainsLabel: "مجالاتنا",
    heroDomains: [
      { icon: "Scale", label: "قانون الأعمال" },
      { icon: "Receipt", label: "الجباية" },
      { icon: "Landmark", label: "الصفقات العمومية" },
      { icon: "ShieldCheck", label: "الامتثال" },
    ],
  },
  trust: {
    ariaLabel: "نقاط أساسية",
    audiencesLabel: "تكوينات موجهة إلى",
    highlights: [
      { icon: "MapPin", title: "مقرّنا في تونس", description: "مركز تكوين في تونس 2066." },
      { icon: "Laptop", title: "تكوين عن بُعد", description: "حصص متاحة من كل أنحاء تونس." },
      { icon: "GraduationCap", title: "مناظرة ENA", description: "المواد السبع للمناظرة مع مراجعة عن بُعد." },
      { icon: "Layers", title: "عرض شامل", description: "من قانون الأعمال إلى الامتثال." },
    ],
    audiences: [
      "مسيّرو المؤسسات الصغرى والمتوسطة",
      "الإدارات القانونية",
      "مسؤولو الموارد البشرية",
      "فرق الشراءات والصفقات العمومية",
      "مسؤولو الامتثال",
      "الخبراء المحاسبون",
      "رواد الأعمال وحاملو المشاريع",
      "المترشحون للمناظرات الإدارية",
    ],
  },
  formations: {
    eyebrow: "تكويناتنا",
    titlePre: "تكوينات مركّزة على",
    titleAccent: "القضايا التي تهمّكم",
    sideDesc:
      "يجمع كل تكوين بين الأسس القانونية وحالات واقعية وأدوات قابلة للتطبيق المباشر في حياتكم المهنية.",
    themesLabel: "المحاور:",
    cta: "اطلب البرنامج",
    domains: [
      {
        icon: "Scale",
        title: "قانون الأعمال",
        description: "العقود التجارية وقانون الشركات والوقاية من النزاعات: أمّنوا كل التزامات مؤسستكم.",
        tags: ["العقود", "الشركات", "النزاعات"],
        interest: "قانون الأعمال",
        featured: true,
      },
      {
        icon: "Receipt",
        title: "الجباية",
        description: "افهموا واجباتكم وتوقعوا المراقبة واتخذوا قرارات جبائية سليمة.",
        tags: ["الواجبات الجبائية", "المراقبة الجبائية"],
        interest: "الجباية",
      },
      {
        icon: "Landmark",
        title: "الصفقات العمومية",
        description: "حلّلوا طلب العروض وابنوا عرضًا متينًا وأتقنوا تنفيذ الصفقة.",
        tags: ["طلبات العروض", "منظومة TUNEPS", "التنفيذ"],
        interest: "الصفقات العمومية",
      },
      {
        icon: "ShieldCheck",
        title: "الحوكمة والامتثال",
        description: "ضعوا قواعد واضحة واحموا مسيّريكم وتوقّوا مخاطر عدم الامتثال.",
        tags: ["الحوكمة", "المعطيات الشخصية", "مكافحة الفساد"],
        interest: "الحوكمة والامتثال",
        featured: true,
      },
      {
        icon: "Users",
        title: "قانون الشغل",
        description: "العقد والتأديب وإنهاء العلاقة: أمّنوا علاقة الشغل وتوقّوا النزاعات.",
        tags: ["عقد الشغل", "النزاعات"],
        interest: "قانون الشغل",
      },
      {
        icon: "Rocket",
        title: "إحداث المؤسسات",
        description: "اختاروا الشكل القانوني وأتمّوا الإجراءات وانطلقوا على أسس متينة.",
        tags: ["القوانين الأساسية", "الإجراءات"],
        interest: "إحداث المؤسسات",
        badge: "عن بُعد",
      },
      {
        icon: "GraduationCap",
        title: "مناظرة ENA",
        description:
          "المنهجية القانونية واللغة الإنجليزية والقانون الدستوري والقانون الإداري والمالية العمومية والقانون الدولي العام والقانون الجبائي: المواد السبع للمناظرة.",
        tags: ["المنهجية", "القانون العام", "المالية العمومية"],
        interest: "مناظرة ENA",
        badge: "عن بُعد",
      },
      {
        icon: "Laptop",
        title: "إكسل",
        description: "الصيغ والجداول المحورية ولوحات المتابعة: ارفعوا إنتاجيتكم اليومية.",
        tags: ["صيغ", "جداول محورية", "لوحات متابعة"],
        interest: "إكسل",
      },
      {
        icon: "Sparkles",
        title: "الذكاء الاصطناعي",
        description: "تدرّبوا على أدوات الذكاء الاصطناعي لأتمتة مهامكم واتخاذ قرارات أفضل.",
        tags: ["أدوات الذكاء الاصطناعي", "أتمتة", "إنتاجية"],
        interest: "الذكاء الاصطناعي",
      },
      {
        icon: "Users",
        title: "الموارد البشرية",
        description: "الانتقاء والأجور وإدارة شؤون الموظفين وتطوير الكفاءات.",
        tags: ["انتقاء", "أجور", "كفاءات"],
        interest: "الموارد البشرية",
      },
      {
        icon: "Briefcase",
        title: "مستشار جبائي",
        description: "كونوا المرجع في الجباية: استشارة ومطابقة وتحسين.",
        tags: ["استشارة", "مطابقة", "تحسين"],
        interest: "مستشار جبائي",
      },
    ],
  },
  programs: {
    eyebrow: "برامج مميزة",
    titlePre: "اكتشفوا برامجنا",
    titleMark: "المميزة",
    desc: "المحتوى والجمهور المستهدف والصيغة: اكتشفوا تكويناتنا الرائدة واحصلوا على كل المعلومات بنقرة واحدة.",
    tablistLabel: "البرامج المميزة",
    interested: "أنا مهتم(ة)",
    viewFb: "شاهد على فيسبوك",
    newTab: "(علامة تبويب جديدة)",
    inProgram: "في البرنامج",
    items: [
      {
        id: "ena",
        tab: "مناظرة ENA",
        icon: "GraduationCap",
        title: "التحضير لمناظرة المدرسة الوطنية للإدارة — المواد السبع عن بُعد",
        description:
          "تحضير منهجي يغطي المواد السبع للمناظرة: المنهجية القانونية، اللغة الإنجليزية، القانون الدستوري، القانون الإداري، المالية العمومية، القانون الدولي العام والقانون الجبائي.",
        audience: "المترشحون للمناظرة",
        format: "مراجعة عن بُعد",
        modules: [
          "المنهجية القانونية",
          "اللغة الإنجليزية",
          "القانون الدستوري",
          "القانون الإداري",
          "المالية العمومية",
          "القانون الدولي العام",
          "القانون الجبائي",
        ],
        interest: "مناظرة ENA",
      },
      {
        id: "travail",
        tab: "قانون الشغل",
        icon: "Users",
        title: "أتقنوا قانون الشغل وأمّنوا فرقكم بشكل دائم",
        description:
          "من الانتداب إلى إنهاء العقد، تعلموا تأمين كل مراحل علاقة الشغل والوقاية من النزاعات المهنية.",
        audience: "المسيّرون والموارد البشرية والإطارات",
        format: "عن بُعد",
        modules: [
          "عقد الشغل وفترة التجربة",
          "السلطة التأديبية والعقوبات",
          "إنهاء العقد: الإجراءات والمخاطر",
          "الوقاية من النزاعات ومعالجتها",
        ],
        interest: "قانون الشغل",
      },
      {
        id: "creation",
        tab: "إحداث المؤسسات",
        icon: "Rocket",
        title: "نظموا مشروعكم بنجاح: مفاتيح إحداث مؤسستكم",
        description:
          "عندكم فكرة مشروع؟ أسسوه على قواعد قانونية وجبائية متينة من الفكرة إلى الانطلاق.",
        audience: "حاملو المشاريع",
        format: "تكوين مهني عن بُعد",
        modules: [
          "من الفكرة إلى المشروع: التثبت والهيكلة",
          "اختيار الشكل القانوني المناسب",
          "إجراءات الإحداث خطوة بخطوة",
          "أولى الواجبات الجبائية والاجتماعية",
        ],
        interest: "إحداث المؤسسات",
      },
    ],
  },
  benefits: {
    eyebrow: "لماذا نحن",
    titlePre: "تعلّموا القانون",
    titleMark: "لتقرّروا أفضل",
    desc: "تكويناتنا تذهب إلى الأساس: فهم القواعد المطبقة على نشاطكم ومعرفة تطبيقها.",
    imgAlt: "متعلّمة تتابع تكوينًا عن بُعد على حاسوبها",
    overlayTitle: "عملي واستراتيجي",
    overlayDesc: "القانون في خدمة قراراتكم",
    items: [
      {
        icon: "Target",
        title: "العملي أولًا",
        description: "حالات واقعية وأدوات قابلة للتطبيق المباشر في يومكم المهني.",
      },
      {
        icon: "Compass",
        title: "رؤية استراتيجية",
        description: "افهموا القواعد والأهم أن تعرفوا توظيفها لاتخاذ القرار واستباق الأحداث.",
      },
      {
        icon: "Laptop",
        title: "تكوين عن بُعد",
        description: "تكوّنوا أينما كنتم في تونس دون عناء التنقل.",
      },
      {
        icon: "MessageSquare",
        title: "استشارة مخصصة",
        description: "مستشار يوجهكم نحو المسار المناسب لملفكم وأهدافكم.",
      },
    ],
  },
  gallery: {
    eyebrow: "معرض الصور",
    titlePre: "تكويناتنا",
    titleAccent: "بالصور",
    desc: "حصص وورشات وتسليم شهائد: لمحة عن الحياة داخل المركز.",
    empty: "سيتم نشر الصور قريبًا.",
    openLabel: "تكبير الصورة",
    closeLabel: "إغلاق المعرض",
    prevLabel: "الصورة السابقة",
    nextLabel: "الصورة التالية",
    counterLabel: "الصورة {current} من {total}",
    items: [
      {
        src: "/galerie/formation.jpg",
        alt: "حصة تكوين في قاعة درس، مشاركون من الخلف يدونون الملاحظات",
        caption: "حصة تكوين حضوري",
        tag: "تكوين",
      },
      {
        src: "/galerie/atelier.jpg",
        alt: "ورشة قانونية: مشاركان يكتبان ملاحظات على وثائق ويميّزان نصًا بقلم فسفوري",
        caption: "ورشة عمل على الملفات",
        tag: "ورشة",
      },
      {
        src: "/galerie/bibliotheque.jpg",
        alt: "مكتبة قانونية: رفوف كتب القانون ومدونة مفتوحة على طاولة",
        caption: "رصيد وثائقي قانوني",
        tag: "مراجع",
      },
      {
        src: "/galerie/remise.jpg",
        alt: "قاعة مهيأة لتسليم الشهائد مع منصة وصفوف كراسي",
        caption: "تسليم الشهائد",
        tag: "تظاهرة",
      },
    ],
  },
  news: {
    eyebrow: "المستجدات",
    titlePre: "آخر",
    titleAccent: "منشوراتنا",
    desc: "إعلانات التكوينات ونصائح عملية ودورات جديدة: تابعونا على فيسبوك لئلا يفوتكم شيء.",
    followFb: "تابعونا على فيسبوك",
    viewFb: "شاهد على فيسبوك",
    newTab: "(علامة تبويب جديدة)",
    posts: [
      {
        tag: "مناظرة ENA",
        title: "التحضير لمناظرة ENA — مراجعة عن بُعد",
        excerpt:
          "المنهجية القانونية، اللغة الإنجليزية، القانون الدستوري، القانون الإداري، المالية العمومية، القانون الدولي العام، القانون الجبائي: المواد السبع للمناظرة.",
        image: {
          src: "https://images.pexels.com/photos/7972358/pexels-photo-7972358.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
          alt: "تدوين الملاحظات في دفتر أثناء المراجعة على الحاسوب",
        },
      },
      {
        tag: "قانون الشغل",
        title: "أتقنوا قانون الشغل وأمّنوا فرقكم بشكل دائم",
        excerpt: "هل تعلمون أن أغلب النزاعات المهنية…",
        image: {
          src: "https://images.pexels.com/photos/4344878/pexels-photo-4344878.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
          alt: "حوار مهني أثناء مقابلة انتداب في مكتب",
        },
      },
      {
        tag: "تكوين عن بُعد",
        title: "نظموا مشروعكم بنجاح: مفاتيح إحداث مؤسستكم",
        image: {
          src: "https://images.pexels.com/photos/7278886/pexels-photo-7278886.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
          alt: "رائدا أعمال يحضّران استراتيجيتهما التجارية بالحاسوب والملاحظات",
        },
      },
    ],
  },
  pricing: {
    eyebrow: "الصيغ",
    titlePre: "صيغة",
    titleMark: "لكل حاجة",
    desc: "تتوقف الأسعار على البرنامج والصيغة وعدد المشاركين. اطلبوا عرض سعر وسنرد عليكم باقتراح مناسب.",
    featuredBadge: "مميز",
    footnote: "أفراد ومؤسسات وإدارات: كل عرض يُعدّ حسب أهدافكم.",
    offers: [
      {
        icon: "Briefcase",
        name: "تكوين فردي",
        tagline: "لتطوير مهاراتكم في مجال محدد.",
        price: "حسب الطلب",
        priceNote: "حسب البرنامج المختار",
        features: [
          "تكوين عن بُعد",
          "المجال حسب الاختيار: أعمال وجباية وشغل…",
          "دعائم التكوين",
          "توجيه من مستشار",
        ],
        cta: "اطلب عرض سعر",
        interest: "تكوين فردي",
      },
      {
        icon: "GraduationCap",
        name: "التحضير لمناظرة ENA",
        tagline: "المواد السبع للمناظرة بمنهجية وتدريب.",
        price: "حسب الطلب",
        priceNote: "مراجعة عن بُعد",
        features: [
          "المواد السبع للمناظرة",
          "المنهجية القانونية واللغة الإنجليزية",
          "القانون العام والمالية العمومية والقانون الجبائي",
          "التدرب على المواضيع والتحضير للشفوي",
        ],
        cta: "اطلب التفاصيل",
        interest: "مناظرة ENA",
        highlighted: true,
      },
      {
        icon: "Building",
        name: "المؤسسات والإدارات",
        tagline: "برنامج مصمم حسب رهانات فرقكم.",
        price: "حسب الحاجة",
        priceNote: "حسب حاجياتكم وعدد المشاركين",
        features: [
          "تحليل حاجياتكم",
          "برنامج مكيف مع قطاعكم",
          "تكوين فرقكم",
          "مخاطب مخصص",
        ],
        cta: "استشيرونا",
        interest: "مؤسسة / إدارة",
      },
    ],
  },
  faq: {
    eyebrow: "أسئلة شائعة",
    titlePre: "أسئلتكم،",
    titleAccent: "أجوبتنا",
    desc: "لم تجدوا جوابكم؟ راسلونا وسيجيبكم مستشار.",
    cta: "اطرحوا سؤالًا",
    items: [
      {
        question: "هل تُجرى التكوينات عن بُعد؟",
        answer:
          "نعم. يتوفر التحضير لمناظرة ENA وتكويناتنا المهنية عن بُعد. اتصلوا بنا لمعرفة التفاصيل ومواعيد كل دورة.",
      },
      {
        question: "ما هي المواد التي يغطيها التحضير لمناظرة ENA؟",
        answer:
          "يغطي التحضير المواد السبع للمناظرة: المنهجية القانونية، اللغة الإنجليزية، القانون الدستوري، القانون الإداري، المالية العمومية، القانون الدولي العام والقانون الجبائي.",
      },
      {
        question: "أين يوجد مركز Forma Business Lex؟",
        answer: "يوجد مركز التكوين في تونس (2066) بتونس.",
      },
      {
        question: "لمن تتوجه تكويناتكم؟",
        answer:
          "إلى المسيّرين والقانونيين ومسؤولي الموارد البشرية والمالية والمشتريات العمومية ورواد الأعمال والمترشحين للمناظرات الإدارية مثل ENA.",
      },
      {
        question: "هل يلزم تكوين قانوني مسبق؟",
        answer:
          "لا بالنسبة لتكوينات التأسيس. يساعدكم مستشار على اختيار المسار المناسب لمستواكم وأهدافكم.",
      },
      {
        question: "هل تقدمون تكوينات للمؤسسات؟",
        answer:
          "اتصلوا بنا لدراسة برنامج مكيف مع حاجيات فرقكم: المجالات والصيغة وعدد المشاركين.",
      },
      {
        question: "كيف أسجل وأعرف الأسعار؟",
        answer:
          "املؤوا استمارة الاتصال أو راسلونا على فيسبوك. يمدّكم مستشار بالأسعار والمواعيد وطرق التسجيل.",
      },
    ],
  },
  contactUi: {
    eyebrow: "اتصال",
    titlePre: "لنتحدث عن",
    titleAccent: "مشروعكم التكويني",
    desc: "أخبرونا بما تريدون تعلمه. سيتصل بكم مستشار لتوجيهكم نحو المسار المناسب وإعلامكم بالأسعار والمواعيد القادمة.",
    fbLabel: "Forma Business Lex على فيسبوك",
    waLabel: "راسلونا على واتساب",
    address: "تونس 2066، تونس",
    reassurances: ["دون التزام", "استشارة مخصصة", "رد عبر البريد أو الهاتف"],
    formTitle: "طلب معلومات",
    requiredNote: "الحقول المعلّمة بـ",
    requiredMark: "* إجبارية.",
    nameLabel: "الاسم واللقب",
    namePlaceholder: "مثال: أحمد بن صالح",
    phoneLabel: "الهاتف / واتساب",
    emailLabel: "البريد الإلكتروني",
    subjectLabel: "الموضوع",
    chooseSubject: "اختاروا موضوعًا…",
    messageLabel: "الرسالة",
    optional: "(اختياري)",
    messagePlaceholder: "حددوا حاجتكم: المستوى وعدد المشاركين والأوقات…",
    consent: "أوافق على أن يعاود Forma Business Lex الاتصال بي بخصوص طلبي.",
    errors: {
      name: "اذكروا الاسم واللقب.",
      email: "أدخلوا بريدًا إلكترونيًا صحيحًا.",
      phone: "رقم الهاتف غير صحيح.",
      interest: "اختاروا الموضوع الذي يهمكم.",
      consent: "يرجى الموافقة على معاودة الاتصال بكم.",
    },
    sendErrorPre: "فشل الإرسال. حاولوا مجددًا أو راسلونا مباشرة على",
    submit: "أرسلوا طلبكم",
    submitting: "جارٍ الإرسال…",
    successSent: "شكرًا، تم إرسال الطلب!",
    successMailto: "بقيت خطوة واحدة",
    sentDesc: "سيتصل بكم مستشار Forma Business Lex قريبًا جدًا.",
    mailtoPre: "فُتحت مراسلتكم مع طلبكم جاهزًا: يكفي إرسالها. إذا لم تُفتح، راسلونا على",
    mailtoMid: "",
    another: "إرسال طلب آخر",
  },
  interests: [
    "مناظرة ENA",
    "قانون الأعمال",
    "الجباية",
    "الصفقات العمومية",
    "الحوكمة والامتثال",
    "قانون الشغل",
    "إحداث المؤسسات",
    "تكوين فردي",
    "مؤسسة / إدارة",
    "طلب آخر",
  ],
  footer: {
    desc: "تكوينات عملية واستراتيجية في قانون الأعمال والجباية والصفقات العمومية والحوكمة والامتثال.",
    colFormations: "التكوينات",
    colNav: "التنقل",
    colContact: "اتصال",
    contactLink: "اتصال",
    formationsAria: "التكوينات",
    navAria: "روابط الموقع",
    fbAria: "Forma Business Lex على فيسبوك (علامة تبويب جديدة)",
    copyright: "© {year} Forma Business Lex · تونس، تونس",
    backTop: "العودة إلى الأعلى",
  },
  mobileCta: { text: "سؤال حول تكويناتنا؟", cta: "اتصال" },
};

export const content: Record<Lang, SiteContent> = { fr, ar };
