import { useState, useCallback, useRef, useEffect } from "react";

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onspeechend: (() => void) | null;
  onsoundstart: (() => void) | null;
  onsoundend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

interface UseVoiceInterviewOptions {
  onTranscript?: (text: string) => void;
  onSpeechEnd?: () => void;
  onInterimTranscript?: (text: string) => void;
  onAudioLevel?: (level: number) => void;
  language?: string;
  silenceTimeout?: number; // Auto-submit after silence (ms)
  autoRestart?: boolean; // Auto-restart after submission
}

interface UseVoiceInterviewReturn {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  interimTranscript: string;
  audioLevel: number;
  confidence: number;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  pauseListening: () => void;
  resumeListening: () => void;
  isSupported: boolean;
  isPaused: boolean;
  error: string | null;
  clearError: () => void;
}

export const useVoiceInterview = (options: UseVoiceInterviewOptions = {}): UseVoiceInterviewReturn => {
  const { 
    onTranscript, 
    onSpeechEnd, 
    onInterimTranscript,
    onAudioLevel,
    language = "en-US",
    silenceTimeout = 2000,
    autoRestart = false,
  } = options;
  
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const shouldRestartRef = useRef(false);
  const accumulatedTranscriptRef = useRef("");

  // Check browser support
  const isSupported = typeof window !== "undefined" && 
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) &&
    "speechSynthesis" in window;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup audio analysis
  const cleanupAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  // Start audio level monitoring
  const startAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateLevel = () => {
        if (!analyserRef.current || !isListening) {
          setAudioLevel(0);
          return;
        }
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalizedLevel = Math.min(average / 128, 1);
        
        setAudioLevel(normalizedLevel);
        onAudioLevel?.(normalizedLevel);
        
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
    } catch (err) {
      console.warn("Audio analysis not available:", err);
    }
  }, [isListening, onAudioLevel]);

  // Reset silence timer
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    
    if (silenceTimeout > 0 && isListening && accumulatedTranscriptRef.current) {
      silenceTimerRef.current = setTimeout(() => {
        if (accumulatedTranscriptRef.current && onTranscript) {
          onTranscript(accumulatedTranscriptRef.current);
          accumulatedTranscriptRef.current = "";
          setTranscript("");
          setInterimTranscript("");
          
          if (onSpeechEnd) {
            onSpeechEnd();
          }
        }
      }, silenceTimeout);
    }
  }, [silenceTimeout, isListening, onTranscript, onSpeechEnd]);

  useEffect(() => {
    if (!isSupported) {
      setError("Voice features are not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = language;

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = "";
      let currentInterim = "";
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;
        
        if (result[0].confidence > maxConfidence) {
          maxConfidence = result[0].confidence;
        }
        
        if (result.isFinal) {
          finalTranscript += transcriptText;
        } else {
          currentInterim += transcriptText;
        }
      }

      setConfidence(maxConfidence);
      
      if (currentInterim) {
        setInterimTranscript(currentInterim);
        onInterimTranscript?.(currentInterim);
      }

      if (finalTranscript) {
        accumulatedTranscriptRef.current += " " + finalTranscript;
        accumulatedTranscriptRef.current = accumulatedTranscriptRef.current.trim();
        setTranscript(accumulatedTranscriptRef.current);
        setInterimTranscript("");
        resetSilenceTimer();
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone access to use voice features.");
        setIsListening(false);
      } else if (event.error === "network") {
        setError("Network error. Please check your connection and try again.");
        // Auto-retry on network errors
        if (shouldRestartRef.current) {
          setTimeout(() => {
            if (shouldRestartRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.warn("Could not restart recognition:", e);
              }
            }
          }, 1000);
        }
      } else if (event.error !== "aborted" && event.error !== "no-speech") {
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      }
    };

    recognitionRef.current.onend = () => {
      // Auto-restart if we should still be listening
      if (shouldRestartRef.current && !isPaused) {
        try {
          recognitionRef.current?.start();
        } catch (e) {
          console.warn("Could not restart recognition:", e);
          setIsListening(false);
          shouldRestartRef.current = false;
        }
      } else {
        setIsListening(false);
      }
    };

    // Initialize Speech Synthesis
    synthRef.current = window.speechSynthesis;

    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      cleanupAudioAnalysis();
    };
  }, [isSupported, language, onInterimTranscript, resetSilenceTimer, isPaused, cleanupAudioAnalysis]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    accumulatedTranscriptRef.current = "";
    shouldRestartRef.current = true;
    setIsPaused(false);
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
      startAudioAnalysis();
    } catch (err) {
      console.error("Error starting recognition:", err);
      setError("Failed to start voice recognition. Please try again.");
      shouldRestartRef.current = false;
    }
  }, [isListening, startAudioAnalysis]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    
    setIsListening(false);
    setIsPaused(false);
    cleanupAudioAnalysis();
    
    // Submit any remaining transcript
    if (accumulatedTranscriptRef.current && onTranscript) {
      onTranscript(accumulatedTranscriptRef.current);
      accumulatedTranscriptRef.current = "";
    }
  }, [isListening, onTranscript, cleanupAudioAnalysis]);

  const pauseListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    
    setIsPaused(true);
    shouldRestartRef.current = false;
    recognitionRef.current.stop();
    cleanupAudioAnalysis();
  }, [isListening, cleanupAudioAnalysis]);

  const resumeListening = useCallback(() => {
    if (!recognitionRef.current || !isPaused) return;
    
    setIsPaused(false);
    shouldRestartRef.current = true;
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
      startAudioAnalysis();
    } catch (err) {
      console.error("Error resuming recognition:", err);
    }
  }, [isPaused, startAudioAnalysis]);

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!synthRef.current) return;

    // Pause listening while speaking to avoid feedback
    const wasListening = isListening;
    if (wasListening) {
      pauseListening();
    }

    return new Promise((resolve) => {
      // Cancel any ongoing speech
      synthRef.current!.cancel();

      // Clean up the text for better speech
      const cleanText = text
        .replace(/INTERVIEW_COMPLETED/g, "Interview completed. Thank you for your time.")
        .replace(/\*\*/g, "")
        .replace(/\n+/g, " ")
        .replace(/[#*_]/g, "") // Remove markdown
        .replace(/\s+/g, " ")
        .trim();

      utteranceRef.current = new SpeechSynthesisUtterance(cleanText);
      utteranceRef.current.lang = language;
      utteranceRef.current.rate = 0.95; // Natural pace
      utteranceRef.current.pitch = 1;
      utteranceRef.current.volume = 1;

      // Try to find a good voice
      const voices = synthRef.current!.getVoices();
      const preferredVoice = voices.find(
        (v) => v.lang.startsWith("en") && 
          (v.name.includes("Google") || v.name.includes("Microsoft") || v.name.includes("Natural") || v.name.includes("Premium"))
      ) || voices.find((v) => v.lang.startsWith("en") && v.localService);
      
      if (preferredVoice) {
        utteranceRef.current.voice = preferredVoice;
      }

      utteranceRef.current.onstart = () => {
        setIsSpeaking(true);
      };

      utteranceRef.current.onend = () => {
        setIsSpeaking(false);
        
        // Resume listening after speaking if it was active
        if (wasListening && autoRestart) {
          setTimeout(() => resumeListening(), 300);
        }
        
        resolve();
      };

      utteranceRef.current.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        setIsSpeaking(false);
        
        if (wasListening && autoRestart) {
          setTimeout(() => resumeListening(), 300);
        }
        
        resolve();
      };

      synthRef.current!.speak(utteranceRef.current);
    });
  }, [language, isListening, pauseListening, resumeListening, autoRestart]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    isPaused,
    transcript,
    interimTranscript,
    audioLevel,
    confidence,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    speak,
    stopSpeaking,
    isSupported,
    error,
    clearError,
  };
};
