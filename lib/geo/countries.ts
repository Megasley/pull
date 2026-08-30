/**
 * Maintained ISO 3166-1 alpha-2 → name/continent/region mapping.
 *
 * This is the single source of truth for deriving region/continent from a
 * user's self-reported `users.country` — see lib/impact/definitions.ts.
 * Region granularity follows UN M49 sub-regions for Africa specifically
 * (the level of detail most ecosystem reporting cares about there); all
 * other continents use continent-level region for now — add finer
 * sub-regions here if a future report needs them.
 *
 * Deliberately covers UN member states plus a few commonly-used codes
 * (Taiwan, Kosovo, Palestine, Hong Kong). Not exhaustive of every dependent
 * territory — extend this table as gaps are found; nothing else in the
 * codebase needs to change to support a new entry.
 */

export type Continent =
  | "Africa"
  | "Asia"
  | "Europe"
  | "North America"
  | "South America"
  | "Oceania"
  | "Antarctica";

export type CountryInfo = {
  code: string;
  name: string;
  continent: Continent;
  /** Finer-grained than continent for Africa; equals continent elsewhere. */
  region: string;
};

const AFRICA = "Africa" as const;

function africa(code: string, name: string, region: string): [string, CountryInfo] {
  return [code, { code, name, continent: AFRICA, region }];
}

function other(code: string, name: string, continent: Continent): [string, CountryInfo] {
  return [code, { code, name, continent, region: continent }];
}

export const COUNTRIES: Record<string, CountryInfo> = Object.fromEntries([
  // ── Africa, by UN M49 sub-region ──────────────────────────────────────
  africa("DZ", "Algeria", "Northern Africa"),
  africa("EG", "Egypt", "Northern Africa"),
  africa("LY", "Libya", "Northern Africa"),
  africa("MA", "Morocco", "Northern Africa"),
  africa("SD", "Sudan", "Northern Africa"),
  africa("TN", "Tunisia", "Northern Africa"),
  africa("EH", "Western Sahara", "Northern Africa"),

  africa("BJ", "Benin", "Western Africa"),
  africa("BF", "Burkina Faso", "Western Africa"),
  africa("CV", "Cabo Verde", "Western Africa"),
  africa("CI", "Côte d'Ivoire", "Western Africa"),
  africa("GM", "Gambia", "Western Africa"),
  africa("GH", "Ghana", "Western Africa"),
  africa("GN", "Guinea", "Western Africa"),
  africa("GW", "Guinea-Bissau", "Western Africa"),
  africa("LR", "Liberia", "Western Africa"),
  africa("ML", "Mali", "Western Africa"),
  africa("MR", "Mauritania", "Western Africa"),
  africa("NE", "Niger", "Western Africa"),
  africa("NG", "Nigeria", "Western Africa"),
  africa("SN", "Senegal", "Western Africa"),
  africa("SL", "Sierra Leone", "Western Africa"),
  africa("TG", "Togo", "Western Africa"),

  africa("AO", "Angola", "Middle Africa"),
  africa("CM", "Cameroon", "Middle Africa"),
  africa("CF", "Central African Republic", "Middle Africa"),
  africa("TD", "Chad", "Middle Africa"),
  africa("CG", "Congo", "Middle Africa"),
  africa("CD", "DR Congo", "Middle Africa"),
  africa("GQ", "Equatorial Guinea", "Middle Africa"),
  africa("GA", "Gabon", "Middle Africa"),
  africa("ST", "São Tomé and Príncipe", "Middle Africa"),

  africa("BI", "Burundi", "Eastern Africa"),
  africa("KM", "Comoros", "Eastern Africa"),
  africa("DJ", "Djibouti", "Eastern Africa"),
  africa("ER", "Eritrea", "Eastern Africa"),
  africa("SZ", "Eswatini", "Eastern Africa"),
  africa("ET", "Ethiopia", "Eastern Africa"),
  africa("KE", "Kenya", "Eastern Africa"),
  africa("MG", "Madagascar", "Eastern Africa"),
  africa("MW", "Malawi", "Eastern Africa"),
  africa("MU", "Mauritius", "Eastern Africa"),
  africa("YT", "Mayotte", "Eastern Africa"),
  africa("MZ", "Mozambique", "Eastern Africa"),
  africa("RE", "Réunion", "Eastern Africa"),
  africa("RW", "Rwanda", "Eastern Africa"),
  africa("SC", "Seychelles", "Eastern Africa"),
  africa("SO", "Somalia", "Eastern Africa"),
  africa("SS", "South Sudan", "Eastern Africa"),
  africa("TZ", "Tanzania", "Eastern Africa"),
  africa("UG", "Uganda", "Eastern Africa"),
  africa("ZM", "Zambia", "Eastern Africa"),
  africa("ZW", "Zimbabwe", "Eastern Africa"),

  africa("BW", "Botswana", "Southern Africa"),
  africa("LS", "Lesotho", "Southern Africa"),
  africa("NA", "Namibia", "Southern Africa"),
  africa("ZA", "South Africa", "Southern Africa"),

  // ── Rest of world (continent-level region) ────────────────────────────
  other("US", "United States", "North America"),
  other("CA", "Canada", "North America"),
  other("MX", "Mexico", "North America"),
  other("GT", "Guatemala", "North America"),
  other("BZ", "Belize", "North America"),
  other("HN", "Honduras", "North America"),
  other("SV", "El Salvador", "North America"),
  other("NI", "Nicaragua", "North America"),
  other("CR", "Costa Rica", "North America"),
  other("PA", "Panama", "North America"),
  other("CU", "Cuba", "North America"),
  other("DO", "Dominican Republic", "North America"),
  other("HT", "Haiti", "North America"),
  other("JM", "Jamaica", "North America"),
  other("TT", "Trinidad and Tobago", "North America"),
  other("BS", "Bahamas", "North America"),
  other("BB", "Barbados", "North America"),

  other("AR", "Argentina", "South America"),
  other("BO", "Bolivia", "South America"),
  other("BR", "Brazil", "South America"),
  other("CL", "Chile", "South America"),
  other("CO", "Colombia", "South America"),
  other("EC", "Ecuador", "South America"),
  other("GY", "Guyana", "South America"),
  other("PY", "Paraguay", "South America"),
  other("PE", "Peru", "South America"),
  other("SR", "Suriname", "South America"),
  other("UY", "Uruguay", "South America"),
  other("VE", "Venezuela", "South America"),

  other("AL", "Albania", "Europe"),
  other("AD", "Andorra", "Europe"),
  other("AT", "Austria", "Europe"),
  other("BY", "Belarus", "Europe"),
  other("BE", "Belgium", "Europe"),
  other("BA", "Bosnia and Herzegovina", "Europe"),
  other("BG", "Bulgaria", "Europe"),
  other("HR", "Croatia", "Europe"),
  other("CY", "Cyprus", "Europe"),
  other("CZ", "Czechia", "Europe"),
  other("DK", "Denmark", "Europe"),
  other("EE", "Estonia", "Europe"),
  other("FI", "Finland", "Europe"),
  other("FR", "France", "Europe"),
  other("DE", "Germany", "Europe"),
  other("GR", "Greece", "Europe"),
  other("HU", "Hungary", "Europe"),
  other("IS", "Iceland", "Europe"),
  other("IE", "Ireland", "Europe"),
  other("IT", "Italy", "Europe"),
  other("XK", "Kosovo", "Europe"),
  other("LV", "Latvia", "Europe"),
  other("LI", "Liechtenstein", "Europe"),
  other("LT", "Lithuania", "Europe"),
  other("LU", "Luxembourg", "Europe"),
  other("MT", "Malta", "Europe"),
  other("MD", "Moldova", "Europe"),
  other("MC", "Monaco", "Europe"),
  other("ME", "Montenegro", "Europe"),
  other("NL", "Netherlands", "Europe"),
  other("MK", "North Macedonia", "Europe"),
  other("NO", "Norway", "Europe"),
  other("PL", "Poland", "Europe"),
  other("PT", "Portugal", "Europe"),
  other("RO", "Romania", "Europe"),
  other("RU", "Russia", "Europe"),
  other("SM", "San Marino", "Europe"),
  other("RS", "Serbia", "Europe"),
  other("SK", "Slovakia", "Europe"),
  other("SI", "Slovenia", "Europe"),
  other("ES", "Spain", "Europe"),
  other("SE", "Sweden", "Europe"),
  other("CH", "Switzerland", "Europe"),
  other("UA", "Ukraine", "Europe"),
  other("GB", "United Kingdom", "Europe"),
  other("VA", "Vatican City", "Europe"),

  other("AF", "Afghanistan", "Asia"),
  other("AM", "Armenia", "Asia"),
  other("AZ", "Azerbaijan", "Asia"),
  other("BH", "Bahrain", "Asia"),
  other("BD", "Bangladesh", "Asia"),
  other("BT", "Bhutan", "Asia"),
  other("BN", "Brunei", "Asia"),
  other("KH", "Cambodia", "Asia"),
  other("CN", "China", "Asia"),
  other("GE", "Georgia", "Asia"),
  other("HK", "Hong Kong", "Asia"),
  other("IN", "India", "Asia"),
  other("ID", "Indonesia", "Asia"),
  other("IR", "Iran", "Asia"),
  other("IQ", "Iraq", "Asia"),
  other("IL", "Israel", "Asia"),
  other("JP", "Japan", "Asia"),
  other("JO", "Jordan", "Asia"),
  other("KZ", "Kazakhstan", "Asia"),
  other("KW", "Kuwait", "Asia"),
  other("KG", "Kyrgyzstan", "Asia"),
  other("LA", "Laos", "Asia"),
  other("LB", "Lebanon", "Asia"),
  other("MY", "Malaysia", "Asia"),
  other("MV", "Maldives", "Asia"),
  other("MN", "Mongolia", "Asia"),
  other("MM", "Myanmar", "Asia"),
  other("NP", "Nepal", "Asia"),
  other("KP", "North Korea", "Asia"),
  other("OM", "Oman", "Asia"),
  other("PK", "Pakistan", "Asia"),
  other("PS", "Palestine", "Asia"),
  other("PH", "Philippines", "Asia"),
  other("QA", "Qatar", "Asia"),
  other("SA", "Saudi Arabia", "Asia"),
  other("SG", "Singapore", "Asia"),
  other("KR", "South Korea", "Asia"),
  other("LK", "Sri Lanka", "Asia"),
  other("SY", "Syria", "Asia"),
  other("TW", "Taiwan", "Asia"),
  other("TJ", "Tajikistan", "Asia"),
  other("TH", "Thailand", "Asia"),
  other("TL", "Timor-Leste", "Asia"),
  other("TR", "Turkey", "Asia"),
  other("TM", "Turkmenistan", "Asia"),
  other("AE", "United Arab Emirates", "Asia"),
  other("UZ", "Uzbekistan", "Asia"),
  other("VN", "Vietnam", "Asia"),
  other("YE", "Yemen", "Asia"),

  other("AU", "Australia", "Oceania"),
  other("FJ", "Fiji", "Oceania"),
  other("KI", "Kiribati", "Oceania"),
  other("MH", "Marshall Islands", "Oceania"),
  other("FM", "Micronesia", "Oceania"),
  other("NR", "Nauru", "Oceania"),
  other("NZ", "New Zealand", "Oceania"),
  other("PW", "Palau", "Oceania"),
  other("PG", "Papua New Guinea", "Oceania"),
  other("WS", "Samoa", "Oceania"),
  other("SB", "Solomon Islands", "Oceania"),
  other("TO", "Tonga", "Oceania"),
  other("TV", "Tuvalu", "Oceania"),
  other("VU", "Vanuatu", "Oceania"),
]);

export function getCountryInfo(code: string | null | undefined): CountryInfo | null {
  if (!code) return null;
  return COUNTRIES[code.toUpperCase()] ?? null;
}

export function isKnownCountryCode(code: string | null | undefined): boolean {
  return Boolean(code && COUNTRIES[code.toUpperCase()]);
}

export function isAfricanCountry(code: string | null | undefined): boolean {
  return getCountryInfo(code)?.continent === "Africa";
}

export function getCountryCodesForRegion(region: string): string[] {
  return Object.values(COUNTRIES)
    .filter((info) => info.region === region)
    .map((info) => info.code);
}

export function getCountryCodesForContinent(continent: Continent): string[] {
  return Object.values(COUNTRIES)
    .filter((info) => info.continent === continent)
    .map((info) => info.code);
}

export const AFRICAN_COUNTRY_CODES: string[] = getCountryCodesForContinent("Africa");

/** For <select> country pickers — sorted, human-readable. */
export function listCountriesForSelect(): Array<{ code: string; name: string }> {
  return Object.values(COUNTRIES)
    .map(({ code, name }) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
