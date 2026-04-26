"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiUser, FiPhone, FiMail, FiMapPin, FiActivity } from 'react-icons/fi';

const API_BASE = "http://localhost:8000/api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = localStorage.getItem('username');
      if (!user) return;
      try {
        const res = await axios.get(`${API_BASE}/profile/${user}`);
        setProfile(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading profile...</div>;
  if (!profile) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--danger)' }}>Failed to load profile.</div>;

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 className="title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Patient Profile</h1>
        <p className="subtitle">Manage patient and assigned medical personnel details.</p>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
        {/* Avatar Section */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'white', fontWeight: 700, marginBottom: '1.5rem', boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)' }}>
            {profile.patient_name.slice(0, 2).toUpperCase()}
          </div>
          <h2 className="title" style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>{profile.patient_name}</h2>
          <span style={{ padding: '4px 12px', background: 'var(--primary)', color: 'white', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>{profile.patient_age} Years Old</span>
        </motion.div>

        {/* Details Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1.5rem 0', color: 'var(--text-main)', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <FiActivity color="var(--primary)" /> Medical Provider
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Doctor Name</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}><FiUser color="var(--primary)" /> {profile.doctor_name}</div>
              </div>
              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Specialization</label>
                <div style={{ fontWeight: 500 }}>{profile.specialization}</div>
              </div>
              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Hospital/Clinic</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}><FiMapPin color="var(--warning)" /> {profile.hospital}</div>
              </div>
              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Contact Info</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiPhone color="var(--primary)" /> {profile.doctor_phone}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiMail color="var(--primary)" /> {profile.doctor_email}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Emergency Contact */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1.5rem 0', color: 'var(--danger)', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <FiPhone /> Emergency Contact
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Contact Name</label>
                <div style={{ fontWeight: 500, fontSize: '1.1rem' }}>{profile.emergency_name}</div>
              </div>
              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Relationship & Phone</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontWeight: 500 }}>
                  <span style={{ color: 'var(--primary)' }}>{profile.relationship}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}><FiPhone color="var(--danger)" /> {profile.emergency_phone}</div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
