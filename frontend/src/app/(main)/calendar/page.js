"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiCalendar, FiInfo } from 'react-icons/fi';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function Calendar() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      const user = localStorage.getItem('username');
      if (!user) return;
      try {
        const res = await axios.get(`${API_BASE}/entries/${user}`);
        setData(res.data.entries);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, []);

  const getDayColor = (score) => {
    if (score === null) return '#E2E8F0'; // Empty Data
    if (score > 0.7) return '#EF4444'; // High Risk (Red)
    if (score > 0.4) return '#F59E0B'; // Moderate (Yellow)
    return '#10B981'; // Stable (Green)
  };

  // Process data for the last 90 days
  const last90Days = Array.from({ length: 90 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (89 - i));
    const dateStr = d.toISOString().split('T')[0];
    
    // Find average score for this day
    const dayEntries = data.filter(e => new Date(e.time).toISOString().split('T')[0] === dateStr);
    let avgScore = null;
    if (dayEntries.length > 0) {
      avgScore = dayEntries.reduce((acc, curr) => acc + curr.score, 0) / dayEntries.length;
    }
    
    return { date: dateStr, score: avgScore, entries: dayEntries.length };
  });

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading mood history...</div>;

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 className="title" style={{ fontSize: '2rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}><FiCalendar /> Mood Calendar</h1>
        <p className="subtitle">Visualize your clinical distress patterns over the last 90 days.</p>
      </header>
      
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 className="title">90-Day Clinical Mood Tracker</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '12px', background: '#E2E8F0', borderRadius: '4px' }}></div> No Data</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '12px', background: '#10B981', borderRadius: '4px' }}></div> Stable</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '12px', background: '#F59E0B', borderRadius: '4px' }}></div> Moderate</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '12px', background: '#EF4444', borderRadius: '4px' }}></div> High Risk</div>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(13, 1fr)', // Rough weeks approximation
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '1rem'
        }}>
          {last90Days.map((day, idx) => (
            <motion.div 
              key={idx}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: idx * 0.005 }}
              title={`${day.date}: ${day.score !== null ? day.score.toFixed(2) : 'No entries'} (${day.entries} logs)`}
              style={{
                aspectRatio: '1',
                borderRadius: '6px',
                background: getDayColor(day.score),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: day.score !== null ? 'rgba(255,255,255,0.9)' : 'transparent',
                fontSize: '0.65rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'transform 0.2s',
                minWidth: '35px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {day.entries > 0 && day.entries}
            </motion.div>
          ))}
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', borderLeft: '4px solid var(--primary)', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <FiInfo size={24} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>Understanding your Calendar</h4>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              This heatmap aggregates all journal logs submitted on a given day to produce an average distress score. A red tile indicates a period dominated by high emotional distress, signaling that medical or conversational intervention was recommended.
            </p>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
