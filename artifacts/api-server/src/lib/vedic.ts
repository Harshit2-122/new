import * as Astronomy from "astronomy-engine";
import { DateTime } from "luxon";
import tzlookup from "tz-lookup";

const RASHIS = [
  "Mesha (Aries)",
  "Vrishabha (Taurus)",
  "Mithuna (Gemini)",
  "Karka (Cancer)",
  "Simha (Leo)",
  "Kanya (Virgo)",
  "Tula (Libra)",
  "Vrishchika (Scorpio)",
  "Dhanu (Sagittarius)",
  "Makara (Capricorn)",
  "Kumbha (Aquarius)",
  "Meena (Pisces)",
] as const;

const NAKSHATRAS = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
] as const;

const NAKSHATRA_LORDS = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
] as const;

// Vimshottari dasha periods in years, by lord
const DASHA_YEARS: Record<string, number> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17,
};
const DASHA_ORDER = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"] as const;

function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Lahiri ayanamsa in degrees for a given UTC date.
 * Standard formula: 23°51'11.6" at J2000.0 + ~50.27"/year drift.
 */
function lahiriAyanamsa(date: Date): number {
  const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0); // 2000-01-01 12:00 UTC
  const yearsSinceJ2000 = (date.getTime() - J2000) / (365.25 * 86400 * 1000);
  return 23.85322 + yearsSinceJ2000 * (50.2877 / 3600); // ~50.27" per year
}

function rashiOf(siderealLongitude: number): { index: number; name: string; degInSign: number } {
  const lng = norm360(siderealLongitude);
  const index = Math.floor(lng / 30);
  return {
    index,
    name: RASHIS[index],
    degInSign: lng - index * 30,
  };
}

function nakshatraOf(siderealMoonLongitude: number): {
  index: number;
  name: string;
  pada: number;
  lord: string;
  fractionElapsed: number;
} {
  const lng = norm360(siderealMoonLongitude);
  const span = 360 / 27; // 13.3333°
  const index = Math.floor(lng / span);
  const within = lng - index * span;
  const pada = Math.min(4, Math.floor(within / (span / 4)) + 1);
  return {
    index,
    name: NAKSHATRAS[index],
    pada,
    lord: NAKSHATRA_LORDS[index],
    fractionElapsed: within / span,
  };
}

/**
 * Compute Lagna (Ascendant) ecliptic longitude in degrees (tropical).
 * Uses Meeus formula 14.5 with proper quadrant disambiguation against the MC.
 */
function tropicalAscendant(utc: Date, latitudeDeg: number, longitudeDeg: number): number {
  // Greenwich Apparent Sidereal Time in hours
  const time = new Astronomy.AstroTime(utc);
  const gastHours = Astronomy.SiderealTime(time);
  // Local sidereal time = GAST + east longitude
  const lstHours = ((gastHours + longitudeDeg / 15) % 24 + 24) % 24;
  const ramcDeg = lstHours * 15; // RAMC (Right Ascension of Mid-heaven) in degrees

  const epsilon = meanObliquity(time); // obliquity of ecliptic of date
  const ramc = (ramcDeg * Math.PI) / 180;
  const eps = (epsilon * Math.PI) / 180;
  const phi = (latitudeDeg * Math.PI) / 180;

  // Ascendant: tan(asc) = -cos(RAMC) / (sin(eps)*tan(phi) + cos(eps)*sin(RAMC))
  const ascRad = Math.atan2(
    -Math.cos(ramc),
    Math.sin(eps) * Math.tan(phi) + Math.cos(eps) * Math.sin(ramc),
  );
  let asc = norm360((ascRad * 180) / Math.PI);

  // MC: tan(MC) = sin(RAMC) / cos(RAMC)*cos(eps)  →  use atan2
  const mcRad = Math.atan2(
    Math.sin(ramc),
    Math.cos(ramc) * Math.cos(eps),
  );
  const mc = norm360((mcRad * 180) / Math.PI);

  // Disambiguate: the Ascendant must be ~90° east (counter-clockwise) of MC.
  // i.e. (asc - mc) mod 360 should be in (0, 180). If not, flip by 180°.
  let diff = (asc - mc + 360) % 360;
  if (diff < 1 || diff > 359 || diff > 180) {
    asc = (asc + 180) % 360;
  }

  return asc;
}

/**
 * Mean obliquity of the ecliptic in degrees, accurate to ~0.001° for ±2000 years.
 * IAU 2006 polynomial.
 */
function meanObliquity(time: Astronomy.AstroTime): number {
  const T = (time.tt) / 36525; // Julian centuries from J2000 TT
  // arcseconds polynomial, then convert
  const eps0Arcsec =
    84381.406 -
    46.836769 * T -
    0.0001831 * T * T +
    0.00200340 * T * T * T -
    0.000000576 * Math.pow(T, 4) -
    0.0000000434 * Math.pow(T, 5);
  return eps0Arcsec / 3600;
}

function bodyEclipticLongitude(body: Astronomy.Body, utc: Date): number {
  const time = new Astronomy.AstroTime(utc);
  // Geocentric ecliptic longitude (apparent, tropical)
  const ecliptic = Astronomy.Ecliptic(Astronomy.GeoVector(body, time, true));
  return norm360(ecliptic.elon);
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
  countryCode?: string;
}

/**
 * Geocode a free-form place name using OpenStreetMap Nominatim (free, no key).
 * Returns null if not found or on error.
 */
export async function geocodePlace(place: string): Promise<GeocodeResult | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", place);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("addressdetails", "1");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Kundali-Reading-App/1.0 (vedic-astrology)",
        "Accept-Language": "en",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
      address?: { country_code?: string };
    }>;
    if (!data.length) return null;
    const top = data[0];
    return {
      latitude: parseFloat(top.lat),
      longitude: parseFloat(top.lon),
      displayName: top.display_name,
      countryCode: top.address?.country_code?.toUpperCase(),
    };
  } catch {
    return null;
  }
}

export interface VedicChart {
  // Inputs as actually used
  resolvedPlace: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  utcDate: string; // ISO string
  ayanamsa: number; // degrees

  // Sidereal positions
  sun: { longitude: number; rashi: string; degInSign: number };
  moon: { longitude: number; rashi: string; degInSign: number; nakshatra: string; pada: number; nakshatraLord: string };
  lagna: { longitude: number; rashi: string; degInSign: number } | null;

  // Vimshottari dasha
  currentDasha: { lord: string; startDate: string; endDate: string } | null;

  // Diagnostics
  notes: string[];
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function computeBirthMahadasha(moonLongSidereal: number, birthUtc: Date): { lord: string; startDate: string; endDate: string } {
  const nak = nakshatraOf(moonLongSidereal);
  const lord = nak.lord;
  const totalYears = DASHA_YEARS[lord];
  // Years already elapsed at birth = totalYears * fractionElapsed
  const elapsedYears = totalYears * nak.fractionElapsed;
  const remainingYears = totalYears - elapsedYears;

  // Dasha started this many years before birth
  const startMs = birthUtc.getTime() - elapsedYears * 365.25 * 86400 * 1000;
  const endMs = birthUtc.getTime() + remainingYears * 365.25 * 86400 * 1000;

  // Now, find which dasha is currently active (today)
  const today = new Date();
  let cursor = new Date(startMs);
  let lordIdx = DASHA_ORDER.indexOf(lord as typeof DASHA_ORDER[number]);
  let activeLord = lord;
  let activeStart = new Date(startMs);
  let activeEnd = new Date(endMs);

  // Walk forward through dashas until we find the one containing today
  for (let i = 0; i < 9; i++) {
    if (today >= activeStart && today < activeEnd) break;
    cursor = new Date(activeEnd);
    lordIdx = (lordIdx + 1) % DASHA_ORDER.length;
    activeLord = DASHA_ORDER[lordIdx];
    activeStart = new Date(cursor);
    activeEnd = new Date(cursor.getTime() + DASHA_YEARS[activeLord] * 365.25 * 86400 * 1000);
  }

  return {
    lord: activeLord,
    startDate: formatDate(activeStart),
    endDate: formatDate(activeEnd),
  };
}

/**
 * Compute the full Vedic chart from form inputs.
 * dateOfBirth: "DD/MM/YYYY"
 * timeOfBirth: "HH:MM" (24h, in birth-place local time)
 */
export async function computeVedicChart(input: {
  dateOfBirth: string;
  timeOfBirth: string;
  timeAccuracy: string;
  placeOfBirth: string;
}): Promise<VedicChart> {
  const notes: string[] = [];

  // Parse date
  const dobMatch = input.dateOfBirth.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!dobMatch) throw new Error("Invalid date format");
  const day = parseInt(dobMatch[1]);
  const month = parseInt(dobMatch[2]);
  const year = parseInt(dobMatch[3]);

  // Parse time (default to 12:00 if unknown / unparseable)
  let hour = 12;
  let minute = 0;
  const timeMatch = input.timeOfBirth.match(/^(\d{1,2}):(\d{2})$/);
  if (timeMatch) {
    hour = parseInt(timeMatch[1]);
    minute = parseInt(timeMatch[2]);
  } else {
    notes.push("Birth time was unparseable; defaulted to 12:00 noon. Moon sign and Lagna are best-estimates.");
  }

  // Geocode place
  const geo = await geocodePlace(input.placeOfBirth);
  let timezone = "Asia/Kolkata";
  let latitude: number | null = null;
  let longitude: number | null = null;
  let resolvedPlace: string | null = null;

  if (geo) {
    latitude = geo.latitude;
    longitude = geo.longitude;
    resolvedPlace = geo.displayName;
    try {
      timezone = tzlookup(geo.latitude, geo.longitude);
    } catch {
      notes.push("Timezone lookup failed; assumed Asia/Kolkata (IST).");
    }
  } else {
    notes.push(`Place of birth "${input.placeOfBirth}" could not be geocoded; Lagna is approximate. Assumed Asia/Kolkata timezone.`);
  }

  // Build a DateTime in the birth-place timezone, then convert to UTC
  const localDt = DateTime.fromObject(
    { year, month, day, hour, minute },
    { zone: timezone },
  );
  if (!localDt.isValid) {
    throw new Error(`Invalid local date/time: ${localDt.invalidReason}`);
  }
  const utcDate = localDt.toUTC().toJSDate();

  // Ayanamsa
  const ayanamsa = lahiriAyanamsa(utcDate);

  // Compute Sun & Moon tropical longitudes, then convert to sidereal
  const sunTrop = bodyEclipticLongitude(Astronomy.Body.Sun, utcDate);
  const moonTrop = bodyEclipticLongitude(Astronomy.Body.Moon, utcDate);
  const sunSid = norm360(sunTrop - ayanamsa);
  const moonSid = norm360(moonTrop - ayanamsa);

  const sunRashi = rashiOf(sunSid);
  const moonRashi = rashiOf(moonSid);
  const moonNak = nakshatraOf(moonSid);

  // Lagna (only meaningful with lat/long)
  let lagna: VedicChart["lagna"] = null;
  if (latitude !== null && longitude !== null) {
    const lagnaTrop = tropicalAscendant(utcDate, latitude, longitude);
    const lagnaSid = norm360(lagnaTrop - ayanamsa);
    const lagnaR = rashiOf(lagnaSid);
    lagna = {
      longitude: lagnaSid,
      rashi: lagnaR.name,
      degInSign: lagnaR.degInSign,
    };

    if (input.timeAccuracy === "approximate") {
      notes.push("Birth time is approximate — Lagna may be off by one sign on either side.");
    } else if (input.timeAccuracy === "unknown") {
      notes.push("Birth time is unknown — Lagna is unreliable; rely on Moon sign and Nakshatra.");
    }
  } else {
    notes.push("Lagna could not be computed (no place coordinates).");
  }

  // Current Mahadasha
  const currentDasha = computeBirthMahadasha(moonSid, utcDate);

  return {
    resolvedPlace,
    latitude,
    longitude,
    timezone,
    utcDate: utcDate.toISOString(),
    ayanamsa,
    sun: {
      longitude: sunSid,
      rashi: sunRashi.name,
      degInSign: sunRashi.degInSign,
    },
    moon: {
      longitude: moonSid,
      rashi: moonRashi.name,
      degInSign: moonRashi.degInSign,
      nakshatra: moonNak.name,
      pada: moonNak.pada,
      nakshatraLord: moonNak.lord,
    },
    lagna,
    currentDasha,
    notes,
  };
}

export function formatChartForPrompt(chart: VedicChart): string {
  const lines: string[] = [];
  lines.push("════════════════════════════════════════════════════════════");
  lines.push("VERIFIED ASTRONOMICAL CALCULATIONS (Sidereal / Lahiri ayanamsa)");
  lines.push("These are computed from real ephemeris data. USE THESE VALUES.");
  lines.push("Do NOT recompute or override them. Do NOT report any other Sun/Moon/Lagna sign.");
  lines.push("════════════════════════════════════════════════════════════");
  lines.push(`- Resolved birth place: ${chart.resolvedPlace ?? "could not geocode"}`);
  if (chart.latitude !== null && chart.longitude !== null) {
    lines.push(`- Coordinates: ${chart.latitude.toFixed(4)}°, ${chart.longitude.toFixed(4)}°`);
  }
  lines.push(`- Timezone used: ${chart.timezone}`);
  lines.push(`- Birth UTC: ${chart.utcDate}`);
  lines.push(`- Lahiri ayanamsa applied: ${chart.ayanamsa.toFixed(4)}°`);
  lines.push("");
  lines.push(`SUN (Surya) — Sidereal longitude ${chart.sun.longitude.toFixed(2)}°`);
  lines.push(`  → Rashi: ${chart.sun.rashi} (${chart.sun.degInSign.toFixed(2)}° in sign)`);
  lines.push("");
  lines.push(`MOON (Chandra) — Sidereal longitude ${chart.moon.longitude.toFixed(2)}°`);
  lines.push(`  → Moon Sign (Janma Rashi): ${chart.moon.rashi} (${chart.moon.degInSign.toFixed(2)}° in sign)`);
  lines.push(`  → Nakshatra: ${chart.moon.nakshatra}, Pada ${chart.moon.pada} (lord: ${chart.moon.nakshatraLord})`);
  lines.push("");
  if (chart.lagna) {
    lines.push(`LAGNA (Ascendant) — Sidereal longitude ${chart.lagna.longitude.toFixed(2)}°`);
    lines.push(`  → Lagna Rashi: ${chart.lagna.rashi} (${chart.lagna.degInSign.toFixed(2)}° in sign)`);
  } else {
    lines.push(`LAGNA (Ascendant): could not be computed — estimate based on time-of-day if useful, but flag clearly.`);
  }
  lines.push("");
  if (chart.currentDasha) {
    lines.push(`VIMSHOTTARI MAHADASHA running today: ${chart.currentDasha.lord}`);
    lines.push(`  → From: ${chart.currentDasha.startDate}  To: ${chart.currentDasha.endDate}`);
  }
  if (chart.notes.length > 0) {
    lines.push("");
    lines.push("Astrologer caveats:");
    for (const n of chart.notes) lines.push(`  - ${n}`);
  }
  lines.push("════════════════════════════════════════════════════════════");
  return lines.join("\n");
}
