'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '../../lib/api-client';
import { Mail, Phone, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = { password };
      if (loginMethod === 'email') {
        payload.email = email;
      } else {
        payload.phone = phone;
      }

      const res = await apiClient.post('/auth/login', payload);

      // Verify the role. CUSTOMER role is blocked from admin panel.
      if (res.user.role === 'CUSTOMER') {
        throw new Error('Access denied. Customer accounts are not allowed to access the Admin Panel.');
      }

      // Store admin session details
      localStorage.setItem('adminAccessToken', res.accessToken);
      localStorage.setItem('adminRefreshToken', res.refreshToken);
      localStorage.setItem('adminUser', JSON.stringify(res.user));

      // Redirect to admin dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="login-page"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-surface-base)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorative blobs */}
      <div style={{
        position: 'absolute',
        top: '-120px',
        left: '-120px',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(43,168,162,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-100px',
        right: '-80px',
        width: '420px',
        height: '420px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,210,63,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        top: '40%',
        right: '10%',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(239,108,74,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Fan cards decoration — top center */}
      <div style={{
        position: 'absolute',
        top: '-24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        pointerEvents: 'none',
        zIndex: 0,
      }}>
        {['#E05C5C','#C9A227','#2A9D8F','#3A7DC9','#A855A8'].map((color, i) => (
          <div key={i} style={{
            width: '44px',
            height: '62px',
            borderRadius: '8px',
            background: color,
            border: '2px solid rgba(255,255,255,0.6)',
            transform: `rotate(${(i - 2) * 12}deg)`,
            transformOrigin: 'bottom center',
            marginLeft: i === 0 ? 0 : '-18px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            opacity: 0.7,
          }} />
        ))}
      </div>

      {/* Login Card */}
      <div
        id="login-card"
        className="animate-fade-up"
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--color-surface-card)',
          borderRadius: 'var(--radius-xl)',
          padding: '40px 36px',
          boxShadow: 'var(--shadow-teal-glow), 0 8px 40px rgba(0,0,0,0.10)',
          border: '1.5px solid rgba(43,168,162,0.15)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {/* Logo icon */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
            boxShadow: 'var(--shadow-teal-glow)',
            marginBottom: '16px',
          }}>
            {/* Shield icon in cream */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFF8E7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>

          {/* Retro ribbon-style title */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '4px' }}>
            <h1 style={{
              fontSize: '26px',
              fontWeight: '800',
              color: 'var(--color-primary-dark)',
              letterSpacing: '0.04em',
              margin: 0,
              transform: 'rotate(-1.5deg)',
              display: 'inline-block',
            }}>
              CreativeArt
              <span style={{
                color: 'var(--color-gold-dark)',
                marginLeft: '6px',
              }}>Admin</span>
            </h1>
          </div>

          <p style={{
            color: 'var(--color-text-mid)',
            fontSize: '13px',
            fontWeight: '500',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginTop: '4px',
          }}>
            Staff & Management Console
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div id="login-error" style={{
            marginBottom: '20px',
            padding: '14px 16px',
            background: 'rgba(239,108,74,0.10)',
            border: '1.5px solid rgba(239,108,74,0.25)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-coral-dark)',
            fontSize: '13px',
            lineHeight: '1.5',
            textAlign: 'center',
            borderLeft: '4px solid var(--color-coral)',
          }}>
            {error}
          </div>
        )}

        {/* Login Method Toggle */}
        <div style={{
          display: 'flex',
          padding: '4px',
          background: 'var(--color-primary-bg)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          border: '1.5px solid rgba(43,168,162,0.15)',
        }}>
          {['email', 'phone'].map((method) => (
            <button
              id={`toggle-${method}`}
              key={method}
              type="button"
              onClick={() => { setLoginMethod(method); setError(''); }}
              style={{
                flex: 1,
                padding: '9px 0',
                fontSize: '13px',
                fontWeight: '700',
                fontFamily: 'inherit',
                letterSpacing: '0.03em',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s var(--ease-bounce)',
                background: loginMethod === method
                  ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))'
                  : 'transparent',
                color: loginMethod === method ? '#FFF8E7' : 'var(--color-text-mid)',
                boxShadow: loginMethod === method ? 'var(--shadow-teal-glow)' : 'none',
              }}
            >
              {method === 'email' ? '✉️ Email' : '📱 Phone'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Email or Phone */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-mid)',
              marginBottom: '8px',
            }}>
              {loginMethod === 'email' ? 'Staff Email' : 'Staff Phone'}
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                top: '50%',
                left: '14px',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}>
                {loginMethod === 'email'
                  ? <Mail size={16} />
                  : <Phone size={16} />
                }
              </span>
              {loginMethod === 'email' ? (
                <input
                  id="input-email"
                  type="email"
                  required
                  placeholder="admin@creativeart.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flip7-input"
                  style={{ paddingLeft: '42px' }}
                />
              ) : (
                <input
                  id="input-phone"
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flip7-input"
                  style={{ paddingLeft: '42px' }}
                />
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-mid)',
              marginBottom: '8px',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                top: '50%',
                left: '14px',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}>
                <Lock size={16} />
              </span>
              <input
                id="input-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flip7-input"
                style={{ paddingLeft: '42px', paddingRight: '48px' }}
              />
              <button
                type="button"
                id="toggle-password-visibility"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '14px',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                  borderRadius: '6px',
                  transition: 'color 0.15s ease',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit — Gold CTA */}
          <button
            id="btn-login-submit"
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '15px',
              marginTop: '4px',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'flip7-spin 0.75s linear infinite' }} />
                Authenticating...
              </>
            ) : (
              '🔐 Enter Admin Panel'
            )}
          </button>
        </form>

        {/* Footer note */}
        <p style={{
          textAlign: 'center',
          fontSize: '11px',
          color: 'var(--color-text-light)',
          marginTop: '20px',
          letterSpacing: '0.03em',
        }}>
          Restricted access · Staff & Admin only
        </p>
      </div>
    </div>
  );
}
