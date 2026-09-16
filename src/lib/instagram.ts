import { INSTAGRAM_URL } from './config';

/**
 * Publications Instagram affichées sur le site.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ÉTAT ACTUEL : contenu choisi à la main, pas de connexion à Instagram.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Pourquoi pas de flux en direct dès maintenant :
 *
 * 1. L'API « Basic Display », celle qui permettait de lire un compte personnel
 *    avec un simple jeton, a été arrêtée par Meta le 4 décembre 2024. Elle n'a
 *    pas de remplaçante équivalente.
 * 2. Ce qui la remplace — « Instagram API with Instagram Login », côté Graph
 *    API — exige un compte professionnel (créateur ou entreprise), une
 *    application déclarée chez Meta, et un jeton d'accès à renouveler tous les
 *    soixante jours.
 * 3. Ce jeton ne peut pas vivre dans le site : celui-ci est exporté en fichiers
 *    statiques, donc tout ce qu'il contient est lisible par n'importe quel
 *    visiteur. Il faut un morceau de serveur — le même que celui qui portera
 *    la base de données et les paiements.
 * 4. Les adresses d'images renvoyées par l'API (`media_url`) expirent au bout
 *    de quelques jours. On ne peut pas se contenter de les stocker : il faut
 *    recopier les images chez soi à chaque rafraîchissement.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POUR BRANCHER LE VRAI FLUX PLUS TARD
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Rien à changer dans les composants : ils lisent `getInstagramPosts()` et
 * rien d'autre. Il suffira de remplacer le corps de cette fonction par une
 * lecture du fichier que produira la tâche planifiée côté serveur, par exemple
 * `/data/instagram.json`, régénéré une fois par jour par un script appelant :
 *
 *   GET https://graph.instagram.com/me/media
 *       ?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp
 *       &access_token=…
 *
 * Ce script télécharge chaque image, l'enregistre à côté des autres médias du
 * site, et n'écrit dans le JSON que des chemins locaux. Le site, lui, reste
 * statique et ne dépend d'aucun service tiers au moment de l'affichage.
 *
 * Une variante sans serveur existe : les widgets tiers (LightWidget, Behold,
 * Elfsight…). Ils sont payants au-delà d'un quota, ralentissent la page, et
 * surtout ils déposent des traceurs : il faudrait alors les soumettre au
 * bandeau de consentement et le site perdrait son absence totale de cookies
 * tiers. C'est la raison pour laquelle ils ne sont pas retenus ici.
 */
export type InstagramPost = {
  /** Identifiant stable, sert de clé de rendu. */
  id: string;
  /** Chemin de l'image, relatif à la racine publique. */
  image: string;
  /** Texte de remplacement — décrit l'image, pas la publication. */
  alt: string;
  /** Légende courte affichée au survol. */
  caption: string;
  /**
   * Adresse de la publication sur Instagram.
   * Tant que le flux n'est pas branché, toutes pointent vers le profil.
   */
  permalink: string;
};

/**
 * Publications mises en avant.
 *
 * ⚠️ CONTENU DE DÉMONSTRATION — les images sont celles du studio et les
 * légendes ont été écrites pour la maquette. Elles ne reprennent aucune
 * publication réelle du compte. À remplacer par de vraies publications avant
 * la mise en ligne, ou à vider (voir `getInstagramPosts` ci-dessous).
 */
const CURATED: readonly InstagramPost[] = [
  {
    id: 'demo-1',
    image: '/media/melvin-coaching.webp',
    alt: 'Séance de coaching en cours dans le studio',
    caption: 'Une séance, trois personnes maximum.',
    permalink: INSTAGRAM_URL,
  },
  {
    id: 'demo-2',
    image: '/media/studio-espace-coaching.webp',
    alt: 'L’espace de coaching du studio',
    caption: 'L’espace de travail, un mardi matin.',
    permalink: INSTAGRAM_URL,
  },
  {
    id: 'demo-3',
    image: '/media/studio-materiel.webp',
    alt: 'Matériel de renforcement rangé le long du mur',
    caption: 'Le matériel. Rien d’inutile.',
    permalink: INSTAGRAM_URL,
  },
  {
    id: 'demo-4',
    image: '/media/studio-accueil.webp',
    alt: 'L’accueil et la salle d’attente du studio',
    caption: 'On commence toujours par un café.',
    permalink: INSTAGRAM_URL,
  },
] as const;

/**
 * Publications à afficher.
 *
 * Renvoyer un tableau vide est un cas prévu et testé : la section « Communauté »
 * s'affiche alors sans la grille, sans casser la mise en page. C'est le
 * repli à utiliser si l'on préfère ne rien montrer plutôt que de montrer des
 * images de démonstration.
 */
export function getInstagramPosts(): readonly InstagramPost[] {
  return CURATED;
}
