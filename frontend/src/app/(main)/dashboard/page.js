"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiEdit3, FiActivity, FiAlertTriangle, FiCheckCircle, FiInfo, FiMoon, FiPlusCircle, FiZap } from 'react-icons/fi';
import VoiceButton from '../../../components/VoiceButton';

const API_BASE = "http://localhost:8000/api";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [journal, setJournal] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [newEntry, setNewEntry] = useState(null);
  const [sleepHours, setSleepHours] = useState(8);
  const [medsTaken, setMedsTaken] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    const user = localStorage.getItem('username');
    if (!user) return;
    try {
      const res = await axios.get(`${API_BASE}/dashboard/${user}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!journal.trim()) return;
    setAnalyzing(true);
    setNewEntry(null);
    const user = localStorage.getItem('username');
    try {
      const res = await axios.post(`${API_BASE}/entries`, { 
        username: user, 
        entry: journal,
        sleep_hours: Number(sleepHours),
        meds_taken: medsTaken
      });
      setNewEntry(res.data);
      setJournal('');
      fetchDashboard();
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading clinical data...</div>;

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 className="title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Clinical Dashboard</h1>
        <p className="subtitle">Overview of your patient's mental health status and journal entries.</p>
      </header>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
            <div style={{ padding: '10px', background: 'var(--primary)', color: 'white', borderRadius: '10px' }}><FiEdit3 size={24} /></div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Total Entries</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>{data?.total_entries || 0}</div>
            </div>
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.1 }} className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
            <div style={{ padding: '10px', background: 'var(--danger)', color: 'white', borderRadius: '10px' }}><FiAlertTriangle size={24} /></div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>High Risk Percent</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>{data?.high_risk_pct || 0}%</div>
            </div>
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.2 }} className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
            <div style={{ padding: '10px', background: 'var(--success)', color: 'white', borderRadius: '10px' }}><FiActivity size={24} /></div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Average Score</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>{data?.avg_score || 0}</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Triggers Section */}
      {data?.top_triggers?.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2.5rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05))' }}>
          <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
            <FiZap /> AI Detected Triggers
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {data.top_triggers.map((trigger, i) => (
              <span key={i} style={{ padding: '6px 14px', background: 'white', borderRadius: '20px', border: '1px solid var(--glass-border)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', boxShadow: 'var(--shadow-sm)' }}>
                {trigger}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Journal Entry Section */}
      <h3 className="title" style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FiEdit3 /> New Journal Entry
      </h3>
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <textarea 
          placeholder="How are you feeling today? Write your thoughts..."
          rows="5"
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          style={{ width: '100%', marginBottom: '1.5rem', resize: 'vertical' }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              <FiMoon /> Hours of Sleep
            </label>
            <input 
              type="number" 
              value={sleepHours} 
              onChange={(e) => setSleepHours(e.target.value)} 
              min="0" max="24" step="0.5"
            />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              <FiPlusCircle /> Medication Taken?
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setMedsTaken(true)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: medsTaken ? 'var(--success-light)' : 'white', color: medsTaken ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}
              >
                Yes
              </button>
              <button 
                onClick={() => setMedsTaken(false)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: !medsTaken ? 'var(--danger-light)' : 'white', color: !medsTaken ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}
              >
                No
              </button>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
          <VoiceButton onTranscript={(text) => setJournal(prev => prev + ' ' + text)} />
          <button onClick={handleAnalyze} disabled={analyzing} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {analyzing ? (
              <>Analyzing...</>
            ) : (
              <><FiActivity /> Analyze Emotions</>
            )}
          </button>
        </div>
      </motion.div>

      {/* Result Card */}
      {newEntry && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--primary)', background: 'linear-gradient(to right, rgba(59, 130, 246, 0.05), transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
              {newEntry.score > 0.7 ? <span style={{ color: 'var(--danger)' }}><FiAlertTriangle /></span> : newEntry.score > 0.4 ? <span style={{ color: 'var(--warning)' }}><FiInfo /></span> : <span style={{ color: 'var(--success)' }}><FiCheckCircle /></span>}
              Analysis Complete
            </h4>
            <span style={{ fontWeight: 700, fontSize: '1.25rem', color: newEntry.score > 0.7 ? 'var(--danger)' : newEntry.score > 0.4 ? 'var(--warning)' : 'var(--success)' }}>
              Score: {newEntry.score.toFixed(2)} / 1.00
            </span>
          </div>
          <div style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '8px', borderLeft: `4px solid ${newEntry.score > 0.7 ? 'var(--danger)' : newEntry.score > 0.4 ? 'var(--warning)' : 'var(--success)'}` }}>
            <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>AI Advice:</strong>
            <span style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-main)' }}>{newEntry.ai_advice}</span>
          </div>
        </motion.div>
      )}

    </div>
  );
}
