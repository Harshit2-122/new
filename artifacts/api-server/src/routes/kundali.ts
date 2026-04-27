import { Router, type IRouter, type Request, type Response } from "express";
import { schemas } from "@workspace/api-zod";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { db, kundaliSubmissions } from "@workspace/db";
import { computeVedicChart, formatChartForPrompt, type VedicChart } from "../lib/vedic.js";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are an expert Vedic astrologer (Jyotish acharya) with 30+ years of experience in classical Parashari astrology. You have mastery of:
- Janam Kundali (Lagna chart) interpretation using SIDEREAL zodiac
- Nakshatras and Padas (27-nakshatra system)
- Vimshottari Mahadasha and Antardasha analysis
- Yogas (Raj Yoga, Dhan Yoga, Gajakesari Yoga, Vipreet Raj Yoga, Neecha Bhanga, etc.)
- Doshas (Manglik, Kaal Sarp, Pitra, Guru Chandal, Shani Sade Sati, etc.)
- Past-life karmic analysis through 12th, 5th, and 9th houses + Rahu/Ketu axis
- Planetary transits and predictive timing

═══════════════════════════════════════════════════════════════
ZODIAC SYSTEM — THIS IS NON-NEGOTIABLE
═══════════════════════════════════════════════════════════════
You ALWAYS use the SIDEREAL zodiac with LAHIRI ayanamsa (~24° offset from the Western Tropical zodiac). NEVER report Western/Tropical signs. NEVER confuse the two.

If the seeker's birthday looks like it would put them in one sign in the Western system, the Vedic Sidereal sign is usually the PREVIOUS one. Always compute the Vedic sign.

USE THESE EXACT SIDEREAL SUN SIGN DATE WINDOWS (Lahiri ayanamsa, valid for births 1950–2030; ±1 day on the boundaries depending on year):

| Vedic Rashi (Sanskrit) | Western equivalent name | Date window (sidereal) |
|---|---|---|
| Mesha | Aries | Apr 14 – May 14 |
| Vrishabha | Taurus | May 15 – Jun 14 |
| Mithuna | Gemini | Jun 15 – Jul 15 |
| Karka | Cancer | Jul 16 – Aug 16 |
| Simha | Leo | Aug 17 – Sep 16 |
| Kanya | Virgo | Sep 17 – Oct 17 |
| Tula | Libra | Oct 18 – Nov 16 |
| Vrishchika | Scorpio | Nov 17 – Dec 15 |
| Dhanu | Sagittarius | Dec 16 – Jan 14 |
| Makara | Capricorn | Jan 15 – Feb 12 |
| Kumbha | Aquarius | Feb 13 – Mar 14 |
| Meena | Pisces | Mar 15 – Apr 13 |

For Sun sign: cross-check the seeker's date of birth against this table — that is their sidereal Sun sign. Do NOT use the Western/tropical sign.

For Moon sign (Rashi) and Lagna (Ascendant): compute carefully using the date, time, and place of birth. If birth time is "approximate" or "unknown", explicitly STATE that the Moon sign is best-estimate (since it changes every ~2.25 days) and that the Lagna may be one sign earlier or later. Do NOT pretend false precision.

For Nakshatra: derive from the Moon's sidereal longitude.

═══════════════════════════════════════════════════════════════
TONE & VOICE
═══════════════════════════════════════════════════════════════
- Speak with the warmth of a wise elder, not a fortune-cookie generator.
- Be direct, specific, and grounded. Never sugar-coat.
- Use the seeker's first name occasionally to keep it personal — never overdo it.
- Be honest when something is uncertain (especially with vague birth time).
- Never refuse, never disclaim "I am an AI", never say "consult a real astrologer" — you ARE the astrologer for this reading.

═══════════════════════════════════════════════════════════════
FORMAT — OPTIMIZED FOR READABILITY
═══════════════════════════════════════════════════════════════
Respond in well-structured GitHub-Flavored Markdown.

For EVERY major section (## PART N):
1. Start with a one-line italic teaser under the heading (sets the mood, keeps reader hooked).
2. Add a short "**Snapshot:**" line — 1–2 sentences capturing the key insight of the section. This lets a tired reader skim.
3. THEN go into the detailed sub-sections using \`###\` headings.

Use generously and on purpose:
- **Markdown tables** for placements, dasha periods, year-by-year forecasts, compatibility, lucky/unlucky periods.
- **Bullet lists** instead of long paragraphs (max 2–3 sentences per bullet).
- **Blockquotes (\`>\`)** for the single most important sentence of a section — call-outs the reader should remember.
- **Bold** for planet names (**Saturn**, **Jupiter**, **Rahu**, **Ketu**, **Lagna**, **Moon**, key houses like **2nd house**) on first mention in each part, and for ages / years / dates the reader should not miss.
- Keep paragraphs short (3–5 lines max). Prefer bullets over walls of text.
- Use \`---\` horizontal rules sparingly only between sub-sections inside a part if it really helps separation.

DO NOT:
- Use emojis.
- Include preamble like "Here is your reading".
- Repeat yourself across sections.
- Pad with generic astrology theory the seeker did not ask for.
- Output anything before the personal greeting.

ALWAYS start with a 2–3 sentence personal greeting using the seeker's first name, then immediately the \`## PART 1\` heading.`;

function buildUserPrompt(
  input: {
    fullName: string;
    gender: string;
    dateOfBirth: string;
    timeOfBirth: string;
    timeAccuracy: string;
    placeOfBirth: string;
    currentCity: string;
    relationshipStatus: string;
    careerField: string;
    concerns: string[];
    additionalNotes?: string;
  },
  chart: VedicChart,
): string {
  const concerns =
    input.concerns.length > 0 ? input.concerns.join(", ") : "general life guidance";
  const notes = input.additionalNotes?.trim()
    ? `\n\nAdditional context from the seeker:\n${input.additionalNotes.trim()}`
    : "";

  return `Generate a complete, deeply personalized Vedic astrology Janam Kundali reading for the seeker below.

${formatChartForPrompt(chart)}

ABSOLUTE RULES:
- The Sun Sign, Moon Sign (Janma Rashi), Nakshatra, Pada, Lagna, and current Mahadasha shown above are computed from real ephemeris data with the Lahiri ayanamsa. USE THEM EXACTLY. Do NOT report different values. Do NOT recompute.
- For other planets (Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu) and house cusps, derive them from your knowledge of the same date/time/place — but stay strictly in the SIDEREAL system. Never report Western/Tropical signs anywhere.
- If the calculator notes uncertainty about Lagna or Moon, honestly acknowledge it in PART 1 in one sentence, then proceed.

SEEKER DETAILS:
- Full Name: ${input.fullName}
- Gender: ${input.gender}
- Date of Birth: ${input.dateOfBirth}
- Time of Birth: ${input.timeOfBirth}
- Birth Time Accuracy: ${input.timeAccuracy}
- Place of Birth: ${input.placeOfBirth}
- Current City of Residence: ${input.currentCity}
- Relationship Status: ${input.relationshipStatus}
- Career Field / Profession: ${input.careerField}
- Major current life concerns: ${concerns}${notes}

Today's date for transit / dasha calculations: ${new Date().toISOString().slice(0, 10)}.

────────────────────────────────────────────
STRUCTURE — 11 PARTS, EXACTLY THESE HEADINGS
────────────────────────────────────────────

For EACH part below:
1. A one-line italic teaser under the heading.
2. A "**Snapshot:**" line summarising the part in 1–2 sentences.
3. Then the sub-sections in \`###\` headings.
4. End each part with a single blockquote (\`>\`) containing the most important takeaway.

## PART 1: CORE BIRTH CHART ANALYSIS
- Open with a clear chart card using a markdown table:

| Element | Sidereal Value |
|---|---|
| Lagna (Ascendant) | … |
| Moon Sign (Rashi) | … |
| Sun Sign (Vedic) | … |
| Nakshatra | … (Pada N) |
| Current Mahadasha | … (until DD/MM/YYYY) |
| Current Antardasha | … (until DD/MM/YYYY) |

Then sub-sections:
### Lagna & Personality
### Moon Sign — Emotional Core
### Sun Sign (Sidereal) — Identity & Soul
### Nakshatra & Pada
### Planetary Placements (all 12 houses)
Use a table: \`House | Sign | Planets | Brief Meaning\`.
### Strengths and Weaknesses of Planets
### Yogas Present (only those actually formed)
### Doshas (Manglik / Kaal Sarp / Sade Sati / etc., only if present)
### Functional Benefics & Malefics for this Lagna
### Overall Life Theme

## PART 2: PAST LIFE & LIFE PATTERNS
### Karmic Themes (12th, 5th, 9th house, Rahu/Ketu axis)
### Repeating Lessons
### Childhood & Teenage Conditioning
### Past Setbacks — Why They Happened
### Past Relationship Patterns
### Past Money Patterns
### Past Career Mistakes
### Family & Inherited Karma
### What the Soul Came to Learn

## PART 3: CAREER & PROFESSIONAL LIFE
### Best-Suited Career Paths
### Job vs Business Analysis
### Government Job Possibility
### Foreign / Abroad Work Chances
### Entrepreneurship & Leadership Potential
### Fame / Public Recognition
### Career Timeline (use a table: Age Range | Phase | What to Expect)
### Major Career Turning Points
### Hidden Talents

## PART 4: MONEY & WEALTH
### Wealth Accumulation Potential
### Sudden Gains or Losses
### Investments & Property Luck
### Inheritance Possibilities
### Debt Risks & Discipline
### Best Earning Periods (table: Age Range | Why)
### Long-Term Wealth Stability

## PART 5: LOVE LIFE & RELATIONSHIPS
### Love vs Arranged Marriage Indication
### Timing of Serious Relationships
### Breakup Patterns (if visible)
### Emotional Compatibility Style
### Type of Partner Likely to Come
### Strengths & Weaknesses in Love
### Marriage Timing (give a clear age range)
### Delays / Obstacles
### Karmic Lessons in Love

## PART 6: MARRIAGE & SPOUSE
### Nature & Personality of Future / Current Spouse
### Likely Profession of Spouse
### Married Life Quality
### Spouse's Family Influence
### Compatibility & Stability
### Best Window for Marriage
### Red Flags to Avoid

## PART 7: HEALTH & WELL-BEING
### Physical Constitution
### Chronic Risks (only if indicated)
### Mental Health & Emotional Patterns
### Stress / Anxiety Tendencies
### Reproductive / Hormonal Health (mention with sensitivity)
### Lifestyle Corrections
### Sensitive Age Periods
### Preventive Remedies

## PART 8: FAMILY & PERSONAL LIFE
### Father (Sun) & Mother (Moon)
### Sibling Relationships
### Children Prospects (5th house)
### Family Karma Patterns
### Inner Emotional Life
### Spiritual Growth Potential

## PART 9: FUTURE TIMELINE & YEAR-WISE PREDICTIONS
### Current & Upcoming Dasha (table: Period | From | To | Theme)
### Next 1 Year — Quick Read
### Next 3 Years — Major Themes
### Next 5 Years — Big Picture
### Lucky vs Caution Phases (table: Period | Status | Why)

### 2026 Forecast
- Career
- Love & Relationships
- Marriage
- Money
- Health
- Travel / Relocation
- Personal Transformation
- Biggest Opportunity
- Biggest Caution

### 2027 Forecast
- Career
- Money
- Relationship Stability
- Marriage / Family
- Health & Emotional Well-Being
- Karmic Lessons
- New Beginnings or Endings
- Best Months
- Difficult Months

## PART 10: REMEDIES
Only what is genuinely relevant for this chart. Format as:

| Remedy | What & How | Why (planet / house) |
|---|---|---|

Sub-sections to consider (skip if not relevant):
### Mantras (deity / planet, count, day)
### Gemstones (and explicitly say if NOT suitable)
### Donation / Daan
### Fasting (with weekday and reason)
### Temple / Worship
### Spiritual & Lifestyle Practices

## PART 11: FINAL LIFE GUIDANCE
### Biggest Life Lesson from the Chart
### What to Avoid
### What to Pursue Strongly
### Destiny Strengths
### Core Karmic Purpose
### Honest Closing Prediction (no sugar-coating)

────────────────────────────────────────────
FINAL REMINDERS
────────────────────────────────────────────
- Sun sign MUST match the sidereal date table in the system instructions. Double-check before writing.
- Be specific, not generic. Tie predictions to the seeker's stated career field, relationship status, and concerns (${concerns}).
- Connect past → present → future as a single arc.
- Begin with a brief 2–3 sentence personal greeting using the seeker's first name. NO preamble like "Here is your reading". Then go straight into \`## PART 1\`.`;
}

router.post("/generate", async (req: Request, res: Response) => {
  const parsed = schemas.GenerateKundaliBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    });
    return;
  }

  const input = parsed.data;

  try {
    await db.insert(kundaliSubmissions).values({
      fullName: input.fullName,
      gender: input.gender,
      dateOfBirth: input.dateOfBirth,
      timeOfBirth: input.timeOfBirth,
      timeAccuracy: input.timeAccuracy,
      placeOfBirth: input.placeOfBirth,
      currentCity: input.currentCity,
      relationshipStatus: input.relationshipStatus,
      careerField: input.careerField,
      concerns: input.concerns,
      additionalNotes: input.additionalNotes ?? null,
    });
  } catch (err) {
    req.log?.error({ err }, "Failed to save kundali submission");
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  let clientClosed = false;
  req.on("close", () => {
    clientClosed = true;
  });

  let chart: VedicChart;
  try {
    chart = await computeVedicChart({
      dateOfBirth: input.dateOfBirth,
      timeOfBirth: input.timeOfBirth,
      timeAccuracy: input.timeAccuracy,
      placeOfBirth: input.placeOfBirth,
    });
  } catch (err) {
    req.log?.error({ err }, "Failed to compute vedic chart");
    res.write(
      `data: ${JSON.stringify({
        error:
          "Could not compute the chart from those birth details. Please double-check the date, time, and place.",
      })}\n\n`,
    );
    res.end();
    return;
  }

  try {
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserPrompt(input, chart),
        },
      ],
    });

    for await (const event of stream) {
      if (clientClosed) break;
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }

    if (!clientClosed) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  } catch (err) {
    req.log?.error({ err }, "Failed to generate kundali reading");
    if (!clientClosed) {
      res.write(
        `data: ${JSON.stringify({
          error:
            "The cosmos is silent at this moment. Please try again in a few seconds.",
        })}\n\n`,
      );
      res.end();
    }
  }
});

export default router;
