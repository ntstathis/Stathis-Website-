// Navigation, footer and GR↔EN pairing data for the whole site.
// URLs are frozen — they mirror the old WordPress site verbatim.
// (The old EN mega-menu had three dead links redirecting to /en/home/;
// they are pointed at the real pages here: truck-refrigerators, tail-lifts,
// temperature-recorders. The old EN "Configurator" service card linked the
// Greek /diamorfwtis/; it now links /en/configurator/.)

export type Lang = 'el' | 'en';

export interface NavItem {
  href: string;
  label: string;
  /** opens a mega-menu panel instead of navigating */
  mega?: 'products' | 'services';
}

export interface MegaItem {
  href: string;
  label: string;
  /** key into the site mega images in src/assets/img/site/mega/ */
  img: string;
}

export const mainNav: Record<Lang, NavItem[]> = {
  el: [
    { href: '/', label: 'Αρχική' },
    { href: '/etaireia/', label: 'Η Εταιρεία' },
    { href: '#', label: 'Προϊόντα', mega: 'products' },
    { href: '#', label: 'Υπηρεσίες', mega: 'services' },
    { href: '/news/', label: 'Τα Νέα μας' },
    { href: '/diamorfwtis/', label: 'Διαμορφωτής' },
  ],
  en: [
    { href: '/en/home/', label: 'Home' },
    { href: '/en/about-us/', label: 'About' },
    { href: '#', label: 'Products', mega: 'products' },
    { href: '#', label: 'Services', mega: 'services' },
    { href: '/en/configurator/', label: 'Configurator' },
    { href: '/en/our-news/', label: 'Our news' },
  ],
};

export const megaProducts: Record<Lang, MegaItem[]> = {
  el: [
    { href: '/proionta/kit-monwsis/', label: 'Κιτ Μόνωσης', img: 'kit-monwsis' },
    { href: '/proionta/monwseis-autokinitwn-van/', label: 'Μονώσεις Αυτοκινήτων Van', img: 'monwseis-van' },
    { href: '/proionta/psuktika-mixanimata/', label: 'Ψυκτικά Μηχανήματα', img: 'psuktika-mixanimata' },
    { href: '/proionta/psuktikoi-thalamoi-autokinitwn/', label: 'Ψυκτικοί Θάλαμοι Φορτηγών', img: 'psuktikoi-thalamoi' },
    { href: '/proionta/kivwtamakses/', label: 'Κιβωτάμαξες (Κόφες)', img: 'kivwtamakses' },
    { href: '/proionta/thalamoi-vatheias-katapsuksis/', label: 'Θάλαμοι Βαθιάς Κατάψυξης (Τσέλες)', img: 'thalamoi-vatheias' },
    { href: '/proionta/eksoplismos-autokinitwn-sortimo/', label: 'Εξοπλισμός Αυτοκινήτων Sortimo', img: 'sortimo' },
    { href: '/proionta/ydraulikes-portes/', label: 'Υδραυλικές Πόρτες', img: 'ydraulikes-portes' },
    { href: '/roadranger/', label: 'Road Ranger', img: 'road-ranger' },
    { href: '/proionta/katagrafika-thermokrasias-euroscan/', label: 'Καταγραφικά Θερμοκρασίας Euroscan', img: 'katagrafika-euroscan' },
    { href: '/proionta/kleidaries-gatelock/', label: 'Κλειδαριές Gatelock', img: 'kleidaries-gatelock' },
    { href: '/proionta/anoxeidoti-schara-orofis/', label: 'Ανοξείδωτη Σχάρα Οροφής', img: 'schara-orofis' },
    { href: '/proionta/karotses-alouminiou-scattolini/', label: 'Καρότσες αλουμινίου', img: 'karotses-alouminiou' },
    { href: '/psyktika-docheia-melform/', label: 'Ψυκτικά δοχεία', img: 'psyktika-docheia' },
  ],
  en: [
    { href: '/en/insulation-kit/', label: 'Insulation Kit', img: 'kit-monwsis' },
    { href: '/en/van-insulation/', label: 'Van Insulation', img: 'monwseis-van' },
    { href: '/en/refrigerated-units/', label: 'Refrigerated Units', img: 'psuktika-mixanimata' },
    { href: '/en/truck-refrigerators/', label: 'Refrigerated Truck Compartments', img: 'psuktikoi-thalamoi' },
    { href: '/en/isothermalbox/', label: 'Isothermal Box', img: 'kivwtamakses' },
    { href: '/en/deep-freeze-body/', label: 'Deep Freeze Body', img: 'thalamoi-vatheias' },
    { href: '/en/sortimo-car-equipment/', label: 'Sortimo Car Equipment', img: 'sortimo' },
    { href: '/en/tail-lifts/', label: 'Hydraulic Doors', img: 'ydraulikes-portes' },
    { href: '/en/road-ranger/', label: 'Road Ranger', img: 'road-ranger' },
    { href: '/en/temperature-recorders/', label: 'Euroscan Temperature Recorders', img: 'katagrafika-euroscan' },
    { href: '/en/gatelock-locks/', label: 'Gatelock Locks', img: 'kleidaries-gatelock' },
    { href: '/en/stainless-steel-roof-rack/', label: 'Roof Rack', img: 'schara-orofis' },
    { href: '/en/scattolini-aluminum-truck-bodies/', label: 'Aluminum Truck Bodies', img: 'karotses-alouminiou' },
    { href: '/en/refrigerated-containers-melform/', label: 'Refrigerated containers', img: 'psyktika-docheia' },
  ],
};

export const megaServices: Record<Lang, MegaItem[]> = {
  el: [
    { href: '/van-rent/', label: 'Ενοικιάσεις Van', img: 'van-rent' },
    { href: '/diamorfwtis/', label: 'Διαμορφωτής', img: 'mega-configurator' },
    { href: '/after-sales-service/', label: 'After Sales Service', img: 'mega-after-sales' },
  ],
  en: [
    { href: '/en/van-rent/', label: 'Van Rental', img: 'van-rent-en' },
    { href: '/en/configurator/', label: 'Configurator', img: 'mega-configurator' },
    { href: '/en/after-sales-service-en/', label: 'After Sales Service', img: 'mega-after-sales' },
  ],
};

export const ui: Record<Lang, { contact: string; contactHref: string; seeMore: string; seeAlso: string }> = {
  el: { contact: 'Επικοινωνία', contactHref: '/epikoinwnia/', seeMore: 'Δείτε περισσότερα', seeAlso: 'Δείτε ακόμα' },
  en: { contact: 'Contact', contactHref: '/en/contact/', seeMore: 'See more', seeAlso: 'See also' },
};

export const footerData: Record<
  Lang,
  { blurb: string; companyTitle: string; companyLinks: { href: string; label: string }[]; hqTitle: string; branchTitle: string }
> = {
  el: {
    blurb:
      'Από το 1961 μέχρι και σήμερα η «Stathis» αποτελεί την κορυφαία εταιρεία στο χώρο της αμαξοποίησης και της ψύξης μεταφορών στην Ελλάδα.',
    companyTitle: 'Η Εταιρεία μας',
    companyLinks: [
      { href: '/', label: 'Αρχική' },
      { href: '/diamorfwtis/', label: 'Διαμορφωτής' },
      { href: '/etaireia/', label: 'Σχετικά με εμάς' },
      { href: '/prosopika-dedomena-kai-cookies/', label: 'Προσωπικά Δεδομένα και Cookies' },
    ],
    hqTitle: 'Κεντρικά / Εργοστάσιο Θεσσαλονίκη',
    branchTitle: 'Υποκατάστημα Αθήνα',
  },
  en: {
    blurb:
      'From 1961 until today, "Stathis" has been the leading company in vehicle bodywork and transport refrigeration in Greece.',
    companyTitle: 'Our Company',
    companyLinks: [
      { href: '/en/home/', label: 'Home' },
      { href: '/en/configurator/', label: 'Configurator' },
      { href: '/en/about-us/', label: 'About us' },
      { href: '/en/prosopika-dedomena-kai-cookies-en/', label: 'Personal Data and Cookies' },
    ],
    hqTitle: 'Headquarters / Factory Thessaloniki',
    branchTitle: 'Athens Branch',
  },
};

export const contacts = {
  thessaloniki: [
    { label: 'ΒI.ΠE. Σίνδου, Είσοδος B’, Θεσσαλονίκη', href: null },
    { label: 'Τ.Θ.: 1134, T.K.: 57022', href: null },
    { label: 'Γ.Ε.ΜΗ. No: 38336905000', href: null },
    { label: 'Τηλ: 2310 798 300', href: 'tel:2310798300' },
    { label: 'contact@stathis.com.gr', href: 'mailto:contact@stathis.com.gr' },
  ],
  thessalonikiEn: [
    { label: 'Sindos Industrial Area, Entrance B, Thessaloniki', href: null },
    { label: 'P.O. Box: 1134, P.C.: 57022', href: null },
    { label: 'G.E.MI. No: 38336905000', href: null },
    { label: 'Tel: +30 2310 798 300', href: 'tel:+302310798300' },
    { label: 'contact@stathis.com.gr', href: 'mailto:contact@stathis.com.gr' },
  ],
  athens: [
    { label: 'Ανδρέα Μεταξά 11Α, 14564 Κηφισιά Αθήνα', href: null },
    { label: 'Τηλ: 210 55 84 160', href: 'tel:2105584160' },
    { label: 'athens@stathis.com.gr', href: 'mailto:athens@stathis.com.gr' },
  ],
  athensEn: [
    { label: 'Andrea Metaxa 11A, 14564 Kifisia, Athens', href: null },
    { label: 'Tel: +30 210 55 84 160', href: 'tel:+302105584160' },
    { label: 'athens@stathis.com.gr', href: 'mailto:athens@stathis.com.gr' },
  ],
  social: {
    linkedin: 'https://www.linkedin.com/company/stathis/',
    facebook: 'https://www.facebook.com/stathisrefrigeration/',
  },
};

/**
 * GR↔EN pairs for the bespoke (non-collection) pages, keyed by the GR path
 * (no slashes). null = page exists only in Greek; its switcher falls back to
 * /en/home/ (matching the old Polylang behavior).
 * Collection entries pair via frontmatter translationKey instead.
 */
export const routePairs: Record<string, string | null> = {
  '': 'en/home',
  epikoinwnia: 'en/contact',
  etaireia: 'en/about-us',
  pelates: 'en/customers',
  news: 'en/our-news',
  diamorfwtis: 'en/configurator',
  proionta: null,
  efcharistoume: 'en/thank-you',
};

/** twin path for a bespoke page, from either side; undefined = no twin */
export function bespokeTwin(path: string): string | null {
  const p = path.replace(/^\/|\/$/g, '');
  if (p in routePairs) return routePairs[p];
  for (const [el, en] of Object.entries(routePairs)) {
    if (en === p) return el;
  }
  return null;
}

export const langHome: Record<Lang, string> = { el: '/', en: '/en/home/' };

/** normalize a stored path ('', 'en/home', 'proionta/kit-monwsis') to a URL with trailing slash */
export const toUrl = (path: string | null): string | null =>
  path == null ? null : path === '' ? '/' : `/${path.replace(/^\/|\/$/g, '')}/`;
