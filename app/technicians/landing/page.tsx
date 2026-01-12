'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Hero from '../../../skills/landing-page-skill/components/Hero';
import FeatureCard from '../../../skills/landing-page-skill/components/FeatureCard';
import FeatureGrid from '../../../skills/landing-page-skill/components/FeatureGrid';
import CTASection from '../../../skills/landing-page-skill/components/CTASection';
import PageSection from '../../../skills/landing-page-skill/components/PageSection';

/**
 * Simple typing animation component
 */
function TypingText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
        }
      }, 30);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, delay]);

  return <>{displayedText}</>;
}

/**
 * Technicians Landing Page - Clean Version
 */
export default function TechniciansLandingPage() {
  const [dispatchStep, setDispatchStep] = useState(0);
  const [dispatchStats, setDispatchStats] = useState({
    techsSent: 0,
    techsOpened: 0,
    techsReplied: 0,
    openRate: 0
  });

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setDispatchStep(1);
      setDispatchStats({ techsSent: 23, techsOpened: 0, techsReplied: 0, openRate: 0 });
    }, 500);

    const timer2 = setTimeout(() => {
      setDispatchStep(2);
      setDispatchStats({ techsSent: 23, techsOpened: 18, techsReplied: 0, openRate: 78 });
    }, 1500);

    const timer3 = setTimeout(() => {
      setDispatchStep(3);
      setDispatchStats({ techsSent: 23, techsOpened: 21, techsReplied: 15, openRate: 91 });
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* HERO - Miami Beach Background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          position: 'relative',
          backgroundImage: 'url(https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=1920&q=90)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(47, 47, 47, 0.7)'
        }} />
        <div style={{ position: 'relative' }}>
          <Hero
            title="Stop Chasing Jobs. Let Jobs Find You."
            subtitle="Join 2,500+ technicians earning consistent income with smart job matching, real-time scheduling, and complete job information upfront."
            ctaText="Get Started Today"
            ctaLink="/technicians/signup"
            height="600px"
          />
        </div>
      </motion.div>

      {/* FEATURE 1 - Everglades Background */}
      <div style={{
        position: 'relative',
        backgroundImage: 'url(https://images.unsplash.com/photo-1580837119756-563d608dd119?w=1920&q=90)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(47, 47, 47, 0.75)'
        }} />
        <PageSection background="transparent" spacing="xl">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--spacing-5xl)',
            alignItems: 'center'
          }}>
            {/* Left Content */}
            <div>
              <div style={{
                fontSize: 'var(--font-sm)',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                marginBottom: 'var(--spacing-md)',
                textTransform: 'uppercase'
              }}>
                Pain Point: Job Finding
              </div>
              <h2 style={{
                fontFamily: 'var(--font-section-title)',
                fontSize: 'var(--font-3xl)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                Stop the Job Hunt
              </h2>
              <p style={{
                fontSize: 'var(--font-lg)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-xl)'
              }}>
                Tired of bidding wars and inconsistent work? Our AI-powered matching connects you with jobs that fit your skills, location, and schedule.
              </p>
            </div>

            {/* Right Animation */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                background: 'var(--container-bg)',
                border: 'var(--container-border)',
                borderRadius: 'var(--container-border-radius)',
                padding: 'var(--spacing-3xl)'
              }}
            >
              <h3 style={{
                fontSize: 'var(--font-lg)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-xl)'
              }}>
                Live Job Matching
              </h3>

              {dispatchStep === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700 }}>
                    📧 Dispatching Work Order
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{
                    fontSize: 'var(--font-md)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--spacing-lg)'
                  }}>
                    📊 Dispatch Status: {dispatchStats.techsSent} technicians
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                    {/* Warm Stats */}
                    <div style={{
                      background: 'var(--stats-bg-warm)',
                      border: '1px solid var(--stats-border-warm)',
                      borderRadius: '8px',
                      padding: 'var(--spacing-lg)'
                    }}>
                      <div style={{ fontSize: 'var(--font-sm)', marginBottom: 'var(--spacing-sm)' }}>
                        🔥 Warm (SendGrid)
                      </div>
                      <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--stats-text-warm)' }}>
                        {dispatchStats.techsOpened}
                      </div>
                    </div>

                    {/* Cold Stats */}
                    <div style={{
                      background: 'var(--stats-bg-cold)',
                      border: '1px solid var(--stats-border-cold)',
                      borderRadius: '8px',
                      padding: 'var(--spacing-lg)'
                    }}>
                      <div style={{ fontSize: 'var(--font-sm)', marginBottom: 'var(--spacing-sm)' }}>
                        ❄️ Cold (Instantly)
                      </div>
                      <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--stats-text-cold)' }}>
                        {dispatchStats.techsReplied}
                      </div>
                    </div>
                  </div>

                  {dispatchStep >= 2 && (
                    <div style={{ marginTop: 'var(--spacing-lg)', fontSize: 'var(--font-sm)', color: 'var(--success)' }}>
                      ✅ Qualified & Accepting: 15
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          <style jsx>{`
            @media (max-width: 1023px) {
              div[style*="grid-template-columns"] {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
        </PageSection>
      </div>

      {/* FEATURE 2 - Key West Background */}
      <div style={{
        position: 'relative',
        backgroundImage: 'url(https://images.unsplash.com/photo-1583225173959-91cdab6d9278?w=1920&q=90)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(47, 47, 47, 0.75)'
        }} />
        <PageSection background="transparent" spacing="xl">
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-3xl)' }}>
            <h2 style={{
              fontFamily: 'var(--font-section-title)',
              fontSize: 'var(--font-3xl)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              Everything You Need to Succeed
            </h2>
          </div>

          <FeatureGrid columns={3}>
            <FeatureCard
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2"/></svg>}
              title="Direct Payment Processing"
              description="Get paid instantly after job completion. Money in your account within 24 hours."
            />
            <FeatureCard
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2"/></svg>}
              title="Compliance Support"
              description="Automated license tracking, insurance reminders, and certification management."
            />
            <FeatureCard
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></svg>}
              title="Build Your Reputation"
              description="Showcase your skills and collect verified reviews from premium clients."
            />
          </FeatureGrid>
        </PageSection>
      </div>

      {/* TESTIMONIAL - Clearwater Beach Background */}
      <div style={{
        position: 'relative',
        backgroundImage: 'url(https://images.unsplash.com/photo-1589182373726-e4f658ab50b0?w=1920&q=90)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(47, 47, 47, 0.75)'
        }} />
        <PageSection background="transparent" spacing="xl">
          <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', color: 'var(--accent-primary)', marginBottom: 'var(--spacing-xl)', opacity: 0.3 }}>
              "
            </div>
            <p style={{
              fontSize: 'var(--font-xl)',
              color: 'var(--text-primary)',
              lineHeight: 1.8,
              marginBottom: 'var(--spacing-2xl)',
              fontStyle: 'italic'
            }}>
              I went from scrambling for jobs every week to having more work than I can handle. My first-time fix rate went from 60% to over 90%. I'm making 40% more and working fewer hours.
            </p>
            <div style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Marcus Rodriguez
            </div>
            <div style={{ fontSize: 'var(--font-md)', color: 'var(--text-secondary)' }}>
              HVAC Technician • Los Angeles, CA • 12 Years Experience
            </div>
          </div>
        </PageSection>
      </div>

      {/* CTA - Fort Lauderdale Background */}
      <div style={{
        position: 'relative',
        backgroundImage: 'url(https://images.unsplash.com/photo-1505881402981-37e37d52b290?w=1920&q=90)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(47, 47, 47, 0.75)'
        }} />
        <PageSection background="transparent" spacing="xl">
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <CTASection
              title="Ready to Take Control of Your Career?"
              description="Join thousands of technicians who stopped chasing jobs and started growing their business."
              buttonText="Get Started Today"
              buttonLink="/technicians/signup"
            />

            <div style={{
              marginTop: 'var(--spacing-3xl)',
              display: 'flex',
              justifyContent: 'center',
              gap: 'var(--spacing-3xl)',
              flexWrap: 'wrap'
            }}>
              {['30 days free trial', 'No credit card needed', 'Cancel anytime', 'Setup in 5 minutes'].map((text, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  fontSize: 'var(--font-md)',
                  color: 'var(--text-secondary)'
                }}>
                  <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </PageSection>
      </div>

      {/* FOOTER */}
      <footer style={{
        background: 'var(--bg-primary)',
        borderTop: 'var(--container-border)',
        padding: 'var(--spacing-3xl) var(--spacing-2xl)',
        color: 'var(--text-secondary)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', fontSize: 'var(--font-sm)' }}>
          <p style={{ marginBottom: 'var(--spacing-md)' }}>
            © 2025 RavenSearch. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 'var(--spacing-xl)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Privacy</a>
            <a href="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Terms</a>
            <a href="/contact" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
