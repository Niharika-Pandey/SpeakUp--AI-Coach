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

  // Step 1: just get the camera stream and attach to video element (no recording yet)
  const requestCamera = useCallback(async (videoElement) => {
    setError(null);
    setPermState('requesting');

    try {
      // Try ideal constraints first, fall back to basic
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      } catch {
        // Fall back to minimal constraints
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      }

      streamRef.current = stream;

      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.muted = true;
        try {
          await videoElement.play();
        } catch {
          // play() might auto-resolve on some browsers
        }
      }

      setPermState('granted');
      return stream;
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Click the camera icon in your browser address bar and allow access.'
          : err.name === 'NotFoundError'
          ? 'No camera found. Please connect a camera and try again.'
          : err.name === 'NotReadableError'
          ? 'Camera is already in use by another app. Close other apps using the camera.'
          : err.message || 'Could not access camera.';
      setError(msg);
      setPermState('denied');
      throw err;
    }
  }, []);

  // Step 2: start recording (stream already open)
  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      setError('No camera stream. Please allow camera access first.');
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
    ];
    const mimeType = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || '';

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

      recorder.start(250);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setElapsedSeconds(s => s + 1);
      }, 1000);
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
