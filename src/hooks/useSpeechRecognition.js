import { useRef, useState, useCallback } from 'react';

export function useSpeechRecognition() {
  const recognitionRef = useRef(null);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [isSupported] = useState(() =>
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );

  const start = useCallback(() => {
    if (!isSupported) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + ' ';
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalText) {
        setTranscript((prev) => {
          const updated = (prev + ' ' + finalText).trim();
          const words = updated.split(/\s+/).filter(Boolean);
          setWordCount(words.length);
          return updated;
        });
      }
      setInterimTranscript(interimText);
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') {
        console.warn('Speech recognition error:', e.error);
      }
      // Auto-restart on recoverable errors
      if (['network', 'no-speech'].includes(e.error)) {
        setTimeout(() => {
          try { recognition.start(); } catch {}
        }, 300);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      console.warn('Could not start speech recognition:', err);
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setWordCount(0);
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    wordCount,
    start,
    stop,
    reset,
  };
}
