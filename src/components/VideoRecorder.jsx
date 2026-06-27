import { useRef, useEffect, useState, useCallback } from 'react';
import { useMediaRecorder } from '../hooks/useMediaRecorder';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useFaceMesh } from '../hooks/useFaceMesh';

const MAX = 120, MIN = 30;
function fmt(s) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

export default function VideoRecorder({ topic, niche, onComplete }) {
  const videoRef = useRef(null);
  const autoStopRef = useRef(null);
  const minTimerRef = useRef(null);

  // perm → preview → recording → stopping
  const [phase, setPhase] = useState('perm');
  const [canStop, setCanStop] = useState(false);

  const {
    requestCamera, attachToVideo, startRecording, stopRecording, stopCamera,
    isRecording, videoBlob, videoUrl, error, elapsedSeconds, permState,
  } = useMediaRecorder();

  const {
    transcript, interimTranscript, wordCount,
    isSupported: srOk, start: startSR, stop: stopSR,
  } = useSpeechRecognition();

  const {
    initialize, startTracking, stopTracking,
    eyeContactLive, eyeContactScore, isReady: fmReady,
  } = useFaceMesh();

  useEffect(() => { initialize(); }, [initialize]);

  // Step A: user taps "Allow" — request camera (no video element needed)
  const handleRequestCamera = useCallback(async () => {
    try {
      await requestCamera();
      // Stream is now in streamRef. Change phase so video element renders.
      setPhase('preview');
    } catch {
      // error is already set in hook state
    }
  }, [requestCamera]);

  // Step B: once phase becomes 'preview', video element is now in the DOM & visible.
  // NOW attach the stream so play() works on mobile.
  useEffect(() => {
    if (phase === 'preview' && videoRef.current) {
      attachToVideo(videoRef.current);
    }
  }, [phase, attachToVideo]);

  // Step C: start recording
  const handleStartRecording = useCallback(() => {
    startRecording();
    startSR();
    setPhase('recording');
    setCanStop(false);
    minTimerRef.current = setTimeout(() => setCanStop(true), MIN * 1000);
    autoStopRef.current = setTimeout(() => handleStop(), MAX * 1000);
  }, [startRecording, startSR]);

  // Step D: stop
  const handleStop = useCallback(() => {
    if (minTimerRef.current) clearTimeout(minTimerRef.current);
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    setPhase('stopping');
    stopRecording();
    stopSR();
    stopTracking();
  }, [stopRecording, stopSR, stopTracking]);

  // Start FaceMesh when recording begins
  useEffect(() => {
    if (fmReady && phase === 'recording' && videoRef.current) {
      startTracking(videoRef.current);
    }
  }, [fmReady, phase, startTracking]);

  // Blob ready → send results
  useEffect(() => {
    if (videoBlob && phase === 'stopping') {
      stopCamera();
      onComplete({ videoBlob, videoUrl, transcript, wordCount, duration: elapsedSeconds, eyeContactScore });
    }
  }, [videoBlob]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera(); stopSR(); stopTracking();
      if (minTimerRef.current) clearTimeout(minTimerRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
    };
  }, []);

  const circ = 2 * Math.PI * 16;
  const ringOffset = circ - (elapsedSeconds / MAX) * circ;

  // ── PERMISSION GATE ──────────────────────────────────────────────────────
  if (phase === 'perm') {
    return (
      <div className="container-sm page-top" style={{ textAlign: 'center' }}>
        <div className="step-pill anim-fade-up" style={{ marginBottom: '1.5rem' }}>
          Step 4 of 6 · Camera setup
        </div>

        <div style={{
          width: 64, height: 64, borderRadius: 18, margin: '0 auto 1.5rem',
          background: 'var(--ink-700)', border: '1px solid var(--ink-600)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--ink-300)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 9a3 3 0 0 1 3-3h3.5l2-2.5h9l2 2.5H23a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V9z" />
            <circle cx="14" cy="15" r="4" />
          </svg>
        </div>

        <h2 className="anim-fade-up d1" style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Camera access needed
        </h2>
        <p className="anim-fade-up d2" style={{ color: 'var(--ink-300)', fontSize: '0.88rem', lineHeight: 1.7, maxWidth: 340, margin: '0 auto 1.75rem' }}>
          Your video stays on your device. Only the text transcript is sent for AI analysis.
        </p>

        {error && (
          <div className="anim-fade-up" style={{
            background: 'rgba(225,29,72,0.06)', border: '1px solid rgba(225,29,72,0.2)',
            borderRadius: 10, padding: '0.9rem 1.1rem', marginBottom: '1.25rem',
            fontSize: '0.82rem', color: 'var(--rose)', lineHeight: 1.7, textAlign: 'left',
          }}>
            <strong>Could not access camera:</strong><br />{error}
          </div>
        )}

        <button
          className="btn btn-primary btn-lg anim-fade-up d3"
          onClick={handleRequestCamera}
          disabled={permState === 'requesting'}
          id="allow-camera-btn"
          style={{ opacity: permState === 'requesting' ? 0.65 : 1 }}
        >
          {permState === 'requesting' ? 'Waiting for permission...' : error ? 'Try again' : 'Allow camera and microphone'}
        </button>

        {/* Mobile tips */}
        <div className="anim-fade-up d4" style={{
          marginTop: '1.75rem', padding: '1rem 1.25rem',
          background: 'var(--ink-800)', border: '1px solid var(--ink-600)',
          borderRadius: 12, textAlign: 'left',
        }}>
          <div className="label" style={{ marginBottom: '0.6rem' }}>If permission is denied</div>
          {[
            'On Android Chrome: tap the lock icon in the address bar → Permissions → Allow Camera and Microphone',
            'On iPhone Safari: go to Settings → Safari → Camera & Microphone → Allow',
            'Then come back and tap Try again',
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: i < 2 ? '0.4rem' : 0 }}>
              <span style={{ color: 'var(--violet-xl)', fontSize: '0.7rem', flexShrink: 0, marginTop: '0.05rem' }}>{i + 1}.</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--ink-300)', lineHeight: 1.6 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── PREVIEW / RECORDING ──────────────────────────────────────────────────
  return (
    <div className="container page-top">
      <div className="step-pill anim-fade-up" style={{ marginBottom: '1.25rem' }}>
        Step 4 of 6 · {phase === 'preview' ? 'Ready to record' : 'Recording'}
      </div>
      <h1 className="anim-fade-up d1" style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.4rem)', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--ink-100)' }}>
        {topic}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 240px', gap: '0.875rem', alignItems: 'start' }}>

        {/* Video pane — only rendered after permission granted, so play() works on mobile */}
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000', aspectRatio: '16/9' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: 'scaleX(-1)' }}
          />

          {/* REC overlay */}
          {phase === 'recording' && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '0.6rem 0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <div className="rec-indicator" />
                <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em' }}>REC</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <svg width={34} height={34} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx={17} cy={17} r={15} strokeWidth={2.5} fill="none" stroke="rgba(255,255,255,0.15)" />
                  <circle cx={17} cy={17} r={15} strokeWidth={2.5} fill="none"
                    stroke={elapsedSeconds >= 60 ? 'var(--rose)' : 'var(--violet-xl)'}
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 15}
                    strokeDashoffset={2 * Math.PI * 15 - (elapsedSeconds / MAX) * 2 * Math.PI * 15}
                    style={{ transition: 'stroke-dashoffset 1s linear' }} />
                </svg>
                <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>
                  {fmt(elapsedSeconds)}
                </span>
              </div>
            </div>
          )}

          {/* Eye contact pill */}
          {fmReady && phase === 'recording' && (
            <div style={{ position: 'absolute', bottom: '0.65rem', left: '0.65rem', padding: '0.25rem 0.6rem', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700, color: '#fff', background: eyeContactLive ? 'rgba(5,150,105,0.85)' : 'rgba(225,29,72,0.85)', backdropFilter: 'blur(6px)', transition: 'background 0.3s' }}>
              {eyeContactLive ? 'Eye contact ✓' : 'Look at camera'}
            </div>
          )}

          {phase === 'preview' && (
            <div style={{ position: 'absolute', bottom: '0.65rem', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
              <div style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', borderRadius: 7, padding: '0.3rem 0.7rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)' }}>
                Preview — tap Start recording when ready
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>

          {phase === 'preview' && (
            <>
              <button className="btn btn-primary" onClick={handleStartRecording} style={{ width: '100%', padding: '0.75rem' }}>
                Start recording
              </button>
              <div className="surface" style={{ padding: '1rem 1.1rem' }}>
                <div className="label" style={{ marginBottom: '0.6rem' }}>Before you start</div>
                {['Look into the camera lens', 'Speak at an even pace', 'Pause instead of saying um', 'Aim for 60 to 120 seconds'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: i < 3 ? '0.4rem' : 0 }}>
                    <span style={{ color: 'var(--violet-xl)', fontSize: '0.7rem', marginTop: '0.05rem', flexShrink: 0 }}>→</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--ink-300)' }}>{t}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {phase === 'recording' && (
            <div className="surface" style={{ padding: '1rem 1.1rem' }}>
              <div className="label" style={{ marginBottom: '0.7rem' }}>Live stats</div>
              {[
                ['Words', wordCount],
                ['Time', fmt(elapsedSeconds)],
                ['WPM', elapsedSeconds > 5 ? Math.round(wordCount / (elapsedSeconds / 60)) : '...'],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--ink-700)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--ink-300)' }}>{l}</span>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--ink-50)', fontFamily: "'Space Grotesk',sans-serif" }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {phase === 'recording' && (
            <div className="surface" style={{ padding: '1rem 1.1rem' }}>
              <div className="label" style={{ marginBottom: '0.5rem' }}>Transcript</div>
              <div style={{ maxHeight: 110, overflowY: 'auto', fontSize: '0.75rem', color: 'var(--ink-300)', lineHeight: 1.65 }}>
                {!srOk && <em style={{ color: 'var(--ink-400)' }}>Speech recognition not supported in this browser</em>}
                {srOk && !transcript && !interimTranscript && <em style={{ color: 'var(--ink-400)' }}>Start speaking...</em>}
                <span>{transcript}</span>
                <span style={{ color: 'var(--ink-500)' }}> {interimTranscript}</span>
              </div>
            </div>
          )}

          {phase === 'recording' && !canStop && (
            <div style={{ padding: '0.65rem 0.85rem', borderRadius: 9, background: 'rgba(217,119,6,0.07)', border: '1px solid rgba(217,119,6,0.2)', fontSize: '0.76rem', color: 'var(--amber)', textAlign: 'center' }}>
              Min {MIN}s required <strong>{MIN - elapsedSeconds}s left</strong>
            </div>
          )}

          {phase === 'recording' && (
            <>
              <button
                className="btn btn-danger"
                disabled={!canStop}
                onClick={handleStop}
                style={{ width: '100%', opacity: canStop ? 1 : 0.35, cursor: canStop ? 'pointer' : 'not-allowed' }}
              >
                Stop recording
              </button>
              <p style={{ fontSize: '0.7rem', color: 'var(--ink-400)', textAlign: 'center' }}>Auto-stops at 2:00</p>
            </>
          )}

          {phase === 'stopping' && (
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-300)', textAlign: 'center', padding: '0.5rem' }}>
              Finishing up...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
