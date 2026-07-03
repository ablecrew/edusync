import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { GenerativeModel, Content, Part } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const PRIMARY_MODEL = (import.meta.env.VITE_GEMINI_MODEL as string) || 'gemini-2.0-flash-exp';
const FALLBACK_MODEL = (import.meta.env.VITE_GEMINI_MODEL_FALLBACK as string) || 'gemini-1.5-flash';

export const isGeminiConfigured = Boolean(API_KEY);

const client = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,     threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,  threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

function getModel(name: string): GenerativeModel {
  if (!client) throw new Error('Gemini API key missing. Add VITE_GEMINI_API_KEY to .env');
  return client.getGenerativeModel({ model: name, safetySettings: SAFETY });
}

export type ChatRole = 'user' | 'assistant' | 'system';
export interface AttachmentPart {
  kind: 'image' | 'text';
  mimeType?: string;
  data: string;   // base64 for images, plain text for extracted PDFs
  name?: string;
}
export interface ChatTurn {
  role: ChatRole;
  content: string;
  attachments?: AttachmentPart[];
}

/** Convert our chat turns into Gemini `Content[]` format */
function toGeminiContents(turns: ChatTurn[]): Content[] {
  return turns
    .filter(t => t.role !== 'system')
    .map(turn => {
      const parts: Part[] = [];
      if (turn.attachments) {
        for (const a of turn.attachments) {
          if (a.kind === 'image' && a.mimeType) {
            parts.push({ inlineData: { data: a.data, mimeType: a.mimeType } });
          } else if (a.kind === 'text') {
            parts.push({ text: `--- Attached document: ${a.name ?? 'file'} ---\n${a.data.slice(0, 30000)}` });
          }
        }
      }
      if (turn.content) parts.push({ text: turn.content });
      return {
        role: turn.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });
}

/** Streams tokens for real-time UI. Returns full response text. */
export async function streamChat(
  systemPrompt: string,
  turns: ChatTurn[],
  onToken: (delta: string) => void,
  opts?: { signal?: AbortSignal }
): Promise<string> {
  if (!isGeminiConfigured) {
    const msg = '⚠️ AI service isn\'t configured. Please add `VITE_GEMINI_API_KEY` to your `.env` file. Get a free key at https://aistudio.google.com/app/apikey';
    onToken(msg);
    return msg;
  }

  const tryModel = async (name: string) => {
    const model = getModel(name);
    const chat = model.startChat({
      history: toGeminiContents(turns.slice(0, -1)),
      systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    });
    const lastTurn = turns[turns.length - 1];
    const lastContents = toGeminiContents([lastTurn])[0];
    const result = await chat.sendMessageStream(lastContents.parts);

    let full = '';
    for await (const chunk of result.stream) {
      if (opts?.signal?.aborted) throw new Error('Cancelled');
      const t = chunk.text();
      if (t) { full += t; onToken(t); }
    }
    return full;
  };

  try {
    return await tryModel(PRIMARY_MODEL);
  } catch (err: any) {
    console.warn(`[gemini] primary model ${PRIMARY_MODEL} failed:`, err?.message);
    if (err?.message?.includes('quota') || err?.status === 429) {
      onToken('\n\n_(Rate limit hit — falling back to lite model…)_\n\n');
    }
    try {
      return await tryModel(FALLBACK_MODEL);
    } catch (err2: any) {
      const errMsg = `\n\n⚠️ AI is temporarily unavailable: ${err2?.message ?? 'Unknown error'}. Please try again in a moment, or use the "Contact staff" button below.`;
      onToken(errMsg);
      return errMsg;
    }
  }
}

/** Simple non-streaming call for small tasks (summaries, translations, etc.) */
export async function simpleChat(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!isGeminiConfigured) return 'AI not configured.';
  try {
    const model = getModel(PRIMARY_MODEL);
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
    });
    return result.response.text();
  } catch (err: any) {
    return `AI error: ${err?.message ?? 'Unknown'}`;
  }
}

/** Detect user language from text (Swahili vs English) — used for multi-language support */
export function detectLanguage(text: string): 'en' | 'sw' {
  const swMarkers = ['habari', 'shule', 'mtoto', 'karibu', 'asante', 'watoto', 'mwalimu', 'darasa', 'kwa', 'ada', 'sasa', 'tafadhali'];
  const lower = text.toLowerCase();
  const hits = swMarkers.filter(w => lower.includes(w)).length;
  return hits >= 2 ? 'sw' : 'en';
}