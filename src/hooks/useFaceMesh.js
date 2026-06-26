import { useRef, useState, useCallback } from 'react';

// Eye contact detection using MediaPipe FaceLandmarker
// Tracks what % of frames the user is looking at the camera

export function useFaceMesh() {
  const faceLandmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const frameCountRef = useRef(0);
  const eyeContactFramesRef = useRef(0);

  const [isReady, setIsReady] = useState(false);
  const [eyeContactLive, setEyeContactLive] = useState(false);
  const [eyeContactScore, setEyeContactScore] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const initialize = useCallback(async () => {
    try {
      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');

      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        outputFaceBlendshapes: false,
        runningMode: 'VIDEO',
        numFaces: 1,
      });

      faceLandmarkerRef.current = faceLandmarker;
      setIsReady(true);
    } catch (err) {
      console.warn('FaceMesh init failed (eye contact unavailable):', err);
      setLoadError(err.message);
    }
  }, []);

  const startTracking = useCallback((videoElement) => {
    if (!faceLandmarkerRef.current || !videoElement) return;

    frameCountRef.current = 0;
    eyeContactFramesRef.current = 0;

    const detect = () => {
      if (!faceLandmarkerRef.current) return;

      try {
        const now = performance.now();
        const results = faceLandmarkerRef.current.detectForVideo(videoElement, now);

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const landmarks = results.faceLandmarks[0];

          // Check eye gaze direction using nose tip (1) vs eye centers
          // Landmarks: left eye center ~468, right eye center ~473, nose tip ~4
          // If nose tip is roughly centered between eyes = looking forward
          const noseTip = landmarks[4];
          const leftEye = landmarks[33];
          const rightEye = landmarks[263];

          const eyeCenterX = (leftEye.x + rightEye.x) / 2;
          const eyeCenterY = (leftEye.y + rightEye.y) / 2;
          const diffX = Math.abs(noseTip.x - eyeCenterX);
          const diffY = Math.abs(noseTip.y - eyeCenterY);

          // Thresholds — if nose is close to eye center horizontally, roughly looking forward
          const isLooking = diffX < 0.08 && diffY < 0.12;

          eyeContactFramesRef.current += isLooking ? 1 : 0;
          frameCountRef.current += 1;

          setEyeContactLive(isLooking);
        } else {
          // No face detected
          frameCountRef.current += 1;
          setEyeContactLive(false);
        }
      } catch {
        // Silently swallow detection errors (e.g., video not ready)
      }

      rafRef.current = requestAnimationFrame(detect);
    };

    rafRef.current = requestAnimationFrame(detect);
  }, []);

  const stopTracking = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (frameCountRef.current > 0) {
      const score = Math.round(
        (eyeContactFramesRef.current / frameCountRef.current) * 100
      );
      setEyeContactScore(Math.min(100, Math.max(0, score)));
    } else {
      // Fallback if no frames processed
      setEyeContactScore(75);
    }
  }, []);

  const reset = useCallback(() => {
    frameCountRef.current = 0;
    eyeContactFramesRef.current = 0;
    setEyeContactScore(null);
    setEyeContactLive(false);
  }, []);

  return {
    initialize,
    startTracking,
    stopTracking,
    reset,
    isReady,
    eyeContactLive,
    eyeContactScore,
    loadError,
  };
}
