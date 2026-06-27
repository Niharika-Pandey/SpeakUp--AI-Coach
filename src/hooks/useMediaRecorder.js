import { useRef, useState, useCallback } from 'react';

export function useMediaRecorder() {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [permState, setPermState] = useState('idle');

  const requestCamera = useCallback(async (videoElement) => {
    setError(null);
    setPermState('requesting');

    // Try constraints from most specific to most permissive
    const attempts = [
      { video: { facingMode: 'user' }, audio: true },
      { video: { facingMode: 'environment' }, audio: true },
      { video: true, audio: true },
      { video: true },
    ];

    let stream = null;
    let lastErr = null;

    for (const constraints of attempts) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        break;
      } catch (err) {
        lastErr = err;
        // Hard stop on permission denial — no point retrying
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') break;
        // Otherwise try next simpler constraint set
      }
    }

    if (!stream) {
      let msg;
      const n = lastErr?.name || '';
      if (n === 'NotAllowedError' || n === 'PermissionDeniedError') {
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const isAndroid = /android/i.test(navigator.userAgent);
        if (isIOS) {
          msg = 'Permission denied on iPhone/iPad. Go to Settings → Safari → Camera & Microphone → set to Allow. Then reload this page.';
        } else if (isAndroid) {
          msg = 'Permission denied. Tap the lock icon in your browser address bar → Permissions → allow Camera and Microphone. Then try again.';
        } else {
          msg = 'Camera access denied. Click the camera icon in the address bar and set to Allow.';
        }
      } else if (n === 'NotFoundError' || n === 'DevicesNotFoundError') {
        msg = 'No camera found on this device.';
      } else if (n === 'NotReadableError' || n === 'TrackStartError') {
        msg = 'Camera is in use by another app. Close other apps using the camera and try again.';
      } else if (n === 'OverconstrainedError') {
        msg = 'Camera does not support required settings. Try a different browser.';
      } else {
        msg = (lastErr?.message || 'Could not access camera.') + ' (Try Chrome or Safari on mobile.)';
      }
      setError(msg);
      setPermState('denied');
      throw new Error(msg);
    }

    streamRef.current = stream;

    // Attach to video element immediately while we still have the reference
    if (videoElement) {
      try {
        videoElement.srcObject = stream;
        // Must set muted as property (React prop alone doesn't always work on iOS)
        videoElement.muted = true;
        videoElement.setAttribute('playsinline', '');
        videoElement.setAttribute('webkit-playsinline', '');
        await videoElement.play();
      } catch (playErr) {
        // play() failure is non-fatal — autoPlay attribute handles it on most browsers
        console.warn('video.play() failed:', playErr.message);
      }
    }

    setPermState('granted');
    return stream;
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) { setError('No camera stream available.'); return; }

    chunksRef.current = [];
    setVideoBlob(null);
    setVideoUrl(null);
    setElapsedSeconds(0);

    const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4', ''];
    const mimeType = mimeTypes.find(t => t === '' || MediaRecorder.isTypeSupported(t));

    try {
      const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = e => { if (e.data?.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
        setVideoBlob(blob);
        setVideoUrl(URL.createObjectURL(blob));
      };

      recorder.start(500);
      setIsRecording(true);
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    } catch (err) {
      setError('Failed to start recording: ' + err.message);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const stopCamera = useCallback(() => {
    stopRecording();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setPermState('idle');
  }, [stopRecording]);

  return {
    requestCamera, startRecording, stopRecording, stopCamera,
    isRecording, videoBlob, videoUrl, error, elapsedSeconds, permState,
  };
}
