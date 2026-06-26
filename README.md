# SpeakUp — AI Public Speaking Coach

> Overcome stammering, filler words, and poor eye contact with AI-powered video analysis.

![SpeakUp](https://img.shields.io/badge/AI-Groq%20LLaMA%203.3-7c3aed?style=flat-square) ![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react) ![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite)

## What it does

SpeakUp records you speaking on a randomly assigned topic and gives you a detailed AI-powered report on:

- **Filler words** — counts "um", "uh", "like", "you know" etc. with breakdown
- **Speaking pace** — words per minute vs. ideal range (130–150 wpm)
- **Stammering** — detects repeated words and syllable repetitions
- **Eye contact** — real-time face landmark detection via MediaPipe
- **Pronunciation clarity** — scored by AI analysis of transcript coherence
- **Confidence score** — holistic score combining all metrics
- **Progress tracking** — charts showing improvement across sessions

## User flow

1. **Pick a niche** — Tech, Business, Motivational, Storytelling, or Educational
2. **Topic lottery** — slot machine animation randomly assigns one of 50 topics
3. **Prep timer** — 60-second countdown with coaching tips
4. **Record** — 30 second minimum, 2 minute maximum in-browser session
5. **AI analysis** — Groq LLaMA 3.3 analyzes your transcript
6. **Score report** — animated report card with specific improvement tips

## Tech stack

| Layer | Tool |
|---|---|
| Frontend | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 |
| AI Analysis | [Groq API](https://console.groq.com) — LLaMA 3.3 70B (free) |
| Eye Contact | MediaPipe FaceLandmarker |
| Transcription | Web Speech API |
| Charts | Recharts |
| Storage | localStorage |

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/Niharika-Pandey/SpeakUp.git
cd SpeakUp
npm install
```

### 2. Get a free Groq API key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (free, no credit card needed)
3. Navigate to **API Keys** → **Create key**
4. Copy the key (starts with `gsk_...`)

### 3. Run the app

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and click **"Set API key"** in the bottom-right corner to paste your Groq key.

## Privacy

- Video recordings **never leave your device**
- Only the **text transcript** is sent to Groq for analysis
- Session history is stored in **browser localStorage only**
- API key is stored in **browser localStorage only**

## License

MIT
