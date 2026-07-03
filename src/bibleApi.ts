// ─── Bible API (bible.helloao.org) ────────────────────────────────────────────
const API_BASE = 'https://bible.helloao.org/api';

// NIV is copyrighted and not freely available. BSB is the closest modern accurate
// freely-licensed translation and is used as the English default.
export const DEFAULT_TRANSLATION = 'BSB';

// ─── Translation registry ──────────────────────────────────────────────────────
export const BIBLE_TRANSLATIONS = [
  { id: 'BSB',      name: 'Berean Standard Bible (BSB) – English default', lang: 'en' },
  { id: 'ENGWEBP',  name: 'World English Bible (WEB)',                      lang: 'en' },
  { id: 'HINIRV',   name: 'Hindi IRV (हिंदी)',                              lang: 'hi' },
  { id: 'tel_irv',  name: 'Telugu IRV (తెలుగు)',                            lang: 'te' },
  { id: 'tam_irv',  name: 'Tamil IRV (தமிழ்)',                              lang: 'ta' },
  { id: 'kan_irv',  name: 'Kannada IRV (ಕನ್ನಡ)',                           lang: 'kn' },
];

// Language → preferred translation ID
export const LANG_TRANSLATION: Record<string, string> = {
  en: 'BSB',
  hi: 'HINIRV',
  te: 'tel_irv',
  ta: 'tam_irv',
  kn: 'kan_irv',
};

// ─── Book name → API code ──────────────────────────────────────────────────────
const BOOK_CODES: Record<string, string> = {
  genesis:'GEN', gen:'GEN', exodus:'EXO', exo:'EXO', ex:'EXO',
  leviticus:'LEV', lev:'LEV', numbers:'NUM', num:'NUM',
  deuteronomy:'DEU', deu:'DEU', deut:'DEU', joshua:'JOS', josh:'JOS', jos:'JOS',
  judges:'JDG', judg:'JDG', jdg:'JDG', ruth:'RUT', rut:'RUT',
  '1samuel':'1SA','1sa':'1SA','1sam':'1SA','2samuel':'2SA','2sa':'2SA','2sam':'2SA',
  '1kings':'1KI','1ki':'1KI','1kgs':'1KI','2kings':'2KI','2ki':'2KI','2kgs':'2KI',
  '1chronicles':'1CH','1ch':'1CH','1chr':'1CH','2chronicles':'2CH','2ch':'2CH','2chr':'2CH',
  ezra:'EZR', ezr:'EZR', nehemiah:'NEH', neh:'NEH', esther:'EST', est:'EST',
  job:'JOB', psalms:'PSA', psalm:'PSA', ps:'PSA', psa:'PSA',
  proverbs:'PRO', prov:'PRO', pro:'PRO', ecclesiastes:'ECC', ecc:'ECC', eccl:'ECC',
  'songofsolomon':'SNG','songofsongs':'SNG', song:'SNG', sos:'SNG', sng:'SNG',
  isaiah:'ISA', isa:'ISA', jeremiah:'JER', jer:'JER',
  lamentations:'LAM', lam:'LAM', ezekiel:'EZK', ezek:'EZK', ezk:'EZK',
  daniel:'DAN', dan:'DAN', hosea:'HOS', hos:'HOS', joel:'JOL', jol:'JOL',
  amos:'AMO', amo:'AMO', obadiah:'OBA', oba:'OBA', jonah:'JON', jon:'JON',
  micah:'MIC', mic:'MIC', nahum:'NAM', nah:'NAM', nam:'NAM',
  habakkuk:'HAB', hab:'HAB', zephaniah:'ZEP', zeph:'ZEP', zep:'ZEP',
  haggai:'HAG', hag:'HAG', zechariah:'ZEC', zech:'ZEC', zec:'ZEC',
  malachi:'MAL', mal:'MAL',
  matthew:'MAT', matt:'MAT', mat:'MAT', mark:'MRK', mrk:'MRK', mk:'MRK',
  luke:'LUK', luk:'LUK', lk:'LUK', john:'JHN', jhn:'JHN', jn:'JHN',
  acts:'ACT', act:'ACT', romans:'ROM', rom:'ROM',
  '1corinthians':'1CO','1cor':'1CO','1co':'1CO','2corinthians':'2CO','2cor':'2CO','2co':'2CO',
  galatians:'GAL', gal:'GAL', ephesians:'EPH', eph:'EPH',
  philippians:'PHP', phil:'PHP', php:'PHP', colossians:'COL', col:'COL',
  '1thessalonians':'1TH','1thess':'1TH','1th':'1TH','2thessalonians':'2TH','2thess':'2TH','2th':'2TH',
  '1timothy':'1TI','1tim':'1TI','1ti':'1TI','2timothy':'2TI','2tim':'2TI','2ti':'2TI',
  titus:'TIT', tit:'TIT', philemon:'PHM', phlm:'PHM', phm:'PHM',
  hebrews:'HEB', heb:'HEB', james:'JAS', jas:'JAS',
  '1peter':'1PE','1pet':'1PE','1pe':'1PE','2peter':'2PE','2pet':'2PE','2pe':'2PE',
  '1john':'1JN','1jn':'1JN','2john':'2JN','2jn':'2JN','3john':'3JN','3jn':'3JN',
  jude:'JUD', jud:'JUD', revelation:'REV', rev:'REV',
};

// ─── Reference parser ──────────────────────────────────────────────────────────
export interface ParsedRef { book: string; chapter: number; verse: number; displayRef: string; }

export function parseReference(ref: string): ParsedRef | null {
  const clean = ref.trim();
  const match = clean.match(/^(\d?\s*[a-zA-Z]+)\s+(\d+)\s*:\s*(\d+)$/);
  if (!match) return null;
  const bookRaw = match[1].replace(/\s+/g, '').toLowerCase();
  const chapter = parseInt(match[2], 10);
  const verse   = parseInt(match[3], 10);
  const code = BOOK_CODES[bookRaw];
  if (!code) return null;
  return { book: code, chapter, verse, displayRef: clean };
}

// ─── Single verse fetch ────────────────────────────────────────────────────────
export interface FetchedVerse { text: string; reference: string; translation: string; }

export async function fetchVerse(
  ref: string,
  translation = DEFAULT_TRANSLATION
): Promise<FetchedVerse | { error: string }> {
  const parsed = parseReference(ref);
  if (!parsed) return { error: `Cannot parse "${ref}". Use format: John 3:16` };
  try {
    const url = `${API_BASE}/${translation}/${parsed.book}/${parsed.chapter}.json`;
    const res = await fetch(url);
    if (!res.ok) return { error: `Not found: ${translation} ${parsed.book} ${parsed.chapter}` };
    const data = await res.json();
    const content = data?.chapter?.content;
    if (!content) return { error: 'Invalid API response' };
    const verseItem = content.find((item: any) => item.type === 'verse' && item.number === parsed.verse);
    if (!verseItem) return { error: `Verse ${parsed.verse} not found` };
    const text = verseItem.content
      .filter((c: any) => typeof c === 'string')
      .join(' ').trim().replace(/\s{2,}/g, ' ');
    return { text, reference: `${data.book.commonName} ${parsed.chapter}:${parsed.verse}`, translation };
  } catch {
    return { error: 'Network error — could not reach Bible API' };
  }
}

// ─── Multi-language fetch (all 5 languages in parallel) ───────────────────────
export interface MultiLangResult {
  en?: string; hi?: string; te?: string; ta?: string; kn?: string;
  reference: string; // English reference (e.g. "John 3:16")
  errors: Record<string, string>;
}

export async function fetchVerseMultiLang(ref: string): Promise<MultiLangResult | { error: string }> {
  const parsed = parseReference(ref);
  if (!parsed) return { error: `Cannot parse "${ref}". Use format: John 3:16` };

  const langs: Array<{ lang: string; trId: string }> = [
    { lang: 'en', trId: 'BSB' },
    { lang: 'hi', trId: 'HINIRV' },
    { lang: 'te', trId: 'tel_irv' },
    { lang: 'ta', trId: 'tam_irv' },
    { lang: 'kn', trId: 'kan_irv' },
  ];

  const results = await Promise.all(
    langs.map(({ lang, trId }) =>
      fetchVerse(ref, trId).then(r => ({ lang, result: r }))
    )
  );

  const enResult = results.find(r => r.lang === 'en')?.result;
  if (!enResult || 'error' in enResult) {
    return { error: (enResult as any)?.error || 'Could not fetch English verse' };
  }

  const out: MultiLangResult = { reference: enResult.reference, errors: {} };
  for (const { lang, result } of results) {
    if ('error' in result) {
      out.errors[lang] = result.error;
    } else {
      (out as any)[lang] = result.text;
    }
  }
  return out;
}
