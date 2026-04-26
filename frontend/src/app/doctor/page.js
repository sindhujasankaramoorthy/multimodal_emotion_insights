"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiUser, FiLock, FiActivity, FiBriefcase } from 'react-icons/fi';

const API_BASE = "http://localhost:8000/api";

export default function DoctorAuthPage() {
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
    name: '', specialization: '', hospital: '', phone: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/doctor/login`, {
        username: loginUser,
        password: loginPass
      });
      localStorage.setItem('doctor_username', res.data.username);
      router.push('/doctor/dashboard');
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
          name: regData.name,
          specialization: regData.specialization,
          hospital: regData.hospital,
          phone: regData.phone
        }
      };
      await axios.post(`${API_BASE}/auth/doctor/register`, payload);
      setIsLogin(true);
      setLoginUser(regData.username);
      setError('Doctor Account created! Please login.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    }
    setLoading(false);
  };

  const handleChange = (e) => setRegData({...regData, [e.target.name]: e.target.value});

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-panel"
        style={{ padding: '3rem', width: '100%', maxWidth: '450px', borderTop: '4px solid #10B981' }} // Distinguish with green top border
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <FiBriefcase size={48} color="#10B981" style={{ marginBottom: '1rem' }} />
          <h1 className="title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#111827' }}>Psychiatrist Portal</h1>
          <p className="subtitle">Secure Patient Management</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
          <div 
            onClick={() => setIsLogin(true)}
            style={{ flex: 1, textAlign: 'center', padding: '1rem', cursor: 'pointer', borderBottom: isLogin ? '2px solid #10B981' : 'none', fontWeight: isLogin ? 600 : 400, color: isLogin ? '#10B981' : 'var(--text-muted)' }}
          >
            Sign In
          </div>
          <div 
            onClick={() => setIsLogin(false)}
            style={{ flex: 1, textAlign: 'center', padding: '1rem', cursor: 'pointer', borderBottom: !isLogin ? '2px solid #10B981' : 'none', fontWeight: !isLogin ? 600 : 400, color: !isLogin ? '#10B981' : 'var(--text-muted)' }}
          >
            Create Account
          </div>
        </div>

        {error && (
          <div style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px', background: error.includes('created') ? 'var(--success-light)' : 'var(--danger-light)', color: error.includes('created') ? 'var(--success)' : 'var(--danger)', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>License ID (Username)</label>
              <div style={{ position: 'relative' }}>
                <FiUser style={{ position: 'absolute', top: '14px', left: '16px', color: '#94A3B8' }} />
                <input type="text" value={loginUser} onChange={(e)=>setLoginUser(e.target.value)} required style={{ paddingLeft: '40px' }} placeholder="Enter username" />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Secure Password</label>
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', top: '14px', left: '16px', color: '#94A3B8' }} />
                <input type="password" value={loginPass} onChange={(e)=>setLoginPass(e.target.value)} required style={{ paddingLeft: '40px' }} placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '1rem', background: '#10B981', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Access Portal'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
              <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
              <input type="text" name="name" placeholder="Dr. John Doe" onChange={handleChange} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Specialty</label>
                <input type="text" name="specialization" placeholder="e.g. Psychiatry" onChange={handleChange} required />
              </div>
              <div>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Hospital/Clinic</label>
                <input type="text" name="hospital" placeholder="City Clinic" onChange={handleChange} required />
              </div>
            </div>
            
            <div>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Professional Phone</label>
              <input type="text" name="phone" placeholder="+1..." onChange={handleChange} required />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '1rem', background: '#10B981', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }} disabled={loading}>
              {loading ? 'Registering...' : 'Complete Verification'}
            </button>
          </form>
        )}
        
        <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Not a doctor?{' '}
            <a href="/" style={{ color: 'var(--text-main)', fontWeight: 600, textDecoration: 'underline' }}>
              Patient Portal
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
