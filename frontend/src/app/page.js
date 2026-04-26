"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiUser, FiLock, FiActivity, FiPhone, FiMail } from 'react-icons/fi';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Login State
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register State
  const [regData, setRegData] = useState({
    username: '', password: '',
    patient_name: '', patient_age: 30,
    doctor_name: '', specialization: '', hospital: '',
    doctor_phone: '', doctor_email: '',
    emergency_name: '', relationship: '', emergency_phone: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        username: loginUser,
        password: loginPass
      });
      localStorage.setItem('username', res.data.username);
      router.push('/dashboard');
    } catch (err) {
      console.error("Login Error:", err);
      if (!err.response) {
        setError('Server unreachable. Please ensure the backend is running on port 8000.');
      } else {
        setError(err.response?.data?.detail || 'Invalid username or password');
      }
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        username: regData.username,
        password: regData.password,
        profile: {
          patient_name: regData.patient_name,
          patient_age: Number(regData.patient_age),
          doctor_name: regData.doctor_name,
          specialization: regData.specialization,
          hospital: regData.hospital,
          doctor_phone: regData.doctor_phone,
          doctor_email: regData.doctor_email,
          emergency_name: regData.emergency_name,
          relationship: regData.relationship,
          emergency_phone: regData.emergency_phone
        }
      };
      await axios.post(`${API_BASE}/auth/register`, payload);
      setIsLogin(true);
      setLoginUser(regData.username);
      setError('Registration successful! Please login.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    }
    setLoading(false);
  };

  const handleChange = (e) => setRegData({...regData, [e.target.name]: e.target.value});

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel"
        style={{ padding: '3rem', width: '100%', maxWidth: isLogin ? '400px' : '650px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <FiActivity size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
          <h1 className="title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Clinical Mood System</h1>
          <p className="subtitle">AI-Powered Monitoring</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
          <div 
            onClick={() => setIsLogin(true)}
            style={{ flex: 1, textAlign: 'center', padding: '1rem', cursor: 'pointer', borderBottom: isLogin ? '2px solid var(--primary)' : 'none', fontWeight: isLogin ? 600 : 400, color: isLogin ? 'var(--primary)' : 'var(--text-muted)' }}
          >
            Sign In
          </div>
          <div 
            onClick={() => setIsLogin(false)}
            style={{ flex: 1, textAlign: 'center', padding: '1rem', cursor: 'pointer', borderBottom: !isLogin ? '2px solid var(--primary)' : 'none', fontWeight: !isLogin ? 600 : 400, color: !isLogin ? 'var(--primary)' : 'var(--text-muted)' }}
          >
            Create Account
          </div>
        </div>

        {error && (
          <div style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px', background: error.includes('success') ? 'var(--success-light)' : 'var(--danger-light)', color: error.includes('success') ? 'var(--success)' : 'var(--danger)', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Username</label>
              <div style={{ position: 'relative' }}>
                <FiUser style={{ position: 'absolute', top: '14px', left: '16px', color: '#94A3B8' }} />
                <input type="text" value={loginUser} onChange={(e)=>setLoginUser(e.target.value)} required style={{ paddingLeft: '40px' }} placeholder="Enter username" />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', top: '14px', left: '16px', color: '#94A3B8' }} />
                <input type="password" value={loginPass} onChange={(e)=>setLoginPass(e.target.value)} required style={{ paddingLeft: '40px' }} placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Username</label>
                <input type="text" name="username" onChange={handleChange} required />
              </div>
              <div>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Password</label>
                <input type="password" name="password" onChange={handleChange} required />
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Patient Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <input type="text" name="patient_name" placeholder="Full Name" onChange={handleChange} required />
                <input type="number" name="patient_age" placeholder="Age" onChange={handleChange} required min="1" />
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Primary Care Doctor</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <input type="text" name="doctor_name" placeholder="Doctor's Name" onChange={handleChange} />
                <input type="text" name="specialization" placeholder="Specialization" onChange={handleChange} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <input type="text" name="hospital" placeholder="Hospital/Clinic" onChange={handleChange} />
                <input type="text" name="doctor_phone" placeholder="Phone" onChange={handleChange} />
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Emergency Contact</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <input type="text" name="emergency_name" placeholder="Contact Name" onChange={handleChange} />
                <input type="text" name="relationship" placeholder="Relationship" onChange={handleChange} />
                <input type="text" name="emergency_phone" placeholder="Phone Number" style={{ gridColumn: 'span 2' }} onChange={handleChange} />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>
        )}
        
        <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Are you a medical professional?{' '}
            <a href="/doctor" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Psychiatrist Portal
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
