"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function TechnicianLandingPage() {
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [trade, setTrade] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setProfilePictureUrl(url);
    setPreviewUrl(url);
  };

  const getInitials = () => {
    if (!fullName) return 'T';
    return fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/technicians/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          trade_needed: trade,
          address_text: address,
          city,
          state,
          years_experience: yearsExperience ? parseInt(yearsExperience) : undefined,
          license_number: licenseNumber || undefined,
          profile_picture: profilePictureUrl || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create technician profile');
      }

      setSuccess(true);
      setTimeout(() => {
        setShowSignupModal(false);
        setSuccess(false);
        // Reset form
        setFullName('');
        setEmail('');
        setPhone('');
        setTrade('');
        setAddress('');
        setCity('');
        setState('');
        setYearsExperience('');
        setLicenseNumber('');
        setProfilePictureUrl('');
        setPreviewUrl('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 70,
        background: 'rgba(47, 47, 47, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--spacing-2xl)',
        zIndex: 100
      }}>
        <Link href="/" style={{
          fontFamily: 'var(--font-section-title)',
          fontSize: 'var(--font-2xl)',
          color: 'var(--text-primary)',
          textDecoration: 'none'
        }}>
          Ravensearch
        </Link>

        <div style={{ display: 'flex', gap: 'var(--spacing-lg)' }}>
          <Link href="/login" style={{
            padding: '12px 24px',
            color: 'var(--text-primary)',
            textDecoration: 'none',
            fontSize: 'var(--font-md)'
          }}>
            Log In
          </Link>
          <button
            className="primary-button"
            onClick={() => setShowSignupModal(true)}
          >
            Get Started
          </button>
        </div>
      </nav>

      <main style={{
        marginTop: 70,
        minHeight: 'calc(100vh - 70px)',
        background: 'var(--bg-secondary)'
      }}>
        {/* Hero Section */}
        <section style={{
          padding: 'var(--spacing-5xl) var(--spacing-2xl)',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(101, 98, 144, 0.1) 0%, rgba(47, 47, 47, 0) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <h1 style={{
            fontFamily: 'var(--font-section-title)',
            fontSize: 'clamp(32px, 5vw, 56px)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-lg)',
            fontWeight: 'var(--font-weight-bold)'
          }}>
            Get More Jobs. Grow Your Business.
          </h1>
          <p style={{
            fontSize: 'var(--font-xl)',
            color: 'var(--text-secondary)',
            maxWidth: 700,
            margin: '0 auto var(--spacing-2xl)',
            lineHeight: 1.6
          }}>
            Join Ravensearch and connect with customers who need your expertise.
            AI-powered matching, instant notifications, and flexible scheduling.
          </p>
          <button
            className="primary-button"
            onClick={() => setShowSignupModal(true)}
            style={{ fontSize: 'var(--font-lg)', padding: '16px 32px' }}
          >
            Join as Technician
          </button>
        </section>

        {/* Stats Section */}
        <section style={{
          padding: 'var(--spacing-4xl) var(--spacing-2xl)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--spacing-xl)',
          maxWidth: 1200,
          margin: '0 auto'
        }}>
          <div style={{
            background: 'rgba(101, 98, 144, 0.05)',
            border: '1px solid rgba(101, 98, 144, 0.2)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-xl)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: 'var(--font-4xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--accent-primary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              1,000+
            </div>
            <div style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)'
            }}>
              Active Technicians
            </div>
          </div>

          <div style={{
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-xl)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: 'var(--font-4xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--success)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              5,000+
            </div>
            <div style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)'
            }}>
              Jobs Completed
            </div>
          </div>

          <div style={{
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-xl)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: 'var(--font-4xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--warning)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              4.8★
            </div>
            <div style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)'
            }}>
              Average Rating
            </div>
          </div>
        </section>

        {/* How It Works - Video Demos Section */}
        <section style={{
          padding: 'var(--spacing-5xl) var(--spacing-2xl)',
          background: 'rgba(47, 47, 47, 0.5)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <h2 style={{
            fontFamily: 'var(--font-section-title)',
            fontSize: 'var(--font-4xl)',
            color: 'var(--text-primary)',
            textAlign: 'center',
            marginBottom: 'var(--spacing-4xl)'
          }}>
            How It Works
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: 'var(--spacing-3xl)',
            maxWidth: 1400,
            margin: '0 auto'
          }}>
            {/* Feature 1: AI-Powered Job Matching - Dispatch Loader Demo */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-lg)'
            }}>
              <div style={{
                background: 'rgba(101, 98, 144, 0.1)',
                border: '2px solid rgba(101, 98, 144, 0.3)',
                borderRadius: 'var(--container-border-radius)',
                aspectRatio: '16/9',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Embedded iframe showing dispatch loader in loop */}
                <iframe
                  src="/demo-dispatch"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block'
                  }}
                  title="AI Job Matching Demo"
                />
                {/* Overlay label */}
                <div style={{
                  position: 'absolute',
                  top: 'var(--spacing-md)',
                  left: 'var(--spacing-md)',
                  background: 'rgba(0, 0, 0, 0.7)',
                  padding: 'var(--spacing-xs) var(--spacing-md)',
                  borderRadius: 'var(--container-border-radius)',
                  fontSize: 'var(--font-sm)',
                  color: 'var(--text-primary)',
                  fontWeight: 'var(--font-weight-semibold)'
                }}>
                  🎬 Live Demo
                </div>
              </div>
              <div>
                <h3 style={{
                  fontSize: 'var(--font-2xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  AI-Powered Job Matching
                </h3>
                <p style={{
                  fontSize: 'var(--font-md)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6
                }}>
                  Our AI automatically matches you with jobs based on your skills, location,
                  and availability. Watch how the system finds the best technicians in real-time.
                </p>
              </div>
            </div>

            {/* Feature 2: Instant Job Notifications */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-lg)'
            }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '2px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--container-border-radius)',
                aspectRatio: '16/9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Video Placeholder */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 'var(--spacing-md)'
                }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" fill="#10B981" opacity="0.3" />
                  </svg>
                  <div style={{
                    fontSize: 'var(--font-sm)',
                    color: 'var(--text-secondary)',
                    textAlign: 'center'
                  }}>
                    Video Demo: Instant Notifications
                  </div>
                </div>
              </div>
              <div>
                <h3 style={{
                  fontSize: 'var(--font-2xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Instant Job Notifications
                </h3>
                <p style={{
                  fontSize: 'var(--font-md)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6
                }}>
                  Get notified the moment a job matches your profile via email or SMS.
                  Be the first to respond and secure more work.
                </p>
              </div>
            </div>

            {/* Feature 3: Live Job Tracking Map */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-lg)'
            }}>
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '2px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--container-border-radius)',
                aspectRatio: '16/9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Video Placeholder */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.05) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 'var(--spacing-md)'
                }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" fill="#F59E0B" opacity="0.3" />
                  </svg>
                  <div style={{
                    fontSize: 'var(--font-sm)',
                    color: 'var(--text-secondary)',
                    textAlign: 'center'
                  }}>
                    Video Demo: Live Map Tracking
                  </div>
                </div>
              </div>
              <div>
                <h3 style={{
                  fontSize: 'var(--font-2xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Live Job Tracking Map
                </h3>
                <p style={{
                  fontSize: 'var(--font-md)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6
                }}>
                  View all nearby jobs on an interactive map. See distance, route,
                  and job details at a glance to plan your day efficiently.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section style={{
          padding: 'var(--spacing-5xl) var(--spacing-2xl)',
          maxWidth: 1200,
          margin: '0 auto'
        }}>
          <h2 style={{
            fontFamily: 'var(--font-section-title)',
            fontSize: 'var(--font-4xl)',
            color: 'var(--text-primary)',
            textAlign: 'center',
            marginBottom: 'var(--spacing-4xl)'
          }}>
            Everything You Need to Succeed
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--spacing-xl)'
          }}>
            {[
              {
                icon: '🎯',
                title: 'Smart Matching',
                description: 'AI matches you with jobs that fit your skills, location, and schedule'
              },
              {
                icon: '📱',
                title: 'Mobile Friendly',
                description: 'Manage jobs on the go with our responsive mobile interface'
              },
              {
                icon: '💰',
                title: 'Transparent Pricing',
                description: 'See job rates upfront and negotiate directly with customers'
              },
              {
                icon: '⚡',
                title: 'Instant Dispatch',
                description: 'Receive job offers immediately via email and SMS notifications'
              },
              {
                icon: '📍',
                title: 'Location-Based',
                description: 'Find jobs in your service area with accurate distance calculations'
              },
              {
                icon: '⭐',
                title: 'Build Reputation',
                description: 'Earn ratings and reviews to attract more high-quality customers'
              }
            ].map((feature, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(101, 98, 144, 0.05)',
                  border: '1px solid rgba(101, 98, 144, 0.2)',
                  borderRadius: 'var(--container-border-radius)',
                  padding: 'var(--spacing-xl)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(101, 98, 144, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(101, 98, 144, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(101, 98, 144, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(101, 98, 144, 0.2)';
                }}
              >
                <div style={{ fontSize: 'var(--font-4xl)', marginBottom: 'var(--spacing-md)' }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: 'var(--font-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: 'var(--font-md)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonial Section */}
        <section style={{
          padding: 'var(--spacing-5xl) var(--spacing-2xl)',
          background: 'rgba(47, 47, 47, 0.5)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            maxWidth: 900,
            margin: '0 auto',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: 'var(--font-4xl)',
              marginBottom: 'var(--spacing-lg)',
              opacity: 0.5,
              transform: 'scale(1.8)'
            }}>
              "
            </div>
            <p style={{
              fontSize: 'var(--font-2xl)',
              color: 'var(--text-primary)',
              lineHeight: 1.8,
              marginBottom: 'var(--spacing-xl)',
              fontStyle: 'italic'
            }}>
              Ravensearch has completely changed how I find work. The AI matching is spot-on,
              and I'm getting more jobs than ever before. Plus, the instant notifications mean
              I never miss an opportunity.
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--spacing-md)'
            }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(101, 98, 144, 0.3) 0%, rgba(101, 98, 144, 0.6) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--font-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)'
              }}>
                JM
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontSize: 'var(--font-lg)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)'
                }}>
                  John Martinez
                </div>
                <div style={{
                  fontSize: 'var(--font-md)',
                  color: 'var(--text-secondary)'
                }}>
                  HVAC Technician, Miami FL
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{
          padding: 'var(--spacing-5xl) var(--spacing-2xl)',
          textAlign: 'center',
          maxWidth: 800,
          margin: '0 auto'
        }}>
          <h2 style={{
            fontFamily: 'var(--font-section-title)',
            fontSize: 'var(--font-4xl)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            Ready to Grow Your Business?
          </h2>
          <p style={{
            fontSize: 'var(--font-xl)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--spacing-2xl)',
            lineHeight: 1.6
          }}>
            Join thousands of technicians who are already using Ravensearch to
            find more jobs, earn more money, and grow their businesses.
          </p>
          <button
            className="primary-button"
            onClick={() => setShowSignupModal(true)}
            style={{ fontSize: 'var(--font-lg)', padding: '16px 32px' }}
          >
            Join as Technician
          </button>
        </section>

        {/* Footer */}
        <footer style={{
          padding: 'var(--spacing-2xl)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: 'var(--font-sm)'
        }}>
          <p>© 2025 Ravensearch. All rights reserved.</p>
        </footer>
      </main>

      {/* Sign-up Modal */}
      <AnimatePresence>
        {showSignupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSignupModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 'var(--spacing-lg)'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'transparent',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                filter: 'brightness(1.3)',
                border: '2px solid rgba(101, 98, 144, 0.5)',
                borderRadius: 'var(--modal-border-radius)',
                maxWidth: 600,
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                padding: 'var(--spacing-2xl)',
                position: 'relative'
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowSignupModal(false)}
                style={{
                  position: 'absolute',
                  top: 'var(--spacing-lg)',
                  right: 'var(--spacing-lg)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <line x1="4" y1="4" x2="16" y2="16" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                  <line x1="16" y1="4" x2="4" y2="16" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>

              <form onSubmit={handleSubmit}>
                <h2 style={{
                  fontFamily: 'var(--font-section-title)',
                  fontSize: 'var(--font-3xl)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Join as Technician
                </h2>
                <p style={{
                  fontSize: 'var(--font-md)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--spacing-2xl)'
                }}>
                  Register your profile to start receiving work orders
                </p>

                {/* Profile Picture Section */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--spacing-lg)',
                  padding: 'var(--spacing-xl) 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: 'var(--spacing-xl)'
                }}>
                  <div style={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: previewUrl
                      ? `url(${previewUrl}) center/cover no-repeat`
                      : 'linear-gradient(135deg, rgba(101, 98, 144, 0.3) 0%, rgba(101, 98, 144, 0.6) 100%)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--font-3xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-section-title)'
                  }}>
                    {!previewUrl && getInitials()}
                  </div>

                  <div style={{ width: '100%' }}>
                    <label style={{
                      display: 'block',
                      fontSize: 'var(--font-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--spacing-sm)'
                    }}>
                      Profile Picture URL
                    </label>
                    <input
                      className="text-input"
                      type="url"
                      value={profilePictureUrl}
                      onChange={handleProfilePictureChange}
                      placeholder="https://example.com/your-photo.jpg"
                      style={{ width: '100%' }}
                    />
                    <p style={{
                      fontSize: 'var(--font-xs)',
                      color: 'var(--text-secondary)',
                      marginTop: 'var(--spacing-xs)'
                    }}>
                      Optional - Leave blank to use initials
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                  <div>
                    <label className="form-label">Full Name *</label>
                    <input
                      className="text-input"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label className="form-label">Email Address *</label>
                    <input
                      className="text-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label className="form-label">Phone Number *</label>
                    <input
                      className="text-input"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label className="form-label">Primary Trade *</label>
                    <select
                      className="text-input"
                      value={trade}
                      onChange={(e) => setTrade(e.target.value)}
                      required
                      style={{ width: '100%' }}
                    >
                      <option value="">Select your primary trade...</option>
                      <option value="HVAC">HVAC</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="Handyman">Handyman</option>
                      <option value="Carpentry">Carpentry</option>
                      <option value="Painting">Painting</option>
                      <option value="Roofing">Roofing</option>
                      <option value="Appliance Repair">Appliance Repair</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Street Address *</label>
                    <input
                      className="text-input"
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Main St"
                      required
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-md)' }}>
                    <div>
                      <label className="form-label">City *</label>
                      <input
                        className="text-input"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Miami"
                        required
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label className="form-label">State *</label>
                      <input
                        className="text-input"
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="FL"
                        maxLength={2}
                        required
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Years Experience *</label>
                    <input
                      className="text-input"
                      type="number"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      min="0"
                      max="50"
                      placeholder="5"
                      required
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label className="form-label">License Number (if applicable)</label>
                    <input
                      className="text-input"
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="License #"
                      style={{ width: '100%' }}
                    />
                  </div>

                  {error && (
                    <div style={{
                      padding: 'var(--spacing-md)',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 'var(--btn-corner-radius)',
                      color: '#EF4444',
                      fontSize: 'var(--font-sm)'
                    }}>
                      {error}
                    </div>
                  )}

                  {success && (
                    <div style={{
                      padding: 'var(--spacing-md)',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: 'var(--btn-corner-radius)',
                      color: '#10B981',
                      fontSize: 'var(--font-sm)'
                    }}>
                      ✓ Profile created successfully!
                    </div>
                  )}

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: '100%',
                      marginTop: 'var(--spacing-md)',
                      opacity: submitting ? 0.6 : 1,
                      cursor: submitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {submitting ? 'Creating Profile...' : 'Create Technician Profile'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
