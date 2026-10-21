import { ListPayload } from '../types';

const CACHE_KEY = 'spelling_bee_margin_sentences_v3';

// Clean up legacy sentence caches from earlier revisions
try {
  const legacyKeys = [
    'spelling_bee_silly_sentences_v1',
    'spelling_bee_margin_sentences_v1',
    'spelling_bee_margin_sentences_v2',
  ];
  legacyKeys.forEach((key) => {
    localStorage.removeItem(key);
  });
} catch {}

// Curated sentences set in "The Margin of the Map" with Barnaby, Madame Mumble, and The Auditor.
// Every sentence is structured to make the definition, part of speech, and homophones (e.g. knight vs night) completely unambiguous.
const PRESET_MARGIN_SENTENCES: Record<string, string> = {
  // Sample Set: Silent Letter Traps
  knight: 'A courageous knight in shining metal armor rode past Barnaby to rescue a dragon erased from the map.',
  subtle: 'The Auditor paused, his monocle shimmering, and noted that Madame Mumble\'s attempt to hide her secret-tasting jar was far too subtle to fool a detective snail.',
  doubt: 'Madame Mumble had no doubt in her mind that the plum-colored storm clouds would bring a heavy rain of buttons.',
  rhythm: 'The confused librarian tapped her foot to the steady musical rhythm of ticking backward clocks.',
  island: 'Out past the edge of the parchment, Barnaby sailed to an uncharted island surrounded by a stormy sea of purple ink.',
  autumn: 'In The Margin, the crisp autumn season turned the bruised sky golden as dried leaves drifted from deleted trees.',
  column: 'The Auditor rested against a tall marble column that supported the grand archway of the city hall.',
  gnome: 'A bearded garden gnome wearing a pointed red cap explained to Barnaby that reality had rejected him.',
  wrestle: 'Madame Mumble had to wrestle with her heavy wooden steamer trunk to shut the brass latch before catching the train.',
  receipt: 'The storekeeper handed Barnaby an official paper receipt showing he had paid three shiny buttons for his lunch.',
  knuckle: 'Barnaby scraped his middle knuckle against the rough stone wall while reaching into a narrow cranny.',
  whistle: 'The train conductor blew a loud brass whistle to warn passengers that the locomotive was departing.',

  // Sample Set: Grade 5 Champions
  accommodate: 'The innkeeper built an extra story onto the boarding house to accommodate the influx of forgotten travelers.',
  camouflage: 'The speckled moth used natural camouflage to blend invisibly against the lichen-covered bark of the willow tree.',
  mischievous: 'A mischievous puppy darted through the town square, snatching gloves and untying everyone\'s shoelaces.',
  restaurant: 'We reserved a cozy corner table at the Italian restaurant to enjoy hot bowls of minestrone and garlic bread.',
  embarrass: 'The Auditor smoothed his tuxedo lapels, terrified that spilling pumpkin soup might embarrass him before the dignitaries.',
  guarantee: 'The clockmaker could not guarantee that the antique pendulum would keep accurate time during a thunderstorm.',
  cemetery: 'Carved stone headstones stood silently in the ancient cemetery beneath the weeping willow trees.',
  definitely: 'The dark thunderclouds rolling over the mountain ridge definitely signaled that a blizzard was approaching.',
  neighbor: 'Our friendly next-door neighbor dropped by to borrow a cup of sugar and share freshly baked muffins.',
  foreign: 'The diplomat needed a skilled translator because the official treaty was written in a foreign language.',
  curiosity: 'Driven by intense scientific curiosity, the astronomer peered through her brass telescope at the new comet.',
  calendar: 'The teacher hung a colorful twelve-month calendar on the classroom wall to mark important holidays.',

  // Sample Set: Double Trouble
  occurrence: 'Witnessing three shooting stars in a single evening was a rare and wondrous occurrence.',
  recommend: 'The head chef did not recommend substituting salt for sugar in the strawberry shortcake recipe.',
  committee: 'The school fundraising committee voted unanimously to spend the donation on new library books.',
  necessary: 'Barnaby inspected the strange invention and politely noted, "A steam-powered hat-tipper is charming, but it is not strictly necessary for our journey."',
  parallel: 'The steel train tracks ran in two straight, parallel lines across the prairie without ever intersecting.',
  accessible: 'The mountain summit was only accessible by hiking along a steep and rocky dirt path.',
  aggressive: 'The mother bear became fiercely aggressive when the hikers strayed too close to her newborn cubs.',
  millennium: 'Historians celebrated the passage of a full millennium since the founding of the ancient stone castle.',
  possession: 'The museum was in legal possession of a rare gold coin minted during the reign of Julius Caesar.',
  disappoint: 'The circus acrobats trained diligently every morning so they would never disappoint their audience.',

  // Sample Set: Everyday Essentials
  separate: 'The rancher built a sturdy wooden fence to separate the sheep from the cattle in the pasture.',
  february: 'The shortest month of the winter calendar is February, which usually has only twenty-eight days.',
  wednesday: 'Our school cafeteria serves hot macaroni and cheese every Wednesday at noon.',
  tomorrow: 'If the weather clears tomorrow morning, we will pack a picnic and hike up to the waterfall.',
  surprise: 'The birthday party was a complete surprise because her friends kept the secret hidden for weeks.',
  believe: 'It was difficult to believe that the tiny green caterpillar would transform into a majestic monarch butterfly.',
  receive: 'Did you receive the handwritten birthday card that your grandmother mailed from overseas?',
  bizarre: 'Wearing winter earmuffs and heavy snow boots on a scorching summer beach seemed like bizarre behavior.',
  jewelry: 'The duchess kept her sparkling diamond necklace and emerald earrings locked inside a velvet jewelry box.',
  license: 'Before you are legally permitted to drive a car on public roads, you must pass a test to earn a driver\'s license.',
  bicycle: 'Barnaby carefully rode his two-wheeled bicycle down the winding cobblestone path to deliver a package.',
};

export function getFallbackSillySentence(word: string): string {
  const clean = word.toLowerCase().trim();
  if (PRESET_MARGIN_SENTENCES[clean]) {
    return PRESET_MARGIN_SENTENCES[clean];
  }

  const templates = [
    `Barnaby politely stepped aside as a very peculiar ${clean} drifted down from the plum sky of The Margin.`,
    `Madame Mumble unspooled three inches of grey yarn to tell Barnaby all about the remarkable ${clean} she had discovered.`,
    `The Auditor adjusted his miniature monocle and inspected the ${clean} closely before granting an official permit.`,
    `The confused librarian of The Margin consulted an ancient dictionary to find out where the ${clean} belonged.`,
    `Barnaby carefully placed the ${clean} into one of his coat's thousand pockets so it would never be lost again.`,
    `Under the iridescent button rain, Madame Mumble explained how a single ${clean} had brightened the entire city of The Margin.`,
  ];

  let sum = 0;
  for (let i = 0; i < clean.length; i++) {
    sum += clean.charCodeAt(i);
  }
  return templates[sum % templates.length];
}

export function getCachedSentences(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCachedSentences(newEntries: Record<string, string>): void {
  try {
    const current = getCachedSentences();
    const updated = { ...current, ...newEntries };
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save sentences to localStorage:', err);
  }
}

export function clearSentenceCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {}
}

export function getEffectiveSentence(word: string, customMap?: Record<string, string>): string {
  if (!word) return '';
  const key = word.toLowerCase().trim();
  if (customMap && customMap[key]) {
    return customMap[key];
  }
  const cached = getCachedSentences();
  if (cached[key]) {
    return cached[key];
  }
  return getFallbackSillySentence(word);
}

export async function fetchSillySentencesForWords(words: string[]): Promise<Record<string, string>> {
  const cached = getCachedSentences();
  const missing = words.filter(w => !cached[w.toLowerCase().trim()]);

  if (missing.length === 0) {
    return cached;
  }

  try {
    const res = await fetch('/api/sentences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words: missing }),
    });

    const data = await res.json();
    if (data.sentences) {
      saveCachedSentences(data.sentences);
      return { ...cached, ...data.sentences };
    }
  } catch (err) {
    console.warn('Failed to fetch silly sentences:', err);
  }

  return cached;
}
