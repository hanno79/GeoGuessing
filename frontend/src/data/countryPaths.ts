const COUNTRY_PATHS: Record<string, string> = {
  // Japan - archipelago shape, main islands
  jp: "M70,20 L75,25 L78,35 L75,45 L70,55 L65,65 L60,75 L55,80 L50,78 L52,70 L55,60 L58,50 L55,40 L58,30 L65,22 Z M45,75 L50,72 L55,78 L50,82 L45,80 Z M60,15 L68,18 L72,15 L68,12 Z",

  // France - hexagonal shape
  fr: "M35,15 L55,10 L70,20 L75,40 L70,60 L65,75 L50,80 L35,75 L25,60 L20,40 L25,25 Z",

  // United States (contiguous) - wide rectangle with jagged coasts
  us: "M5,30 L15,25 L25,20 L35,22 L45,20 L55,18 L65,20 L75,22 L85,25 L90,30 L92,40 L88,50 L90,55 L85,60 L75,65 L65,68 L55,70 L45,68 L35,65 L25,60 L15,55 L10,50 L8,45 L5,35 Z",

  // United Kingdom - distinctive elongated shape with Scotland
  gb: "M45,10 L55,8 L58,15 L55,25 L60,30 L55,35 L58,45 L55,55 L52,65 L48,75 L42,80 L38,75 L40,65 L42,55 L38,50 L40,40 L35,30 L38,20 L42,15 Z M35,15 L40,10 L45,12 L42,18 L37,20 Z",

  // Australia - wide continent shape
  au: "M15,30 L30,20 L50,15 L70,18 L85,25 L90,35 L88,50 L85,60 L75,70 L60,75 L45,72 L30,65 L20,55 L12,45 L10,35 Z M70,70 L78,68 L80,75 L75,80 L68,78 Z",

  // Egypt - roughly rectangular with Sinai
  eg: "M20,20 L70,20 L70,50 L80,50 L85,45 L88,50 L80,55 L70,55 L70,80 L20,80 Z",

  // Russia - massive wide shape
  ru: "M5,35 L15,25 L30,20 L45,15 L60,12 L75,15 L85,20 L95,25 L98,35 L95,45 L90,50 L80,52 L70,55 L60,58 L50,55 L40,58 L30,55 L20,50 L10,45 L5,40 Z",

  // China - distinctive shape with western bump
  cn: "M20,25 L30,15 L45,12 L60,15 L75,20 L85,30 L88,45 L82,55 L75,65 L65,72 L50,75 L40,70 L30,65 L20,60 L15,50 L10,40 L15,30 Z",

  // Brazil - large with eastern bulge
  br: "M35,10 L50,8 L65,12 L75,20 L80,35 L78,50 L72,65 L60,78 L48,85 L35,80 L25,70 L20,55 L22,40 L28,25 Z",

  // Italy - boot shape
  it: "M35,10 L50,8 L55,15 L52,25 L55,35 L58,45 L62,55 L60,65 L55,72 L48,68 L52,60 L48,50 L42,45 L38,35 L35,25 L32,18 Z M45,78 L55,75 L60,80 L55,88 L45,90 L40,85 Z M52,72 L58,70 L62,75 L58,80 L52,78 Z",

  // Germany - roughly vertical shape
  de: "M30,15 L50,10 L65,15 L70,25 L72,40 L68,55 L60,65 L50,70 L40,68 L30,60 L25,45 L28,30 Z",

  // India - triangle/peninsula shape
  in: "M25,15 L50,10 L75,15 L80,30 L75,45 L70,55 L60,70 L50,82 L40,70 L30,55 L25,45 L20,30 Z",

  // Turkey - wide with distinctive shape
  tr: "M5,35 L20,25 L40,20 L60,22 L75,28 L85,35 L90,40 L85,50 L75,55 L60,58 L40,55 L20,50 L10,45 L5,40 Z",

  // Thailand - elephant head shape with trunk going south
  th: "M30,15 L50,10 L65,20 L68,35 L60,45 L55,55 L50,65 L45,75 L40,85 L35,80 L38,70 L42,60 L40,50 L35,40 L25,30 Z",

  // Mexico - angular shape with Baja peninsula
  mx: "M10,20 L15,15 L25,12 L40,15 L55,20 L65,30 L70,40 L75,55 L70,65 L60,70 L50,68 L40,60 L30,55 L20,50 L12,40 L8,30 Z M8,25 L12,20 L10,35 L6,45 L3,40 L5,30 Z",

  // Argentina - long narrow southern cone shape
  ar: "M30,5 L50,8 L60,15 L65,25 L60,40 L55,55 L50,65 L45,75 L40,85 L35,92 L30,85 L32,75 L35,65 L38,55 L35,45 L30,35 L25,20 L28,10 Z",

  // United Arab Emirates - small angular shape
  ae: "M15,30 L40,20 L70,25 L85,35 L80,50 L65,60 L45,65 L25,55 L15,40 Z",

  // Singapore - small island
  sg: "M25,35 L45,25 L65,30 L75,45 L65,60 L45,65 L30,55 L22,45 Z",

  // South Korea - peninsula shape
  kr: "M35,15 L55,10 L65,20 L68,35 L65,50 L58,65 L48,75 L38,70 L32,55 L30,40 L32,25 Z",

  // South Africa - wide southern shape
  za: "M20,20 L50,15 L80,20 L85,35 L80,55 L70,70 L55,78 L40,78 L25,70 L18,55 L15,35 Z M45,55 L55,55 L55,65 L45,65 Z",

  // Spain - wide Iberian shape
  es: "M15,25 L35,15 L60,12 L80,18 L85,30 L82,45 L75,60 L60,68 L40,70 L25,62 L15,50 L12,35 Z",

  // Portugal - narrow vertical strip
  pt: "M35,10 L50,10 L55,20 L55,35 L52,50 L50,65 L48,80 L40,85 L35,75 L33,60 L32,45 L33,30 L34,20 Z",

  // Greece - irregular with peninsulas
  gr: "M25,20 L45,15 L60,20 L65,30 L60,40 L55,50 L60,55 L55,65 L45,70 L35,72 L30,65 L35,55 L30,45 L25,35 Z M50,75 L60,72 L65,80 L55,85 L48,80 Z",

  // Austria - horizontal elongated shape
  at: "M10,35 L25,25 L45,20 L65,22 L80,30 L90,40 L85,55 L70,60 L50,62 L30,58 L15,50 L8,42 Z",

  // Netherlands - small compact
  nl: "M30,15 L55,10 L65,20 L68,35 L65,50 L60,65 L50,72 L38,68 L28,55 L25,40 L27,25 Z",

  // Kenya - roughly rectangular
  ke: "M25,15 L55,10 L75,20 L80,40 L75,60 L65,75 L45,80 L30,70 L20,55 L18,35 Z",

  // Canada - massive wide shape
  ca: "M5,40 L15,30 L30,22 L45,18 L60,15 L75,18 L85,22 L95,30 L98,40 L95,50 L85,55 L75,58 L60,55 L50,58 L40,55 L30,52 L20,50 L10,48 L5,45 Z",

  // Peru - roughly square with coastal indent
  pe: "M20,15 L45,10 L60,15 L70,25 L75,40 L72,55 L65,70 L50,80 L35,78 L22,65 L18,50 L15,35 L18,22 Z",

  // Sweden - long vertical shape
  se: "M35,5 L50,8 L58,15 L55,30 L52,45 L50,55 L48,65 L52,75 L48,85 L40,90 L35,80 L38,70 L35,60 L38,50 L40,40 L38,30 L35,20 L33,10 Z",

  // Czech Republic - horizontal diamond-ish
  cz: "M15,40 L30,25 L50,18 L70,25 L85,40 L70,55 L50,62 L30,55 L15,45 Z",

  // Poland - roughly square
  pl: "M20,20 L45,12 L70,15 L80,25 L82,45 L78,60 L65,72 L45,75 L25,68 L18,55 L15,40 L17,28 Z",

  // Ireland - roughly oval
  ie: "M30,20 L50,12 L65,22 L70,40 L65,58 L55,72 L40,78 L30,68 L25,52 L25,35 Z",

  // Cuba - long narrow island
  cu: "M5,40 L15,30 L30,25 L50,22 L70,25 L85,32 L95,40 L85,50 L70,55 L50,55 L30,52 L15,48 L5,45 Z",

  // Indonesia - archipelago chain
  id: "M5,40 L15,32 L30,28 L40,35 L50,30 L60,35 L70,30 L80,35 L90,32 L95,40 L90,48 L80,45 L70,48 L60,45 L50,48 L40,45 L30,50 L15,48 L5,45 Z",

  // Colombia - roughly triangular
  co: "M25,15 L50,10 L70,18 L78,35 L75,50 L65,65 L50,72 L35,70 L22,58 L18,42 L20,28 Z",

  // Vietnam - S-shaped elongated
  vn: "M40,5 L55,8 L65,15 L60,25 L55,35 L50,42 L55,52 L60,62 L58,72 L52,82 L45,90 L38,85 L42,75 L45,65 L40,55 L35,48 L40,38 L45,28 L42,18 L38,10 Z",

  // Finland - vertical with bumps
  fi: "M35,5 L50,8 L58,18 L55,30 L58,42 L55,55 L52,65 L48,75 L42,85 L35,80 L30,70 L32,58 L35,48 L32,38 L30,28 L32,18 L33,10 Z",

  // Denmark - Jutland peninsula
  dk: "M35,15 L50,10 L58,18 L55,30 L60,40 L55,52 L48,60 L40,55 L35,45 L30,35 L32,25 Z M60,45 L68,40 L72,50 L65,55 Z",

  // Belgium - small compact
  be: "M20,30 L40,18 L65,22 L80,35 L75,55 L60,65 L40,68 L25,58 L18,42 Z",

  // Iraq - roughly rectangular
  iq: "M20,20 L50,12 L75,18 L82,30 L80,50 L72,65 L55,72 L35,70 L22,58 L18,40 Z",

  // Chile - extremely long narrow shape
  cl: "M35,2 L50,5 L55,12 L52,22 L50,32 L48,42 L46,52 L44,62 L42,72 L40,82 L38,92 L32,95 L30,88 L32,78 L34,68 L36,58 L38,48 L40,38 L42,28 L40,18 L38,8 Z",

  // Iran - roughly diamond with edges
  ir: "M20,30 L35,15 L55,10 L75,15 L85,30 L88,48 L80,60 L65,70 L45,72 L28,65 L18,50 L15,38 Z",

  // Ethiopia - roughly triangular
  et: "M15,25 L40,12 L65,15 L80,25 L85,42 L75,58 L60,68 L40,72 L25,62 L15,48 Z",

  // Nigeria - roughly square
  ng: "M15,20 L45,12 L72,18 L80,30 L78,50 L70,65 L50,72 L30,68 L18,55 L12,38 Z",

  // Malaysia - two parts
  my: "M5,35 L20,25 L40,22 L55,30 L50,42 L35,48 L20,45 L8,42 Z M60,30 L75,22 L90,28 L95,42 L88,55 L72,58 L60,48 L58,38 Z",

  // Morocco - roughly rectangular
  ma: "M15,20 L45,12 L70,18 L80,30 L78,50 L68,65 L48,72 L28,68 L18,55 L12,38 Z",

  // Switzerland - small compact
  ch: "M15,35 L35,22 L60,20 L80,30 L85,48 L72,60 L50,65 L30,60 L18,48 Z",

  // Norway - long vertical with fjords
  no: "M40,5 L55,8 L60,18 L55,28 L50,38 L48,48 L52,58 L48,68 L42,78 L38,88 L32,82 L35,72 L38,62 L35,52 L38,42 L42,32 L40,22 L38,12 Z",

  // Venezuela - wide northern shape
  ve: "M15,25 L35,15 L60,12 L80,18 L85,32 L78,48 L65,58 L45,62 L28,55 L18,42 Z",

  // Lebanon - tiny vertical
  lb: "M30,15 L55,10 L65,25 L60,45 L55,65 L48,80 L38,78 L35,60 L32,42 L30,28 Z",

  // Sri Lanka - teardrop island
  lk: "M35,15 L55,10 L68,25 L72,45 L65,65 L50,80 L38,75 L30,58 L28,40 L30,25 Z",

  // Ghana - roughly rectangular
  gh: "M25,15 L55,10 L70,22 L75,40 L72,58 L62,72 L42,78 L28,68 L20,52 L18,35 Z",

  // Tanzania - roughly square
  tz: "M20,18 L50,12 L75,18 L82,35 L78,55 L68,70 L48,78 L28,72 L18,55 L15,38 Z",

  // Pakistan - roughly diamond
  pk: "M20,30 L35,15 L55,10 L75,18 L85,35 L80,52 L68,65 L48,72 L30,65 L18,48 Z",

  // Ecuador - small roughly square
  ec: "M18,22 L42,12 L68,18 L80,35 L75,55 L60,68 L38,72 L22,60 L15,42 Z",

  // Uruguay - small rounded shape
  uy: "M22,18 L48,10 L72,18 L80,38 L72,58 L55,72 L35,72 L22,58 L18,38 Z",

  // Iceland - distinctive island shape
  is: "M10,35 L25,22 L45,15 L65,18 L80,25 L90,38 L85,52 L70,60 L50,62 L30,58 L15,50 L8,42 Z",

  // Romania - roughly horizontal oval
  ro: "M15,30 L35,18 L58,15 L78,22 L88,38 L82,55 L65,65 L42,68 L22,60 L12,45 Z",

  // Hungary - horizontal oval
  hu: "M10,35 L28,22 L52,18 L75,25 L90,38 L82,55 L62,62 L38,60 L18,52 L8,42 Z",

  // Bulgaria - roughly rectangular
  bg: "M12,30 L35,18 L62,15 L82,25 L88,42 L80,58 L58,65 L35,62 L18,52 L10,40 Z",

  // Estonia - small horizontal
  ee: "M10,30 L30,18 L58,15 L80,22 L90,38 L82,52 L60,60 L35,58 L15,48 L8,38 Z",

  // Latvia - small horizontal
  lv: "M10,32 L32,18 L60,15 L82,25 L88,40 L80,55 L58,62 L32,58 L15,48 L8,38 Z",

  // Slovakia - horizontal elongated
  sk: "M5,38 L22,25 L45,18 L68,20 L88,30 L95,42 L85,55 L62,60 L38,58 L18,50 L8,42 Z",

  // Croatia - distinctive C/boomerang shape
  hr: "M20,15 L40,10 L55,18 L52,30 L48,42 L55,50 L65,58 L75,65 L80,75 L72,80 L60,72 L48,65 L38,55 L30,45 L25,35 L22,25 Z",

  // Qatar - small peninsula
  qa: "M30,15 L55,10 L68,22 L72,42 L68,62 L58,78 L42,80 L32,65 L28,45 L28,28 Z",

  // Oman - southeastern Arabian
  om: "M20,20 L45,10 L70,15 L82,30 L85,50 L78,65 L60,75 L40,72 L25,60 L18,42 Z",

  // Cambodia - roughly square
  kh: "M18,22 L45,12 L72,18 L82,35 L78,55 L62,70 L40,75 L22,62 L15,42 Z",

  // Taiwan - small leaf shape
  tw: "M35,12 L55,8 L65,22 L68,42 L62,62 L52,78 L40,82 L32,68 L28,48 L30,28 Z",

  // Philippines - archipelago
  ph: "M40,5 L55,10 L60,20 L55,28 L50,35 L55,42 L58,52 L55,62 L50,70 L45,80 L40,90 L35,82 L38,72 L42,62 L38,52 L35,42 L38,35 L42,28 L40,18 L38,10 Z",

  // Bangladesh - small rounded
  bd: "M22,18 L48,10 L70,18 L78,35 L72,55 L58,70 L38,75 L25,62 L18,45 Z",

  // Senegal - western African shape
  sn: "M10,30 L35,18 L62,20 L78,32 L82,48 L72,62 L50,68 L30,65 L15,52 L8,40 Z",

  // Tunisia - small vertical
  tn: "M28,12 L52,8 L65,20 L68,38 L62,55 L52,70 L40,78 L30,68 L25,50 L25,32 Z",

  // Costa Rica - small Central American
  cr: "M12,32 L32,18 L58,15 L78,28 L85,45 L75,60 L55,68 L32,62 L18,48 Z",

  // Panama - horizontal isthmus shape
  pa: "M5,38 L20,28 L40,22 L60,25 L78,32 L92,42 L85,55 L65,58 L45,55 L25,50 L10,48 L5,42 Z",

  // Ukraine - wide horizontal shape
  ua: "M8,35 L25,22 L48,15 L70,18 L88,28 L95,42 L88,55 L68,62 L45,65 L25,58 L12,48 Z",

  // Serbia - vertical shape
  rs: "M28,12 L52,8 L68,18 L72,35 L68,52 L60,68 L48,78 L35,72 L28,55 L25,38 L26,22 Z",

  // Georgia - small horizontal
  ge: "M8,35 L28,20 L55,15 L78,22 L92,38 L85,55 L62,62 L38,58 L18,48 L8,40 Z",

  // Azerbaijan - small with distinctive shape
  az: "M15,28 L38,15 L62,12 L80,25 L85,42 L78,58 L58,65 L35,62 L20,50 L12,38 Z",

  // New Zealand - two islands
  nz: "M35,8 L50,5 L60,12 L65,25 L58,38 L50,42 L42,38 L38,25 L35,15 Z M40,48 L52,45 L62,52 L65,65 L58,78 L48,85 L38,80 L35,68 L36,55 Z",

  // Jordan - roughly square with western indent
  jo: "M20,18 L50,10 L72,18 L80,35 L75,55 L60,68 L40,72 L25,62 L30,48 L25,35 Z",

  // Algeria - large roughly rectangular
  dz: "M15,20 L40,10 L65,12 L82,22 L88,40 L82,58 L68,72 L45,78 L25,70 L15,55 L10,38 Z",

  // Armenia - small mountainous shape
  am: "M15,30 L38,18 L62,15 L80,28 L85,45 L75,60 L55,65 L32,60 L18,48 Z",

  // Bolivia - roughly compact
  bo: "M18,18 L45,10 L70,15 L82,32 L78,52 L65,68 L42,75 L25,65 L15,48 L14,30 Z",

  // Paraguay - roughly diamond
  py: "M20,28 L42,12 L68,15 L82,32 L78,52 L62,68 L38,72 L22,58 L15,40 Z",

  // Kazakhstan - very wide
  kz: "M5,35 L20,22 L40,15 L60,12 L78,18 L92,28 L98,42 L90,55 L72,60 L50,58 L30,55 L15,48 L5,42 Z",

  // Uzbekistan - irregular
  uz: "M8,38 L25,22 L48,15 L72,20 L88,32 L92,48 L82,58 L60,62 L38,58 L20,50 L10,42 Z",

  // Mongolia - wide horizontal
  mn: "M5,32 L22,20 L45,14 L68,16 L88,25 L95,38 L90,52 L72,60 L48,62 L25,58 L12,48 L5,38 Z",

  // Nepal - flag-like trapezoidal
  np: "M8,40 L25,22 L50,15 L75,20 L92,35 L88,52 L68,62 L42,65 L20,58 L8,48 Z",

  // Myanmar - elongated with western coast
  mm: "M30,5 L50,8 L62,18 L65,32 L60,45 L55,55 L50,65 L45,78 L40,88 L35,82 L38,72 L42,60 L45,48 L42,38 L38,28 L35,18 L32,10 Z",

  // Uganda - roughly square
  ug: "M18,18 L48,10 L75,18 L82,35 L78,55 L65,70 L42,75 L25,65 L15,48 L14,30 Z",

  // Zambia - roughly rectangular
  zm: "M15,20 L42,10 L70,15 L82,30 L80,52 L70,68 L48,75 L28,70 L15,55 L12,38 Z",

  // Mozambique - elongated coastal
  mz: "M35,5 L55,8 L65,18 L68,32 L65,45 L60,58 L55,68 L50,78 L45,88 L38,92 L32,82 L35,72 L38,60 L40,48 L38,35 L35,22 L33,12 Z",

  // Namibia - roughly rectangular
  na: "M18,15 L48,10 L72,18 L80,35 L78,55 L68,72 L45,80 L25,72 L15,55 L12,35 Z",

  // Madagascar - elongated island
  mg: "M32,8 L52,5 L65,15 L70,30 L68,48 L62,62 L55,75 L45,88 L35,90 L28,78 L25,62 L28,45 L30,30 L30,18 Z",

  // Togo - very narrow vertical
  tg: "M30,8 L52,5 L62,15 L65,30 L62,48 L58,62 L55,78 L48,88 L38,85 L35,70 L33,55 L32,40 L30,25 L28,15 Z",

  // Papua New Guinea - eastern half of island
  pg: "M10,28 L30,18 L55,15 L75,22 L88,35 L85,50 L72,60 L50,62 L30,55 L15,48 L8,38 Z M78,55 L88,52 L92,60 L85,65 L78,62 Z",

  // New Caledonia - elongated island
  nc: "M8,55 L20,42 L35,32 L52,25 L70,22 L85,28 L92,38 L85,48 L68,55 L50,60 L32,62 L18,58 L8,55 Z",

  // Greenland - massive island
  gl: "M15,25 L30,10 L50,5 L70,10 L85,22 L90,40 L85,58 L75,72 L60,80 L42,82 L28,75 L18,62 L12,48 L10,35 Z",

  // Bhutan - small mountainous
  bt: "M10,38 L30,22 L55,18 L78,28 L90,42 L80,58 L55,65 L30,60 L15,48 Z",

  // Tajikistan - mountainous irregular
  tj: "M10,35 L28,20 L52,15 L75,22 L90,38 L82,55 L60,62 L38,58 L18,48 L8,40 Z",

  // Kyrgyzstan - mountainous irregular
  kg: "M5,38 L22,22 L48,15 L72,20 L92,35 L88,52 L65,60 L40,58 L18,50 L5,42 Z",

  // Eritrea - narrow coastal
  er: "M15,25 L35,12 L58,10 L75,20 L82,35 L78,52 L65,62 L45,58 L28,48 L18,38 Z",

  // Saudi Arabia - large peninsula
  sa: "M15,25 L40,12 L65,10 L82,20 L90,35 L88,55 L78,70 L60,78 L38,75 L22,62 L15,45 Z",

  // Lithuania - small horizontal
  lt: "M12,32 L35,18 L60,15 L80,25 L88,42 L78,55 L55,62 L32,58 L15,48 L10,38 Z",

  // Albania - small vertical
  al: "M28,10 L52,5 L65,18 L70,35 L68,52 L60,68 L48,80 L35,78 L28,62 L25,45 L26,28 Z",

  // North Macedonia - small compact
  mk: "M15,30 L38,18 L62,15 L82,28 L85,45 L75,60 L52,65 L30,60 L18,48 Z",

  // Moldova - small vertical
  md: "M28,10 L52,5 L65,18 L68,35 L65,55 L55,70 L42,78 L32,70 L25,52 L25,35 L26,20 Z",

  // Belarus - roughly rectangular
  by: "M12,25 L35,15 L60,12 L82,22 L88,38 L82,55 L62,65 L38,65 L18,55 L10,40 Z",

  // Laos - irregular vertical
  la: "M28,8 L48,5 L62,15 L65,28 L58,40 L55,52 L60,62 L55,75 L45,85 L35,78 L32,65 L38,55 L42,42 L38,32 L32,22 L28,15 Z",

  // Bahrain - tiny island
  bh: "M30,20 L55,12 L70,25 L72,48 L62,68 L45,78 L32,68 L28,48 L28,30 Z",

  // Kuwait - small triangular
  kw: "M22,20 L52,10 L75,22 L80,42 L68,62 L45,72 L25,60 L18,40 Z",

  // Libya - large roughly rectangular
  ly: "M12,18 L38,10 L65,12 L85,22 L90,40 L85,58 L70,72 L48,78 L28,72 L15,55 L10,38 Z",

  // Malawi - narrow vertical
  mw: "M30,5 L52,5 L62,15 L65,30 L62,48 L58,62 L52,75 L45,88 L35,85 L32,70 L30,55 L28,40 L28,25 L28,12 Z",

  // Mauritius - small island
  mu: "M28,25 L52,15 L72,28 L78,48 L68,68 L48,78 L30,68 L22,48 Z",

  // Seychelles - tiny island group
  sc: "M35,30 L50,22 L65,30 L70,48 L60,62 L45,68 L32,58 L28,42 Z",

  // Benin - narrow vertical
  bj: "M28,8 L52,5 L62,18 L65,35 L62,52 L58,68 L52,82 L42,88 L35,78 L32,62 L30,45 L28,30 L27,18 Z",

  // Niger - wide shape
  ne: "M10,30 L30,15 L55,10 L78,18 L92,32 L90,50 L78,62 L55,68 L30,62 L15,50 L8,38 Z",

  // Mali - large square-ish
  ml: "M10,25 L32,12 L58,10 L80,20 L90,38 L85,55 L68,68 L45,72 L25,65 L12,50 L8,35 Z",

  // Mauritania - large square-ish
  mr: "M10,20 L35,10 L62,12 L82,25 L88,42 L82,60 L65,72 L40,75 L20,65 L10,48 L8,32 Z",

  // Angola - large roughly square
  ao: "M12,18 L38,10 L65,15 L82,28 L85,48 L78,65 L58,75 L35,78 L18,65 L10,45 Z",

  // DR Congo - large irregular
  cd: "M15,15 L38,8 L60,10 L78,20 L85,35 L82,52 L75,65 L60,75 L42,80 L25,72 L15,58 L10,42 L12,28 Z",

  // Republic of Congo - narrow vertical
  cg: "M28,8 L50,5 L62,15 L68,30 L65,48 L58,62 L52,75 L42,85 L32,78 L28,62 L25,45 L25,30 L26,18 Z",

  // Cameroon - distinctive triangular shape
  cm: "M20,15 L45,8 L65,15 L75,30 L72,48 L62,62 L48,72 L32,68 L22,55 L18,38 Z",

  // Gabon - small equatorial
  ga: "M18,22 L42,12 L68,18 L80,35 L75,55 L60,68 L38,72 L22,60 L15,42 Z",

  // Rwanda - tiny compact
  rw: "M18,25 L42,15 L68,22 L80,40 L72,58 L52,68 L30,62 L18,48 Z",

  // Burundi - tiny compact
  bi: "M20,22 L45,12 L70,20 L78,40 L68,58 L48,68 L28,62 L18,45 Z",
};

export default COUNTRY_PATHS;
