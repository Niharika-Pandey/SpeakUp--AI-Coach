// Groq API — Free tier, no credit card required
// Get your free key at: https://console.groq.com
// Limits: 14,400 req/day, 6,000 tokens/min on free tier

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are an expert speech coach and linguist. Analyze speech transcripts and return ONLY a valid JSON object — no markdown, no explanation, no preamble.

Return exactly this JSON schema:
{
  "filler_count": <integer>,
  "filler_words": [{"word": "<string>", "count": <integer>}],
  "pace_wpm": <integer>,
  "stammer_instances": [{"text": "<string>", "context": "<string>"}],
  "pronunciation_score": <0-100>,
  "eye_contact_score": <0-100>,
  "pauses_score": <0-100>,
  "confidence_score": <0-100>,
  "top_3_improvements": ["<string>", "<string>", "<string>"],
  "encouragement_message": "<string>",
  "strengths": ["<string>", "<string>"]
}

Rules:
- filler_words: only count um, uh, like, you know, basically, literally, actually, right, so, well, I mean, kind of, sort of
- pace_wpm: calculate from word_count / (duration_seconds / 60). Ideal speech pace is 130–150 wpm
- stammer_instances: look for repeated words ("the the"), syllable repetitions ("b-because")
- pronunciation_score: estimate from sentence coherence, completeness, vocabulary appropriateness
- pauses_score: 100 = perfect pause rhythm, deduct for excessive "..." or abrupt stops
- confidence_score: holistic score combining all factors
- top_3_improvements: be very specific and actionable (e.g. "Replace 'um' with a 1-second silent pause — it reads as more authoritative")
- encouragement_message: 1–2 sentences, warm, specific to what they said
- strengths: 2 genuine things they did well`;

export async function analyzeTranscript({ transcript, duration, wordCount, eyeContactScore, topic, niche, apiKey }) {
  const key = apiKey || localStorage.getItem('speakup_api_key') || import.meta.env.VITE_GROQ_API_KEY;

  if (!key) {
    throw new Error('No API key set. Click the key icon to add your free Groq API key.');
  }

  if (!transcript || transcript.trim().length < 10) {
    throw new Error('Speech transcript is too short. Please speak for at least 30 seconds.');
  }

  const durationMinutes = duration / 60;
  const calculatedWpm = Math.round(wordCount / Math.max(durationMinutes, 0.1));

  const userMessage = `Analyze this speech:

Topic: "${topic}"
Niche: ${niche}
Duration: ${Math.round(duration)} seconds
Word count: ${wordCount}
Calculated pace: ${calculatedWpm} wpm
Eye contact score (from face detection): ${eyeContactScore ?? 75}/100

Transcript:
"${transcript}"

Return JSON only.`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1200,
      temperature: 0.3,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error?.message || `API error ${response.status}`;
    if (response.status === 401) throw new Error('Invalid API key. Check your Groq key at console.groq.com');
    if (response.status === 429) throw new Error('Rate limit hit. Wait a moment and try again (free tier limit).');
    throw new Error(msg);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content || '';

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Unexpected response format. Please try again.');

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (eyeContactScore !== null && eyeContactScore !== undefined) {
      parsed.eye_contact_score = eyeContactScore;
    }
    return parsed;
  } catch {
    throw new Error('Could not parse analysis response. Please try again.');
  }
}
