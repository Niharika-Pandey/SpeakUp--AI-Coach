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
  const [permState, setPermState] = useState('idle'); // idle | requesting | granted | denied

  // Step 1: get the camera stream ONLY — do NOT attach to a video element here.
  // Video attachment happens in the component after the element is visible and in DOM.
  const requestCamera = useCallback(async () => {
    setError(null);
    setPermState('requesting');

    let stream = null;

    // Strategy: try progressively simpler constraints so mobile doesn't fail
    const attempts = [
      // Attempt 1: prefer front camera, basic audio
      () => navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'user' } },
        audio: true,
      }),
      // Attempt 2: bare minimum — let browser decide everything
      () => navigator.mediaDevices.getUserMedia({ video: true, audio: true }),
    ];

    let lastErr = null;
    for (const attempt of attempts) {
      try {
        stream = await attempt();
        break; // success
      } catch (err) {
        lastErr = err;
        // Only retry if it's NOT a hard permission denial
        if (err.name === 'NotAllowedError') break;
      }
    }

    if (!stream) {
      const err = lastErr;
      let msg;
      if (err?.name === 'NotAllowedError') {
        msg = 'Camera permission denied. Tap the camera/lock icon in your browser address bar, set Camera & Microphone to Allow, then try again.';
      } else if (err?.name === 'NotFoundError') {
        msg = 'No camera found on this device.';
      } else if (err?.name === 'NotReadableError') {
        msg = 'Camera is in use by another app. Close other apps using the camera and try again.';
      } else {
        msg = err?.message || 'Could not access camera.';
      }
      setError(msg);
      setPermState('denied');
      throw new Error(msg);
    }

    streamRef.current = stream;
    setPermState('granted');
    return stream;
  }, []);

  // Step 2: attach stream to a video element that is now visible in the DOM
  const attachToVideo = useCallback((videoElement) => {
    if (!streamRef.current || !videoElement) return;
    videoElement.srcObject = streamRef.current;
    videoElement.muted = true;
    // play() may fail on some mobile browsers — that's OK, autoplay attr handles it
    const playPromise = videoElement.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked — user will need to tap the video to start it
        // Usually fine since we show the video preview
      });
    }
  }, []);

  // Step 3: start recording (stream already open)
  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      setError('No camera stream available.');
      return;
    }

    chunksRef.current = [];
    setVideoBlob(null);
    setVideoUrl(null);
    setElapsedSeconds(0);

    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
      '',
    ];
    const mimeType = mimeTypes.find(t => t === '' || MediaRecorder.isTypeSupported(t));

    try {
      const recorder = new MediaRecorder(
        streamRef.current,
        mimeType ? { mimeType } : {}
      );
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoBlob(blob);
        setVideoUrl(url);
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const stopCamera = useCallback(() => {
    stopRecording();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setPermState('idle');
  }, [stopRecording]);

  return {
    requestCamera,
    attachToVideo,
    startRecording,
    stopRecording,
    stopCamera,
    isRecording,
    videoBlob,
    videoUrl,
    error,
    elapsedSeconds,
    permState,
  };
}
