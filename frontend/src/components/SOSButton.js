"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiAlertOctagon, FiPhone, FiUser, FiX, FiShield } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = "http://localhost:8000/api";

export default function SOSButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  const fetchProfile = async () => {
    const user = localStorage.getItem('username');
    if (!user) return;
    try {
      const res = await axios.get(`${API_BASE}/profile/${user}`);
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to fetch profile for SOS", err);
    }
  };

  useEffect(() => {
    if (isOpen) fetchProfile();
  }, [isOpen]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="sos-btn"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--danger)',
          color: 'white',
          border: 'none',
          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.4)',
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease'
        }}
      >
        <FiAlertOctagon size={32} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            padding: '1rem'
          }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel"
              style={{
                width: '100%',
                maxWidth: '500px',
                padding: '2.5rem',
                position: 'relative',
                border: '2px solid var(--danger)'
              }}
            >
              <button 
                onClick={() => setIsOpen(false)}
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <FiX size={24} />
              </button>

              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                  <FiShield size={40} />
                </div>
                <h2 style={{ fontSize: '1.75rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>Emergency Support</h2>
                <p style={{ color: 'var(--text-muted)' }}>Immediate clinical assistance is available. Reach out to your crisis contacts below.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ color: 'var(--primary)', background: 'white', padding: '8px', borderRadius: '8px' }}><FiUser /></div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Primary Care Doctor</div>
                      <div style={{ fontWeight: 700 }}>{profile?.doctor_name || 'Loading...'}</div>
                    </div>
                  </div>
                  <a 
                    href={`tel:${profile?.doctor_phone}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <button className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: 'var(--primary)' }}>
                      <FiPhone /> Call Doctor
                    </button>
                  </a>
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '8px' }}><FiAlertOctagon /></div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Emergency Contact ({profile?.relationship || 'Family'})</div>
                      <div style={{ fontWeight: 700 }}>{profile?.emergency_name || 'Loading...'}</div>
                    </div>
                  </div>
                  <a 
                    href={`tel:${profile?.emergency_phone}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <button className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: 'var(--danger)' }}>
                      <FiPhone /> Call Emergency Contact
                    </button>
                  </a>
                </div>
              </div>

              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2rem' }}>
                If you are in immediate danger, please dial local emergency services (e.g., 911 or 112).
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
