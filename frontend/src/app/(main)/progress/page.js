"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiClock, FiAlertCircle } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE = "http://localhost:8000/api";

export default function Progress() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      const user = localStorage.getItem('username');
      if (!user) return;
      try {
        const res = await axios.get(`${API_BASE}/entries/${user}`);
        const formatted = res.data.entries.map(entry => ({
          ...entry,
          timeLabel: new Date(entry.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
        }));
        setEntries(formatted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, []);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading progress data...</div>;

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 className="title" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}><FiTrendingUp /> Clinical Progress</h1>
        <p className="subtitle">Historical analysis of distress scores over time.</p>
      </header>

      {entries.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <FiAlertCircle size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
          <h3 className="title">No Data Available</h3>
          <p className="subtitle">Add entries from the dashboard to see distress progression.</p>
        </motion.div>
      ) : (
        <>
          {/* Chart Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
            <h3 className="title" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Distress Score Timeline</h3>
            <div style={{ width: '100%', height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={entries} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="timeLabel" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 1]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-md)' }} 
                    labelStyle={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="var(--primary)" 
                    strokeWidth={3} 
                    dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 4 }} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* History Table */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel" style={{ padding: '2rem' }}>
            <h3 className="title" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiClock /> Recent Entries Log
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <th style={{ padding: '1rem 0.5rem' }}>Date & Time</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Distress Score</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Status</th>
                    <th style={{ padding: '1rem 0.5rem' }}>AI Advice</th>
                  </tr>
                </thead>
                <tbody>
                  {[...entries].reverse().map((entry, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', transition: 'background 0.2s' }}>
                      <td style={{ padding: '1rem 0.5rem', fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-main)' }}>{entry.timeLabel}</td>
                      <td style={{ padding: '1rem 0.5rem', fontWeight: 700, color: entry.score > 0.7 ? 'var(--danger)' : entry.score > 0.4 ? 'var(--warning)' : 'var(--success)' }}>
                        {entry.score.toFixed(2)}
                      </td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600,
                          background: entry.score > 0.7 ? 'var(--danger-light)' : entry.score > 0.4 ? 'var(--warning-light)' : 'var(--success-light)',
                          color: entry.score > 0.7 ? 'var(--danger)' : entry.score > 0.4 ? 'var(--warning)' : 'var(--success)'
                        }}>
                          {entry.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '300px' }}>
                        {entry.ai_advice}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </motion.div>
        </>
      )}
    </div>
  );
}
