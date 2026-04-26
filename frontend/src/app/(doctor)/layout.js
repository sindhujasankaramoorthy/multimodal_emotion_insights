"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiHome, FiUsers, FiSettings, FiLogOut, FiActivity } from 'react-icons/fi';

export default function DoctorLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [doctor, setDoctor] = useState('');

  useEffect(() => {
    const doctor_username = localStorage.getItem('doctor_username');
    if (!doctor_username) {
      router.push('/doctor');
    } else {
      setDoctor(doctor_username);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('doctor_username');
    router.push('/doctor');
  };

  const navItems = [
    { name: 'Patient Overview', path: '/doctor/dashboard', icon: <FiUsers size={20} /> },
  ];

  if (!doctor) return null; // Wait for redirect

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: '#f8fafc' }}>
      {/* Sidebar */}
      <aside 
        className="sidebar"
        style={{
        width: '260px',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem', color: '#10B981' }}>
          <FiActivity size={28} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Clinical Portal</h2>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem', paddingLeft: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Psychiatry Dashboard
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map(item => {
            const isActive = pathname === item.path;
            return (
               <Link key={item.path} href={item.path} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.875rem 1rem',
                  borderRadius: '10px',
                  background: isActive ? '#10B981' : 'transparent',
                  color: isActive ? 'white' : '#64748b',
                  transition: 'all 0.2s',
                  fontWeight: isActive ? 600 : 500,
                  boxShadow: isActive ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                }}>
                  {item.icon}
                  {item.name}
                </div>
              </Link>
            )
          })}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#0f172a', fontWeight: 600, marginBottom: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
              Dr.
            </div>
            {doctor}
          </div>
          <button 
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', padding: '0.875rem 1rem', borderRadius: '10px', background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
          >
             <FiLogOut size={20} />
            Secure Logout
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
