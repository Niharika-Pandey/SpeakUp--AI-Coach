import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NicheSelector from '../components/NicheSelector';
import TopicLottery from '../components/TopicLottery';
import PrepTimer from '../components/PrepTimer';
import VideoRecorder from '../components/VideoRecorder';
import AnalysisLoader from '../components/AnalysisLoader';
import ScoreReport from '../components/ScoreReport';
import { analyzeTranscript } from '../services/claudeService';
import { addSession } from '../hooks/useSessionStore';

const STEPS = { NICHE:'niche', LOTTERY:'lottery', PREP:'prep', RECORDING:'recording', ANALYZING:'analyzing', REPORT:'report' };
const STEP_ORDER = Object.values(STEPS);

export default function CoachFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.NICHE);
  const [niche, setNiche] = useState(null);
  const [topic, setTopic] = useState(null);
  const [recData, setRecData] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('speakup_api_key') || '');
  const [keyModal, setKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  const saveKey = () => {
    const k = keyInput.trim();
    localStorage.setItem('speakup_api_key', k);
    setApiKey(k);
    setKeyModal(false);
  };

  const reset = useCallback(() => {
    setStep(STEPS.NICHE); setNiche(null); setTopic(null);
    setRecData(null); setResult(null); setError(null);
  }, []);

  const handleRecordingDone = useCallback(async (data) => {
    setRecData(data);
    setStep(STEPS.ANALYZING);
    setError(null);
    try {
      const r = await analyzeTranscript({
        transcript: data.transcript || '',
        duration: data.duration,
        wordCount: data.wordCount,
        eyeContactScore: data.eyeContactScore,
        topic, niche: niche.name, apiKey,
      });
      setResult(r);
      addSession({
        niche: niche.name, topic, duration: data.duration,
        filler_count: r.filler_count || 0, filler_words: r.filler_words || [],
        pace_wpm: r.pace_wpm || 0, stammer_instances: r.stammer_instances || [],
        pronunciation_score: r.pronunciation_score || 0,
        eye_contact_score: r.eye_contact_score || 0,
        pauses_score: r.pauses_score || 0,
        confidence_score: r.confidence_score || 0,
        top_3_improvements: r.top_3_improvements || [],
        encouragement_message: r.encouragement_message || '',
        transcript_snippet: (data.transcript || '').slice(0, 200),
      });
      setStep(STEPS.REPORT);
    } catch (err) {
      setError(err.message);
      setStep(STEPS.REPORT);
    }
  }, [topic, niche, apiKey]);

  // Step index for progress dots
  const stepIdx = STEP_ORDER.indexOf(step);

  return (
    <div style={{ minHeight:'100dvh' }}>
      {/* Subtle bg */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, background:'radial-gradient(ellipse 60% 40% at 80% 10%, rgba(124,58,237,0.07), transparent)' }}/>

      {/* ── API Key modal ── */}
      {keyModal && (
        <div
          onClick={e => e.target===e.currentTarget && setKeyModal(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
        >
          <div className="surface anim-scale-in" style={{ padding:'2rem', maxWidth:420, width:'100%', borderRadius:16 }}>
            <h2 style={{ fontSize:'1.2rem', fontWeight:800, marginBottom:'0.4rem' }}>Groq API Key</h2>
            <p style={{ color:'var(--ink-300)', fontSize:'0.83rem', lineHeight:1.65, marginBottom:'1.25rem' }}>
              Groq is <strong style={{color:'var(--ink-100)'}}>completely free</strong> — no credit card needed.<br/>
              Get your key at{' '}
              <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" style={{ color:'var(--violet-xl)' }}>console.groq.com</a>
              {' '}→ API Keys → Create key.
            </p>
            <input
              id="groq-key-input"
              type="password"
              placeholder="gsk_..."
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && saveKey()}
              autoFocus
              style={{
                width:'100%', background:'var(--ink-700)', border:'1px solid var(--ink-500)',
                borderRadius:9, padding:'0.75rem 1rem', color:'var(--ink-50)',
                fontSize:'0.88rem', outline:'none', fontFamily:'monospace', marginBottom:'1rem',
              }}
            />
            <div style={{ display:'flex', gap:'0.6rem' }}>
              <button className="btn btn-primary" onClick={saveKey} style={{ flex:1 }}>Save key</button>
              <button className="btn btn-ghost" onClick={() => setKeyModal(false)}>Cancel</button>
            </div>
            <p style={{ fontSize:'0.72rem', color:'var(--ink-400)', marginTop:'0.75rem', textAlign:'center' }}>
              Stored only in your browser's localStorage.
            </p>
          </div>
        </div>
      )}

      {/* ── Error state ── */}
      {step === STEPS.REPORT && error && !result && (
        <div className="container-sm" style={{ paddingTop:'8rem', textAlign:'center' }}>
          <div style={{ fontSize:'0.95rem', color:'var(--rose)', fontWeight:700, marginBottom:'0.75rem' }}>Analysis failed</div>
          <p style={{ color:'var(--ink-300)', fontSize:'0.85rem', marginBottom:'1.5rem', lineHeight:1.7 }}>{error}</p>
          <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
            <button className="btn btn-primary" onClick={() => setKeyModal(true)}>Set API key</button>
            <button className="btn btn-ghost" onClick={reset}>Try again</button>
          </div>
        </div>
      )}

      {/* ── Main flow ── */}
      <div style={{ position:'relative', zIndex:1 }}>
        {step === STEPS.NICHE     && <NicheSelector onSelect={n => { setNiche(n); setStep(STEPS.LOTTERY); }}/>}
        {step === STEPS.LOTTERY   && niche && <TopicLottery niche={niche} onTopicSelected={t => { setTopic(t); setStep(STEPS.PREP); }}/>}
        {step === STEPS.PREP      && niche && topic && <PrepTimer topic={topic} niche={niche} onComplete={() => setStep(STEPS.RECORDING)}/>}
        {step === STEPS.RECORDING && niche && topic && <VideoRecorder topic={topic} niche={niche} onComplete={handleRecordingDone}/>}
        {step === STEPS.ANALYZING && <AnalysisLoader/>}
        {step === STEPS.REPORT    && result && <ScoreReport result={result} topic={topic} niche={niche} duration={recData?.duration||0} onNewSession={reset} onDashboard={() => navigate('/dashboard')}/>}
      </div>

      {/* ── Step progress dots ── */}
      <div style={{ position:'fixed', bottom:'1.25rem', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'4px', zIndex:100 }}>
        {STEP_ORDER.map((s, i) => (
          <div key={s} style={{
            width: i === stepIdx ? 18 : 6, height:6, borderRadius:3,
            background: i < stepIdx ? 'var(--green)' : i === stepIdx ? 'var(--violet)' : 'var(--ink-600)',
            transition:'all 0.35s cubic-bezier(.34,1.56,.64,1)',
          }}/>
        ))}
      </div>

      {/* ── Floating key button ── */}
      <button
        onClick={() => { setKeyInput(apiKey); setKeyModal(true); }}
        style={{
          position:'fixed', bottom:'1.25rem', right:'1.25rem', zIndex:50,
          background:'var(--ink-800)', border:'1px solid var(--ink-600)',
          borderRadius:8, padding:'0.4rem 0.75rem',
          fontSize:'0.72rem', fontWeight:600,
          color: apiKey ? 'var(--green)' : 'var(--ink-300)',
          cursor:'pointer',
          display:'flex', alignItems:'center', gap:'0.35rem',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="4.5" cy="4.5" r="2.5"/>
          <path d="M6.5 6.5L11 11"/>
          <path d="M9 9l1.5-1.5"/>
        </svg>
        {apiKey ? 'API key set' : 'Set API key'}
      </button>
    </div>
  );
}
