"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiHome, FiUser, FiActivity, FiLogOut, FiMenu, FiMessageSquare, FiCalendar } from 'react-icons/fi';
import SOSButton from '../../components/SOSButton';

export default function MainLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState('');

  useEffect(() => {
    const username = localStorage.getItem('username');
    if (!username) {
      router.push('/');
    } else {
      setUser(username);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('username');
    router.push('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <FiHome size={20} /> },
    { name: 'Calendar', path: '/calendar', icon: <FiCalendar size={20} /> },
    { name: 'AI Chat', path: '/chatbot', icon: <FiMessageSquare size={20} /> },
    { name: 'Profile', path: '/profile', icon: <FiUser size={20} /> },
    { name: 'Progress', path: '/progress', icon: <FiActivity size={20} /> },
  ];

  if (!user) return null; // Wait for redirect

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* Sidebar */}
      <aside 
        className="sidebar"
        style={{
        width: '260px',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--glass-border)',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem', color: 'var(--primary)' }}>
          <FiActivity size={28} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Clinical Mood</h2>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', paddingLeft: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Menu
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
                  background: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                  fontWeight: isActive ? 600 : 500,
                  boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                }}>
                  {item.icon}
                  {item.name}
                </div>
              </Link>
            )
          })}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)', fontWeight: 600, marginBottom: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
              {user.slice(0, 2).toUpperCase()}
            </div>
            {user}
          </div>
          <button 
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', padding: '0.875rem 1rem', borderRadius: '10px', background: 'transparent', border: 'none', color: 'var(--danger)', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
          >
            <FiLogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
      <SOSButton />
    </div>
  );
}
