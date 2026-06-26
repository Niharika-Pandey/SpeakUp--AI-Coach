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

  const [phase, setPhase] = useState('perm'); // perm | preview | recording | stopping
  const [canStop, setCanStop] = useState(false);

  const {
    requestCamera, startRecording, stopRecording, stopCamera,
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

  // Step A: user clicks Allow — videoRef is always mounted so this works
  const handleRequestCamera = useCallback(async () => {
    try {
      await requestCamera(videoRef.current);
      setPhase('preview');
    } catch {
      // error shown in UI via hook state
    }
  }, [requestCamera]);

  // Step B: start recording
  const handleStartRecording = useCallback(() => {
    startRecording();
    startSR();
    setPhase('recording');
    setCanStop(false);
    minTimerRef.current = setTimeout(() => setCanStop(true), MIN * 1000);
    autoStopRef.current = setTimeout(() => handleStop(), MAX * 1000);
  }, [startRecording, startSR]);

  // Step C: stop
  const handleStop = useCallback(() => {
    if (minTimerRef.current) clearTimeout(minTimerRef.current);
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    setPhase('stopping');
    stopRecording();
    stopSR();
    stopTracking();
  }, [stopRecording, stopSR, stopTracking]);

  // Start FaceMesh when recording
  useEffect(() => {
    if (fmReady && phase === 'recording' && videoRef.current) {
      startTracking(videoRef.current);
    }
  }, [fmReady, phase, startTracking]);

  // Blob ready -> finish
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

  return (
    <div className="container page-top">
      <div className="step-pill anim-fade-up" style={{ marginBottom: '1.25rem' }}>
        Step 4 of 6 · {phase === 'perm' ? 'Camera setup' : phase === 'preview' ? 'Ready to record' : 'Recording'}
      </div>
      <h1 className="anim-fade-up d1" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.45rem)', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--ink-100)' }}>
        {topic}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 252px', gap: '1rem', alignItems: 'start' }}>

        {/* ── Video pane — always in DOM so ref is valid ── */}
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#0c0c14', aspectRatio: '16/9' }}>

          {/* The video element is ALWAYS rendered so videoRef.current is never null */}
          <video
            ref={videoRef}
            style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              transform: 'scaleX(-1)',
              // Hide during perm phase — but keep in DOM for the ref
              opacity: phase === 'perm' ? 0 : 1,
              transition: 'opacity 0.4s',
            }}
            playsInline
            muted
          />

          {/* Permission gate overlay */}
          {phase === 'perm' && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '1.5rem', textAlign: 'center',
              background: 'var(--ink-800)',
            }}>
              {/* Camera icon */}
              <div style={{
                width: 56, height: 56, borderRadius: 14, marginBottom: '1rem',
                background: 'var(--ink-700)', border: '1px solid var(--ink-600)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="var(--ink-300)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 8a3 3 0 0 1 3-3h3.5l2-2.5h5l2 2.5H21a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V8z"/>
                  <circle cx="13" cy="14" r="3.5"/>
                </svg>
              </div>

              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink-50)', marginBottom: '0.4rem' }}>
                Camera access needed
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-400)', lineHeight: 1.6, marginBottom: '1.25rem', maxWidth: 260 }}>
                Your video stays on your device. Only the transcript text is sent for analysis.
              </p>

              {error && (
                <div style={{
                  background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.2)',
                  borderRadius: 8, padding: '0.65rem 0.9rem', marginBottom: '1rem',
                  fontSize: '0.75rem', color: 'var(--rose)', lineHeight: 1.6, textAlign: 'left', width: '100%',
                }}>
                  {error}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleRequestCamera}
                disabled={permState === 'requesting'}
                style={{ opacity: permState === 'requesting' ? 0.6 : 1, fontSize: '0.88rem' }}
              >
                {permState === 'requesting' ? 'Waiting for permission...' : error ? 'Try again' : 'Allow camera and mic'}
              </button>

              {error && (
                <p style={{ marginTop: '0.85rem', fontSize: '0.72rem', color: 'var(--ink-400)', lineHeight: 1.65 }}>
                  Click the camera icon in the address bar and set to Allow, then try again.
                </p>
              )}
            </div>
          )}

          {/* Recording overlay */}
          {phase === 'recording' && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '0.6rem 0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <div className="rec-indicator" />
                <span style={{ color: '#fff', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em' }}>REC</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width={36} height={36} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx={18} cy={18} r={16} strokeWidth={3} fill="none" stroke="rgba(255,255,255,0.15)" />
                  <circle cx={18} cy={18} r={16} strokeWidth={3} fill="none"
                    stroke={elapsedSeconds >= 60 ? 'var(--rose)' : 'var(--violet-xl)'}
                    strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={ringOffset}
                    style={{ transition: 'stroke-dashoffset 1s linear' }} />
                </svg>
                <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>
                  {fmt(elapsedSeconds)}
                </span>
              </div>
            </div>
          )}

          {/* Eye contact pill */}
          {fmReady && phase === 'recording' && (
            <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', padding: '0.3rem 0.7rem', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, color: '#fff', background: eyeContactLive ? 'rgba(5,150,105,0.85)' : 'rgba(225,29,72,0.85)', backdropFilter: 'blur(6px)', transition: 'background 0.3s' }}>
              {eyeContactLive ? 'Eye contact ✓' : 'Look at camera'}
            </div>
          )}

          {/* Preview label */}
          {phase === 'preview' && (
            <div style={{ position: 'absolute', bottom: '0.75rem', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
              <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', borderRadius: 7, padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                Preview — click Start recording when ready
              </div>
            </div>
          )}
        </div>

        {/* ── Side panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {/* Perm phase tips */}
          {phase === 'perm' && (
            <div className="surface" style={{ padding: '1rem 1.1rem' }}>
              <div className="label" style={{ marginBottom: '0.6rem' }}>What to expect</div>
              {['60 to 120 second spoken session', 'Real-time eye contact tracking', 'Live transcript as you speak', 'AI analysis with a score report'].map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: i < 3 ? '0.4rem' : 0 }}>
                  <span style={{ color: 'var(--violet-xl)', fontSize: '0.72rem', marginTop: '0.05rem', flexShrink: 0 }}>→</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--ink-300)' }}>{t}</span>
                </div>
              ))}
            </div>
          )}

          {/* Preview: start button + tips */}
          {phase === 'preview' && (
            <>
              <button className="btn btn-primary" onClick={handleStartRecording} style={{ width: '100%', fontSize: '0.95rem', padding: '0.8rem' }}>
                Start recording
              </button>
              <div className="surface" style={{ padding: '1rem 1.1rem' }}>
                <div className="label" style={{ marginBottom: '0.6rem' }}>Before you start</div>
                {['Look directly into the camera lens', 'Speak at a measured, even pace', 'Use pauses instead of fillers', 'Aim for 60 to 120 seconds'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: i < 3 ? '0.4rem' : 0 }}>
                    <span style={{ color: 'var(--violet-xl)', fontSize: '0.72rem', marginTop: '0.05rem', flexShrink: 0 }}>→</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--ink-300)' }}>{t}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Recording: stats */}
          {phase === 'recording' && (
            <div className="surface" style={{ padding: '1.1rem' }}>
              <div className="label" style={{ marginBottom: '0.75rem' }}>Live stats</div>
              {[
                ['Words', wordCount],
                ['Time', fmt(elapsedSeconds)],
                ['Est. WPM', elapsedSeconds > 5 ? Math.round(wordCount / (elapsedSeconds / 60)) : '...'],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid var(--ink-700)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--ink-300)' }}>{l}</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ink-50)', fontFamily: "'Space Grotesk',sans-serif" }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Recording: transcript */}
          {phase === 'recording' && (
            <div className="surface" style={{ padding: '1.1rem' }}>
              <div className="label" style={{ marginBottom: '0.6rem' }}>Transcript</div>
              <div style={{ maxHeight: 130, overflowY: 'auto', fontSize: '0.78rem', color: 'var(--ink-300)', lineHeight: 1.65 }}>
                {!srOk && <em style={{ color: 'var(--ink-400)' }}>Speech recognition unavailable in this browser</em>}
                {srOk && !transcript && !interimTranscript && <em style={{ color: 'var(--ink-400)' }}>Start speaking...</em>}
                <span>{transcript}</span>
                <span style={{ color: 'var(--ink-500)' }}> {interimTranscript}</span>
              </div>
            </div>
          )}

          {/* Min time warning */}
          {phase === 'recording' && !canStop && (
            <div style={{ padding: '0.7rem 0.9rem', borderRadius: 9, background: 'rgba(217,119,6,0.07)', border: '1px solid rgba(217,119,6,0.2)', fontSize: '0.78rem', color: 'var(--amber)', textAlign: 'center' }}>
              Minimum {MIN}s required <strong>{MIN - elapsedSeconds}s left</strong>
            </div>
          )}

          {/* Stop button */}
          {phase === 'recording' && (
            <>
              <button
                className="btn btn-danger"
                disabled={!canStop}
                onClick={handleStop}
                style={{ width: '100%', opacity: canStop ? 1 : 0.38, cursor: canStop ? 'pointer' : 'not-allowed' }}
              >
                Stop recording
              </button>
              <p style={{ fontSize: '0.71rem', color: 'var(--ink-400)', textAlign: 'center' }}>
                Auto-stops at 2:00
              </p>
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
