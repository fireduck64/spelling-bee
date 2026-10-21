import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = geminiApiKey
  ? new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

const CURATED_SAMPLE_SENTENCES: Record<string, string> = {
  // Silent Letter Traps
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

  // Grade 5 Champions
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

  // Double Trouble
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

  // Everyday Essentials
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

// Built-in fallback silly sentence generator set in 'The Margin of the Map'
function generateFallbackSentence(word: string): string {
  const cleanWord = word.trim().toLowerCase();
  if (CURATED_SAMPLE_SENTENCES[cleanWord]) {
    return CURATED_SAMPLE_SENTENCES[cleanWord];
  }

  const sillyTemplates = [
    `Barnaby politely stepped aside as a very peculiar ${cleanWord} drifted down from the plum sky of The Margin.`,
    `Madame Mumble unspooled three inches of grey yarn to tell Barnaby all about the remarkable ${cleanWord} she had discovered.`,
    `The Auditor adjusted his miniature monocle and inspected the ${cleanWord} closely before granting an official permit.`,
    `The confused librarian of The Margin consulted an ancient dictionary to find out where the ${cleanWord} belonged.`,
    `Barnaby carefully placed the ${cleanWord} into one of his coat's thousand pockets so it would never be lost again.`,
    `Under the iridescent button rain, Madame Mumble explained how a single ${cleanWord} had brightened the entire city.`,
  ];
  const idx = Math.abs(cleanWord.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % sillyTemplates.length;
  return sillyTemplates[idx];
}

const WORLD_SEED_SYSTEM_INSTRUCTION = `You are the chronicler of "The Margin of the Map" — a whimsical, slightly existential city that exists in the blank white space around the edges of every map ever drawn.
It is a refuge for things that were deleted, forgotten, or simply didn't fit into the 'Correct' version of reality. Buildings are made of solidified sighs, old calendar pages, and the echoes of arguments. The sky is the color of a bruised plum, and it rains tiny, iridescent buttons that don't attach to anything. Laws of physics are suggestions made by a very confused librarian.

The Recurring Cast:
1. Barnaby the Bone-Collector: An impossibly tall, thin man in a coat with a thousand pockets. He collects the "bones of ideas" — skeletal remains of things people almost invented but forgot. Excruciatingly polite, speaks in almost-helpful metaphors.
2. Madame Mumble: A woman whose voice is a physical tangled ball of grey yarn. She unspools lengths to speak; when excited, words come out as confused bubbles. She is a professional "Secret-Taster" who knows if secrets are sweet or sour.
3. The Auditor: A tiny, incredibly pompous garden snail in a miniature tailored tuxedo and monocle. Believes he is the supreme ruler of The Margin, trying to tax residents in "Interesting Curiosities" (the memory of a first kiss, the sound of a falling star, a particularly good sandwich).

Rules for Example Sentences:
- Vivid & Memorable: Set the sentence in The Margin, featuring Barnaby, Madame Mumble, The Auditor, or the confused librarian.
- Contextual Clarity & Homophone Prevention: The word must be completely unambiguous from homophones, with its exact grammatical part of speech and meaning unmistakable from context.
  * BAD example: "The password for the vault was knight" (ambiguous with "night").
  * GOOD example: "A courageous knight in shining armor rode past Barnaby to rescue a dragon erased from the map."
- Natural Semantic Use: Do NOT use the word meta-linguistically (avoid phrasing like "a sign labeled [word]", "the word [word]", or "the concept of [word]"). Use the word actively in its genuine grammatical role so students immediately grasp what is being spelled.
- Concise: Keep sentences under 25 words so the announcer is easy to follow during a spelling drill.

Examples:
- "necessary": Barnaby inspected the strange invention and politely noted, "A steam-powered hat-tipper is charming, but it is not strictly necessary for our journey."
- "subtle": The Auditor paused, his monocle shimmering, and noted that Madame Mumble's attempt to hide her secret-tasting jar was far too subtle to fool a detective snail.`;

// 1. Batch silly sentences endpoint
app.post('/api/sentences', async (req, res) => {
  try {
    const { words } = req.body;
    if (!Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'Array of words is required' });
    }

    const uniqueWords = Array.from(new Set(words.map((w: string) => String(w).trim()).filter(Boolean)));

    if (!ai) {
      // Fallback if no API key configured
      const fallbackResult: Record<string, string> = {};
      uniqueWords.forEach(w => {
        fallbackResult[w.toLowerCase()] = generateFallbackSentence(w);
      });
      return res.json({ sentences: fallbackResult });
    }

    const prompt = `Generate a sentence set in The Margin of the Map for each of the following spelling words:
${uniqueWords.join(', ')}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: WORLD_SEED_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              sentence: { type: Type.STRING, description: 'Sentence set in The Margin of the Map using the word.' },
            },
            required: ['word', 'sentence'],
          },
        },
        temperature: 0.8,
      },
    });

    const rawText = response.text?.trim() || '[]';
    let parsed: Array<{ word: string; sentence: string }> = [];
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = [];
    }

    const sentencesMap: Record<string, string> = {};
    parsed.forEach(item => {
      if (item.word && item.sentence) {
        sentencesMap[item.word.toLowerCase().trim()] = item.sentence;
      }
    });

    // Ensure all requested words have a sentence even if the model omitted one
    uniqueWords.forEach(w => {
      const key = w.toLowerCase();
      if (!sentencesMap[key]) {
        sentencesMap[key] = generateFallbackSentence(w);
      }
    });

    return res.json({ sentences: sentencesMap });
  } catch (err: any) {
    console.error('Error generating sentences:', err);
    // Graceful fallback so student drill is never broken
    const { words } = req.body || {};
    const fallbackResult: Record<string, string> = {};
    if (Array.isArray(words)) {
      words.forEach((w: string) => {
        const clean = String(w).trim();
        if (clean) fallbackResult[clean.toLowerCase()] = generateFallbackSentence(clean);
      });
    }
    return res.json({ sentences: fallbackResult, fallbackUsed: true });
  }
});

import {
  getCachedAudio,
  saveCachedAudio,
  getCacheStats,
  clearAllAudioCache,
  startAudioCacheLifecycleTimer,
} from './src/server/audioCache.js';

// Cache statistics endpoint
app.get('/api/cache-stats', (_req, res) => {
  res.json(getCacheStats());
});

// Clear audio cache endpoint
app.post('/api/clear-cache', (_req, res) => {
  res.json(clearAllAudioCache());
});

// 2. Gemini TTS endpoint with On-Demand Server Caching & 2-Year Retention
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Kore' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text string is required' });
    }

    const validVoices = ['Kore', 'Puck', 'Zephyr', 'Charon', 'Fenrir'];
    const chosenVoice = validVoices.includes(voice) ? voice : 'Kore';

    // 1. Check local on-demand disk cache first (<15ms response)
    const cachedEntry = getCachedAudio(chosenVoice, text);
    if (cachedEntry) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      res.set('ETag', `"${cachedEntry.hash}"`);
      return res.json({
        audio: cachedEntry.audio,
        mimeType: cachedEntry.mimeType,
        cached: true,
      });
    }

    if (!ai) {
      return res.json({ error: 'No Gemini API key available', fallbackToWebSpeech: true });
    }

    // 2. Cache miss: generate once via Gemini TTS
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text,
              speechMetadata: {
                style: 'Clear, articulate, patient, encouraging spelling bee announcer',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice },
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    const base64Audio = part?.inlineData?.data;
    const mimeType = part?.inlineData?.mimeType || 'audio/wav';

    if (!base64Audio) {
      return res.json({ error: 'No audio returned', fallbackToWebSpeech: true });
    }

    // 3. Save to disk cache with 2-year retention lifecycle
    saveCachedAudio(chosenVoice, text, base64Audio);

    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    return res.json({
      audio: base64Audio,
      mimeType,
      cached: false,
    });
  } catch (err: any) {
    console.error('Error in TTS generation:', err);
    return res.json({
      error: err?.message || 'TTS generation error',
      fallbackToWebSpeech: true,
    });
  }
});

// Setup dev or prod serving
const port = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Spelling Bee Trainer server listening on http://0.0.0.0:${port}`);
    startAudioCacheLifecycleTimer();
  });
}

startServer();
