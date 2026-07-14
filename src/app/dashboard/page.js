'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../lib/api-client';
import {
  ShieldCheck,
  Lock,
  DollarSign,
  ShoppingBag,
  Ticket,
  Activity,
  ArrowRight,
  TrendingUp,
  PackageCheck
} from 'lucide-react';
import Link from 'next/link';

// KPI Card component
function KpiCard({ label, value, icon: Icon, accentClass, iconBg, iconColor }) {
  return (
    <div
      className={`flip7-card ${accentClass} animate-fade-up`}
      style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}
    >
      <div>
        <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: 0 }}>
          {label}
        </p>
        <h3 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--color-text-dark)', margin: '6px 0 0', letterSpacing: '-0.02em' }}>
          {value}
        </h3>
      </div>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: 'var(--radius-md)',
        background: iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={22} color={iconColor} />
      </div>
    </div>
  );
}

// Skeleton card
function SkeletonCard() {
  return (
    <div style={{
      height: '100px',
      background: 'white',
      borderRadius: 'var(--radius-lg)',
      border: '1.5px solid rgba(43,168,162,0.08)',
      animation: 'glow-pulse 1.5s ease-in-out infinite',
      opacity: 0.7,
    }} />
  );
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [kpisData, reportsData] = await Promise.all([
        apiClient.get('/admin/dashboard/kpis'),
        apiClient.get('/admin/dashboard/reports')
      ]);
      setKpis(kpisData);
      setReports(reportsData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('adminUser');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      if (parsed.role === 'ADMIN') {
        fetchDashboardData();
      } else {
        setLoading(false);
      }
    }
  }, [fetchDashboardData]);

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  return (
    <div id="dashboard-overview" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── Welcome Banner ── */}
      <div className="animate-fade-up" style={{
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        boxShadow: 'var(--shadow-teal-glow)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Gold shimmer overlay */}
        <div style={{
          position: 'absolute',
          top: 0, right: 0,
          width: '200px',
          height: '100%',
          background: 'linear-gradient(135deg, transparent, rgba(255,210,63,0.10), transparent)',
          pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{
              fontSize: '22px',
              fontWeight: '800',
              color: '#FFF8E7',
              margin: 0,
              letterSpacing: '0.01em',
            }}>
              Welcome back, {user.name}! 👋
            </h2>
            <p style={{ color: 'rgba(255,248,231,0.75)', fontSize: '13px', fontWeight: '500', marginTop: '4px', margin: '4px 0 0' }}>
              Here is a status summary for CreativeArt portal.
            </p>
          </div>
          <span style={{
            background: 'rgba(255,210,63,0.20)',
            border: '1.5px solid rgba(255,210,63,0.35)',
            color: 'var(--color-gold)',
            fontSize: '11px',
            fontWeight: '800',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
          }}>
            🎨 {user.role}
          </span>
        </div>
      </div>

      {isAdmin && (
        <>
          {/* ── KPI Cards ── */}
          <div>
            <p className="flip7-section-title" style={{ marginBottom: '16px' }}>
              <span>📈</span> Key Metrics
            </p>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                <KpiCard
                  label="Total Revenue"
                  value={`₹${kpis?.totalRevenue?.toLocaleString('en-IN') || '0'}`}
                  icon={DollarSign}
                  accentClass="flip7-card-accent-gold"
                  iconBg="linear-gradient(135deg, #FFE47A, #FFD23F)"
                  iconColor="#2C3E50"
                />
                <KpiCard
                  label="Orders Count"
                  value={kpis?.totalOrders || '0'}
                  icon={ShoppingBag}
                  accentClass="flip7-card-accent-teal"
                  iconBg="linear-gradient(135deg, #3CC4BD, #2BA8A2)"
                  iconColor="#FFF8E7"
                />
                <KpiCard
                  label="Active Coupons"
                  value={kpis?.activeCoupons || '0'}
                  icon={Ticket}
                  accentClass="flip7-card-accent-sky"
                  iconBg="linear-gradient(135deg, #7EC8E3, #5DADE2)"
                  iconColor="white"
                />
                <KpiCard
                  label="In Production"
                  value={kpis?.projectsInProduction || '0'}
                  icon={Activity}
                  accentClass="flip7-card-accent-coral"
                  iconBg="linear-gradient(135deg, #FF8A6A, #EF6C4A)"
                  iconColor="white"
                />
              </div>
            )}
          </div>

          {/* ── Charts / Reports ── */}
          {!loading && reports && (
            <div>
              <p className="flip7-section-title" style={{ marginBottom: '16px' }}>
                <span>📊</span> Analytics
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

                  {/* Monthly Revenue Bar Chart */}
                  <div className="flip7-card flip7-card-accent-teal animate-fade-up" style={{ padding: '22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: 'var(--color-primary-dark)',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <TrendingUp size={16} color="var(--color-primary)" />
                        Revenue Growth Trend
                      </h3>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        Monthly
                      </span>
                    </div>
                    <div style={{
                      height: '180px',
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: '8px',
                      paddingTop: '16px',
                      borderBottom: '2px dashed rgba(43,168,162,0.15)',
                      paddingBottom: '8px',
                    }}>
                      {reports.monthlyRevenue.map((item, idx) => {
                        const maxVal = Math.max(...reports.monthlyRevenue.map(m => m.revenue));
                        const percentage = (item.revenue / maxVal) * 100;
                        return (
                          <div
                            key={idx}
                            title={`₹${item.revenue}`}
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', position: 'relative' }}
                          >
                            <div style={{ width: '100%', height: '148px', display: 'flex', alignItems: 'flex-end' }}>
                              <div
                                style={{
                                  width: '100%',
                                  height: `${percentage}%`,
                                  background: idx === reports.monthlyRevenue.length - 1
                                    ? 'linear-gradient(180deg, var(--color-gold), var(--color-gold-dark))'
                                    : 'linear-gradient(180deg, var(--color-primary-light), var(--color-primary))',
                                  borderRadius: '6px 6px 0 0',
                                  transition: 'all 0.3s ease',
                                  boxShadow: idx === reports.monthlyRevenue.length - 1
                                    ? 'var(--shadow-accent-glow)'
                                    : 'none',
                                  minHeight: '4px',
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: '600' }}>{item.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order Distribution */}
                  <div className="flip7-card flip7-card-accent-coral animate-fade-up" style={{ padding: '22px' }}>
                    <h3 style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color: 'var(--color-primary-dark)',
                      margin: '0 0 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <PackageCheck size={16} color="var(--color-coral)" />
                      Order Distribution
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '4px' }}>
                      {reports.ordersByType.map((type, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-mid)' }}>{type.name}</span>
                            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--color-text-dark)' }}>{type.value}</span>
                          </div>
                          <div className="flip7-progress-track">
                            <div
                              className="flip7-progress-fill"
                              style={{
                                width: `${(type.value / 165) * 100}%`,
                                background: idx === 0
                                  ? 'linear-gradient(90deg, var(--color-primary-light), var(--color-primary))'
                                  : 'linear-gradient(90deg, var(--color-coral-light), var(--color-coral))',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Staff Landing ── */}
      {!isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>

          {/* Access Role Card */}
          <div className="flip7-card flip7-card-accent-teal animate-fade-up" style={{ padding: '24px' }}>
            <h3 className="flip7-section-title" style={{ marginBottom: '16px' }}>
              <ShieldCheck size={16} /> My Access Role
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: 'var(--color-primary-bg)',
                borderRadius: 'var(--radius-md)',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-mid)', fontWeight: '500' }}>Account Role</span>
                <span className="badge-teal">{user.role}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: 'var(--color-cream)',
                borderRadius: 'var(--radius-md)',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-mid)', fontWeight: '500' }}>Access Level</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-dark)' }}>Workflow Scoped</span>
              </div>
            </div>
            {user.role === 'STAFF_PRODUCTION' ? (
              <Link
                href="/dashboard/production"
                id="btn-go-production"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 0',
                  background: 'linear-gradient(135deg, #FFD23F, #E6B800)',
                  color: '#2C3E50',
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: '700',
                  fontSize: '14px',
                  textDecoration: 'none',
                  boxShadow: 'var(--shadow-accent-glow)',
                  transition: 'transform 0.2s var(--ease-bounce)',
                  letterSpacing: '0.03em',
                }}
              >
                ⚙️ Go to Production Board <ArrowRight size={16} />
              </Link>
            ) : (
              <Link
                href="/dashboard/shipments"
                id="btn-go-shipments"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 0',
                  background: 'linear-gradient(135deg, #FFD23F, #E6B800)',
                  color: '#2C3E50',
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: '700',
                  fontSize: '14px',
                  textDecoration: 'none',
                  boxShadow: 'var(--shadow-accent-glow)',
                  transition: 'transform 0.2s var(--ease-bounce)',
                  letterSpacing: '0.03em',
                }}
              >
                🚚 Go to Shipments Board <ArrowRight size={16} />
              </Link>
            )}
          </div>

          {/* Security Notice Card */}
          <div className="flip7-card flip7-card-accent-coral animate-fade-up" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 className="flip7-section-title" style={{ marginBottom: '12px' }}>
                <Lock size={15} color="var(--color-coral)" />
                <span style={{ color: 'var(--color-coral-dark)' }}>Security Notice</span>
              </h3>
              <p style={{
                fontSize: '13px',
                color: 'var(--color-text-mid)',
                lineHeight: '1.6',
                marginTop: '10px',
              }}>
                As a staff member, your session access has been scoped strictly to required operations. Manual database alterations or cross-scope operations are monitored and recorded.
              </p>
            </div>
            <div style={{
              marginTop: '16px',
              padding: '10px 14px',
              background: 'rgba(239,108,74,0.06)',
              borderRadius: 'var(--radius-md)',
              border: '1.5px dashed rgba(239,108,74,0.20)',
            }}>
              <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: '600', letterSpacing: '0.06em', margin: 0 }}>
                SESSION ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
