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

  // Set muted + playsinline via ref attributes to fix iOS React bug
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.setAttribute('playsinline', '');
      videoRef.current.setAttribute('webkit-playsinline', '');
    }
  }, []);

  // Allow camera — videoRef.current is always valid because video is always rendered
  const handleRequestCamera = useCallback(async () => {
    try {
      await requestCamera(videoRef.current);
      setPhase('preview');
    } catch {
      // error already stored in hook state
    }
  }, [requestCamera]);

  const handleStartRecording = useCallback(() => {
    startRecording();
    startSR();
    setPhase('recording');
    setCanStop(false);
    minTimerRef.current = setTimeout(() => setCanStop(true), MIN * 1000);
    autoStopRef.current = setTimeout(() => handleStop(), MAX * 1000);
  }, [startRecording, startSR]);

  const handleStop = useCallback(() => {
    clearTimeout(minTimerRef.current);
    clearTimeout(autoStopRef.current);
    setPhase('stopping');
    stopRecording();
    stopSR();
    stopTracking();
  }, [stopRecording, stopSR, stopTracking]);

  useEffect(() => {
    if (fmReady && phase === 'recording' && videoRef.current) startTracking(videoRef.current);
  }, [fmReady, phase, startTracking]);

  useEffect(() => {
    if (videoBlob && phase === 'stopping') {
      stopCamera();
      onComplete({ videoBlob, videoUrl, transcript, wordCount, duration: elapsedSeconds, eyeContactScore });
    }
  }, [videoBlob]);

  useEffect(() => {
    return () => {
      stopCamera(); stopSR(); stopTracking();
      clearTimeout(minTimerRef.current);
      clearTimeout(autoStopRef.current);
    };
  }, []);

  const circ = 2 * Math.PI * 15;
  const ringOffset = circ - (elapsedSeconds / MAX) * circ;

  return (
    <div className="container page-top">
      <div className="step-pill anim-fade-up" style={{ marginBottom: '1rem' }}>
        Step 4 of 6 · {phase === 'perm' ? 'Camera setup' : phase === 'preview' ? 'Ready to record' : 'Recording'}
      </div>
      {phase !== 'perm' && (
        <h1 className="anim-fade-up d1" style={{ fontSize: 'clamp(0.9rem, 2.2vw, 1.3rem)', fontWeight: 700, marginBottom: '1rem', color: 'var(--ink-100)' }}>
          {topic}
        </h1>
      )}

      {/* ─── Main layout: video + side panel ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: phase === 'perm' ? '1fr' : 'minmax(0,1fr) 220px',
        gap: '0.875rem',
        alignItems: 'start',
      }}>

        {/* ── Video container — ALWAYS rendered so ref is valid and iOS play() works ── */}
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#0a0a12', aspectRatio: '16/9' }}>

          {/* Video is always in DOM — never display:none or opacity:0 */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', display: 'block',
              // Only mirror on non-perm phases so we don't confuse the user
              transform: phase === 'perm' ? 'none' : 'scaleX(-1)',
            }}
          />

          {/* ── PERMISSION GATE OVERLAY (covers video during perm phase) ── */}
          {phase === 'perm' && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'var(--ink-800)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '1.5rem', textAlign: 'center',
            }}>
              {/* Camera icon */}
              <div style={{
                width: 60, height: 60, borderRadius: 16, marginBottom: '1.1rem',
                background: 'var(--ink-700)', border: '1px solid var(--ink-600)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--ink-300)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 9a3 3 0 0 1 3-3h3.5l2-2.5h9l2 2.5H24a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V9z" />
                  <circle cx="14" cy="15" r="4" />
                </svg>
              </div>

              <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ink-50)', marginBottom: '0.4rem' }}>
                Camera access needed
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-400)', lineHeight: 1.65, maxWidth: 260, marginBottom: '1.25rem' }}>
                Video stays on your device. Only the text transcript is sent for analysis.
              </p>

              {error && (
                <div style={{
                  background: 'rgba(225,29,72,0.07)', border: '1px solid rgba(225,29,72,0.25)',
                  borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem',
                  fontSize: '0.76rem', color: '#fca5a5', lineHeight: 1.65,
                  textAlign: 'left', width: '100%', maxWidth: 300,
                }}>
                  {error}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleRequestCamera}
                disabled={permState === 'requesting'}
                id="allow-camera-btn"
                style={{ fontSize: '0.9rem', opacity: permState === 'requesting' ? 0.65 : 1 }}
              >
                {permState === 'requesting' ? 'Opening camera...' : error ? 'Try again' : 'Allow camera and microphone'}
              </button>
            </div>
          )}

          {/* ── REC overlay ── */}
          {phase === 'recording' && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '0.55rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom,rgba(0,0,0,0.7),transparent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div className="rec-indicator" />
                <span style={{ color: '#fff', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em' }}>REC</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <svg width={32} height={32} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx={16} cy={16} r={15} strokeWidth={2.5} fill="none" stroke="rgba(255,255,255,0.15)" />
                  <circle cx={16} cy={16} r={15} strokeWidth={2.5} fill="none"
                    stroke={elapsedSeconds >= 60 ? 'var(--rose)' : 'var(--violet-xl)'}
                    strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={ringOffset}
                    style={{ transition: 'stroke-dashoffset 1s linear' }} />
                </svg>
                <span style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>{fmt(elapsedSeconds)}</span>
              </div>
            </div>
          )}

          {fmReady && phase === 'recording' && (
            <div style={{ position: 'absolute', bottom: '0.6rem', left: '0.6rem', padding: '0.25rem 0.55rem', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700, color: '#fff', background: eyeContactLive ? 'rgba(5,150,105,0.85)' : 'rgba(225,29,72,0.85)', backdropFilter: 'blur(6px)', transition: 'background 0.3s' }}>
              {eyeContactLive ? 'Eye contact ✓' : 'Look at camera'}
            </div>
          )}

          {phase === 'preview' && (
            <div style={{ position: 'absolute', bottom: '0.6rem', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
              <div style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', borderRadius: 6, padding: '0.28rem 0.65rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)' }}>
                Preview — tap Start recording when ready
              </div>
            </div>
          )}
        </div>

        {/* ── Side panel (hidden during perm phase) ── */}
        {phase !== 'perm' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>

            {phase === 'preview' && (
              <>
                <button className="btn btn-primary" onClick={handleStartRecording} style={{ width: '100%', padding: '0.75rem' }}>
                  Start recording
                </button>
                <div className="surface" style={{ padding: '0.9rem 1rem' }}>
                  <div className="label" style={{ marginBottom: '0.5rem' }}>Tips</div>
                  {['Look into the camera', 'Speak at an even pace', 'Pause instead of saying um', '60 to 120 seconds'].map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.4rem', marginBottom: i < 3 ? '0.35rem' : 0 }}>
                      <span style={{ color: 'var(--violet-xl)', fontSize: '0.68rem', flexShrink: 0, marginTop: '0.05rem' }}>→</span>
                      <span style={{ fontSize: '0.76rem', color: 'var(--ink-300)' }}>{t}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {phase === 'recording' && (
              <>
                <div className="surface" style={{ padding: '0.9rem 1rem' }}>
                  <div className="label" style={{ marginBottom: '0.6rem' }}>Live stats</div>
                  {[['Words', wordCount], ['Time', fmt(elapsedSeconds)], ['WPM', elapsedSeconds > 5 ? Math.round(wordCount / (elapsedSeconds / 60)) : '...']].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.38rem 0', borderBottom: '1px solid var(--ink-700)' }}>
                      <span style={{ fontSize: '0.76rem', color: 'var(--ink-300)' }}>{l}</span>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--ink-50)', fontFamily: "'Space Grotesk',sans-serif" }}>{v}</span>
                    </div>
                  ))}
                </div>

                <div className="surface" style={{ padding: '0.9rem 1rem' }}>
                  <div className="label" style={{ marginBottom: '0.45rem' }}>Transcript</div>
                  <div style={{ maxHeight: 90, overflowY: 'auto', fontSize: '0.73rem', color: 'var(--ink-300)', lineHeight: 1.6 }}>
                    {!srOk && <em style={{ color: 'var(--ink-400)' }}>Not supported in this browser</em>}
                    {srOk && !transcript && !interimTranscript && <em style={{ color: 'var(--ink-400)' }}>Start speaking...</em>}
                    <span>{transcript}</span><span style={{ color: 'var(--ink-500)' }}> {interimTranscript}</span>
                  </div>
                </div>

                {!canStop && (
                  <div style={{ padding: '0.6rem 0.8rem', borderRadius: 9, background: 'rgba(217,119,6,0.07)', border: '1px solid rgba(217,119,6,0.18)', fontSize: '0.74rem', color: 'var(--amber)', textAlign: 'center' }}>
                    Min {MIN}s · <strong>{MIN - elapsedSeconds}s left</strong>
                  </div>
                )}

                <button className="btn btn-danger" disabled={!canStop} onClick={handleStop}
                  style={{ width: '100%', opacity: canStop ? 1 : 0.32, cursor: canStop ? 'pointer' : 'not-allowed' }}>
                  Stop recording
                </button>
                <p style={{ fontSize: '0.68rem', color: 'var(--ink-400)', textAlign: 'center' }}>Auto-stops at 2:00</p>
              </>
            )}

            {phase === 'stopping' && (
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-300)', textAlign: 'center', padding: '0.5rem' }}>Finishing up...</p>
            )}
          </div>
        )}
      </div>

      {/* ── Instructions shown below video during perm phase on mobile ── */}
      {phase === 'perm' && (
        <div style={{ marginTop: '1.25rem', padding: '1rem 1.25rem', background: 'var(--ink-800)', border: '1px solid var(--ink-600)', borderRadius: 12 }}>
          <div className="label" style={{ marginBottom: '0.6rem' }}>If you see "permission denied"</div>
          <div style={{ fontSize: '0.77rem', color: 'var(--ink-300)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--ink-200)' }}>iPhone / iPad:</strong> Settings → Safari → Camera → Allow<br />
            <strong style={{ color: 'var(--ink-200)' }}>Android Chrome:</strong> Tap lock icon in address bar → Permissions → Allow<br />
            Then reload the page and try again.
          </div>
        </div>
      )}
    </div>
  );
}
