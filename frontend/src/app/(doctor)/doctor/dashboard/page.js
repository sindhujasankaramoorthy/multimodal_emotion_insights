"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiSearch, FiAlertCircle, FiCheckCircle, FiClock, FiUser } from 'react-icons/fi';

const API_BASE = "http://localhost:8000/api";

export default function DoctorDashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await axios.get(`${API_BASE}/doctor/patients`);
        setPatients(res.data.patients);
      } catch (err) {
        console.error("Failed to fetch patients:", err);
      }
      setLoading(false);
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => 
    p.patient_name.toLowerCase().includes(search.toLowerCase()) || 
    p.username.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status) => {
    if (status === 'High Risk') return '#ef4444'; // Red
    if (status === 'Moderate') return '#f59e0b'; // Amber
    if (status === 'Stable') return '#10B981'; // Green
    return '#94a3b8'; // Slate
  };

  const getStatusIcon = (status) => {
    if (status === 'High Risk') return <FiAlertCircle size={16} />;
    if (status === 'Moderate') return <FiClock size={16} />;
    if (status === 'Stable') return <FiCheckCircle size={16} />;
    return <FiUser size={16} />;
  };

  return (
    <div style={{ padding: '2rem 3rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Patient Overview</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Monitor and analyze patient distress indicators in real-time.</p>
        </div>
        
        <div style={{ position: 'relative', width: '300px' }}>
          <FiSearch style={{ position: 'absolute', top: '12px', left: '16px', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Search patients..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px 16px 10px 40px', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0',
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }} 
          />
        </div>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Loading patient data...</div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Patient Name</th>
                <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Age</th>
                <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Current Status</th>
                <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Distress Score</th>
                <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Last Update</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No patients found.</td>
                </tr>
              ) : (
                filteredPatients.map((p, idx) => (
                  <tr key={p.username} style={{ borderBottom: idx === filteredPatients.length - 1 ? 'none' : '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: '#0f172a' }}>{p.patient_name}</td>
                    <td style={{ padding: '1rem 1.5rem', color: '#64748b' }}>{p.age}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.4rem', 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '999px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        background: `${getStatusColor(p.latest_status)}15`,
                        color: getStatusColor(p.latest_status)
                      }}>
                        {getStatusIcon(p.latest_status)}
                        {p.latest_status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                         <span style={{ fontWeight: 600, color: p.latest_score > 0.7 ? '#ef4444' : '#0f172a' }}>{p.latest_score}</span>
                         <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, p.latest_score * 100))}%`, background: getStatusColor(p.latest_status) }} />
                         </div>
                       </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                      {p.latest_time ? new Date(p.latest_time).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
