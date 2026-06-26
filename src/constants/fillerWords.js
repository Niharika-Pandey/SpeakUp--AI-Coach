// Common filler words to detect client-side
export const FILLER_WORDS = [
  'um', 'uh', 'er', 'ah', 'like', 'you know', 'basically', 'literally',
  'actually', 'honestly', 'right', 'so', 'well', 'i mean', 'kind of',
  'sort of', 'you see', 'obviously', 'clearly', 'essentially', 'generally',
  'typically', 'simply', 'just', 'okay so', 'alright', 'anyway', 'whatever',
  'totally', 'absolutely', 'definitely', 'seriously', 'really', 'very',
];

export const STAMMER_PATTERNS = [
  // Repeated words (e.g. "the the")
  /\b(\w+)\s+\1\b/gi,
  // Repeated syllables at start (e.g. "b-b-but")
  /\b(\w)\1{1,}-?\1*/gi,
];
