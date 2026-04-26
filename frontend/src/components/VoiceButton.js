"use client";
import { useState, useEffect, useRef } from 'react';
import { FiMic, FiMicOff } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceButton({ onTranscript, className = "" }) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [volume, setVolume] = useState(0);
  const [errorStatus, setErrorStatus] = useState("");
  
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const transcriptHandlerRef = useRef(onTranscript);
  const lastInterimRef = useRef("");
  const isStoppingManually = useRef(false);
  
  useEffect(() => {
    transcriptHandlerRef.current = onTranscript;
  }, [onTranscript]);

  const stopListening = (manual = true) => {
    if (manual) isStoppingManually.current = true;
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    // Cleanup Audio
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Flush last interim if exists
    if (lastInterimRef.current.trim() && transcriptHandlerRef.current) {
      transcriptHandlerRef.current(lastInterimRef.current.trim());
    }
    
    setIsListening(false);
    setInterimText("");
    setVolume(0);
    lastInterimRef.current = "";
  };

  const startListening = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition. Please use Chrome or Edge.");
      return;
    }

    try {
      isStoppingManually.current = false;
      setErrorStatus("");
      setInterimText("");
      lastInterimRef.current = "";

      // 1. Setup Audio Analysis for Volume Meter
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      await audioContext.resume(); // FORCE WAKE
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!audioContextRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += (dataArray[i] * 1.5); // Increase sensitivity for visualization
        }
        const average = sum / bufferLength;
        setVolume(Math.min(100, average)); 
        requestAnimationFrame(updateVolume);
      };
      updateVolume();

      // 2. Setup Speech Recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorStatus("");
      };
      
      recognition.onend = () => {
        // AUTO-RESTART if not stopped manually (fixes no-speech timeout)
        if (!isStoppingManually.current && isListening) {
          console.log("Restarting recognition due to timeout...");
          try { recognition.start(); } catch (e) {}
        } else {
          stopListening(false);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === 'no-speech') {
          setErrorStatus("No speech detected...");
          return; // Don't stop, let onend handle the auto-restart
        }
        if (event.error === 'not-allowed') {
          alert("Microphone permission denied.");
        }
        stopListening();
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let currentInterim = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }
        
        if (currentInterim) {
          setInterimText(currentInterim);
          lastInterimRef.current = currentInterim;
          setErrorStatus(""); // Clear error if we hear something
        }

        if (finalTranscript.trim() && transcriptHandlerRef.current) {
          transcriptHandlerRef.current(finalTranscript.trim());
          setInterimText("");
          lastInterimRef.current = "";
        }
      };

      recognitionRef.current = recognition;
      recognition.start();

    } catch (err) {
      console.error("Failed to access microphone:", err);
      alert("Microphone access failed. Please ensure your earphones are plugged in and permissions are granted.");
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    isListening ? stopListening(true) : startListening();
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} className={className}>
      <motion.button
        type="button"
        onClick={toggleListening}
        animate={isListening ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={isListening ? { repeat: Infinity, duration: 2 } : {}}
        style={{
          width: '45px',
          height: '45px',
          borderRadius: '50%',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: isListening ? '#EF4444' : '#F1F5F9',
          color: isListening ? 'white' : '#64748B',
          boxShadow: isListening ? `0 0 ${10 + volume}px rgba(239, 68, 68, 0.6)` : '0 2px 4px rgba(0,0,0,0.05)',
          transition: 'background 0.3s, color 0.3s',
          zIndex: 10,
          outline: 'none'
        }}
      >
        {isListening ? <FiMicOff size={20} /> : <FiMic size={20} />}
      </motion.button>

      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{
              position: 'absolute',
              right: '60px',
              minWidth: '220px',
              maxWidth: '350px',
              background: '#0F172A',
              color: 'white',
              padding: '12px 18px',
              borderRadius: '16px',
              fontSize: '0.9rem',
              pointerEvents: 'none',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.1)',
              zIndex: 100
            }}
          >
            {/* Volume Visualization Ring */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '14px', display: 'flex', gap: '2px', alignItems: 'flex-end' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{ 
                    width: '4px', 
                    height: `${Math.max(2, (volume / 2) * (i/3))}px`, 
                    background: volume > 10 ? '#10B981' : '#475569',
                    borderRadius: '2px',
                    transition: 'height 0.1s ease'
                  }}></div>
                ))}
              </div>
              <span style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                {volume > 5 ? 'Sound Detected' : 'Silence'}
              </span>
            </div>

            <div style={{ color: '#F8FAFC', fontWeight: 500, lineHeight: 1.4 }}>
              {errorStatus ? (
                <span style={{ color: '#FCA5A5' }}>{errorStatus}</span>
              ) : (
                interimText || "Listening..."
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
