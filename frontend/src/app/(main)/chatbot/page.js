"use client";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiUser, FiMessageSquare } from 'react-icons/fi';
import VoiceButton from '../../../components/VoiceButton';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const Typewriter = ({ text, delay = 20, animate = true }) => {
  const [currentText, setCurrentText] = useState(animate ? "" : text);
  
  useEffect(() => {
    if (!animate) return;
    let index = 0;
    setCurrentText("");
    const interval = setInterval(() => {
      setCurrentText(text.slice(0, index + 1));
      index++;
      if (index >= text.length) clearInterval(interval);
    }, delay);
    return () => clearInterval(interval);
  }, [text, delay, animate]);
  
  return <span>{currentText}</span>;
};

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your clinical AI assistant. Feel free to chat with me. I'll analyze your messages to provide tailored support.", isNew: false }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev.map(m => ({...m, isNew: false})), { role: 'user', content: userText, isNew: true }]);
    setIsTyping(true);

    try {
      const res = await axios.post(`${API_BASE}/chat`, { message: userText });
      const { reply, score, primary_emotion } = res.data;
      
      setMessages(prev => [
        ...prev.map(m => ({...m, isNew: false})), 
        { 
          role: 'assistant', 
          content: reply, 
          score: score, 
          emotion: primary_emotion,
          isNew: true 
        }
      ]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again later.", isNew: true }]);
    } finally {
      setIsTyping(false);
    }
  };

  const getScoreColor = (score) => {
    if (score > 0.7) return '#EF4444';
    if (score > 0.4) return '#F59E0B';
    return '#10B981';
  };

  return (
    <div style={{ padding: '2.5rem', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100vh', paddingBottom: '2rem' }}>
      <header style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
        <h1 className="title" style={{ fontSize: '2rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}><FiMessageSquare /> Clinical AI Chat</h1>
        <p className="subtitle">Secure, mood-aware conversational support.</p>
      </header>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0', background: 'rgba(255,255,255,0.85)' }}>
        
        {/* Messages Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <AnimatePresence>
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', maxWidth: '80%', flexDirection: isUser ? 'row-reverse' : 'row' }}>
                    
                    {/* Avatar */}
                    <div style={{ 
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                      background: isUser ? 'var(--secondary)' : 'var(--primary)', 
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      {isUser ? <FiUser size={18} /> : <span style={{fontSize: '1.2rem'}}>🧠</span>}
                    </div>

                    {/* Bubble */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                      <div style={{ 
                        padding: '1rem 1.25rem', 
                        borderRadius: '16px',
                        borderTopLeftRadius: !isUser ? 0 : '16px',
                        borderTopRightRadius: isUser ? 0 : '16px',
                        background: isUser ? '#E0F2FE' : '#F1F5F9',
                        color: isUser ? '#0C4A6E' : '#1E293B',
                        fontSize: '1rem', lineHeight: '1.5',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}>
                        {msg.role === 'assistant' ? (
                          <Typewriter text={msg.content} animate={msg.isNew} />
                        ) : (
                          msg.content
                        )}
                      </div>
                      
                      {/* Metric Tag */}
                      {msg.score !== undefined && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                          style={{ 
                            fontSize: '0.75rem', fontWeight: 600, padding: '3px 8px', borderRadius: '12px',
                            color: getScoreColor(msg.score), border: `1px solid ${getScoreColor(msg.score)}40`,
                            background: `${getScoreColor(msg.score)}10`
                          }}
                        >
                          Distress: {msg.score.toFixed(2)} {msg.emotion && `• ${msg.emotion.charAt(0).toUpperCase() + msg.emotion.slice(1)}`}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{fontSize: '1.2rem'}}>🧠</span>
              </div>
              <div style={{ padding: '1rem 1.25rem', borderRadius: '16px', borderTopLeftRadius: 0, background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} style={{ width: '6px', height: '6px', background: 'currentColor', borderRadius: '50%' }} />
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} style={{ width: '6px', height: '6px', background: 'currentColor', borderRadius: '50%' }} />
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} style={{ width: '6px', height: '6px', background: 'currentColor', borderRadius: '50%' }} />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ borderTop: '1px solid var(--glass-border)', padding: '1rem 1.5rem', background: '#FFFFFF' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
            <input 
              type="text" 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder="Share how you're feeling..." 
              style={{ flex: 1, padding: '1rem 1.25rem', paddingRight: '6.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '1rem' }} 
              disabled={isTyping}
            />
            <div style={{ position: 'absolute', right: '55px', top: '10px' }}>
              <VoiceButton onTranscript={(text) => setInput(prev => prev + ' ' + text)} />
            </div>
            <button 
              type="submit" 
              disabled={!input.trim() || isTyping}
              style={{
                position: 'absolute', right: '8px', top: '8px', bottom: '8px', width: '40px',
                borderRadius: '50%', border: 'none', background: input.trim() ? 'var(--primary)' : '#E2E8F0',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s'
              }}
            >
              <FiSend />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
