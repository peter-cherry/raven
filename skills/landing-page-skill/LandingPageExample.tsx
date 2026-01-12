'use client';

import { useState } from 'react';
import Hero from './components/Hero';
import StatCard from './components/StatCard';
import FeatureSection from './components/FeatureSection';
import CTASection from './components/CTASection';

/**
 * Example Landing Page
 * 
 * Demonstrates the complete landing page skill components
 * based on Trade Services Platform patterns.
 * 
 * To use this template:
 * 1. Copy this file to your app directory
 * 2. Customize content, CTAs, and features
 * 3. Add your own images and icons
 * 4. Connect real onClick handlers
 */
export default function LandingPageExample() {
  const [showDemo, setShowDemo] = useState(false);

  // Feature data
  const features = [
    {
      title: "Job Management",
      description: "Post, track, and manage all service requests in one centralized platform. Never lose track of a job again.",
      icon: "📋"
    },
    {
      title: "Technician Network",
      description: "Access to verified, compliant trade professionals across all specialties. Background checks included.",
      icon: "👷"
    },
    {
      title: "Real-time Tracking",
      description: "Monitor job progress and technician location live on an interactive map. Get instant updates.",
      icon: "📍"
    },
    {
      title: "Compliance Hub",
      description: "Automated tracking of licenses, insurance, and certifications. Stay compliant effortlessly.",
      icon: "✅"
    },
    {
      title: "Smart Matching",
      description: "AI-powered matching engine connects you with the best technicians based on skills and location.",
      icon: "🎯"
    },
    {
      title: "Analytics Dashboard",
      description: "Comprehensive reporting and insights to optimize your operations and reduce costs.",
      icon: "📊"
    }
  ];

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Hero
        title="Trade Services Platform"
        subtitle="Connect with qualified technicians instantly. Streamline operations, reduce costs, and scale your business."
        ctaText="Start Free Trial"
        ctaLink="/signup"
      />

      {/* Stats Section */}
      <section
        style={{
          padding: 'var(--spacing-5xl) var(--spacing-3xl)',
          background: 'var(--bg-primary)'
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-xl)'
          }}
        >
          <StatCard
            label="Active Jobs"
            number="24"
            sublabel="↑ 12% from last week"
            accentColor="var(--accent-primary)"
          />
          <StatCard
            label="Available Techs"
            number="48"
            sublabel="85% compliant"
            accentColor="var(--success)"
          />
          <StatCard
            label="Pending Matches"
            number="7"
            sublabel="Awaiting assignment"
            accentColor="var(--warning)"
          />
        </div>
      </section>

      {/* Features Section */}
      <FeatureSection
        title="Everything You Need to Succeed"
        subtitle="Comprehensive tools to manage your trade services business efficiently"
        features={features}
        columns={3}
      />

      {/* Secondary CTA */}
      <section
        style={{
          padding: 'var(--spacing-5xl) var(--spacing-3xl)',
          background: 'var(--container-bg)',
          borderTop: 'var(--container-border)',
          borderBottom: 'var(--container-border)'
        }}
      >
        <div
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            textAlign: 'center'
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-section-title)',
              fontSize: 'var(--font-3xl)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-lg)'
            }}
          >
            Trusted by Industry Leaders
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-text-body)',
              fontSize: 'var(--font-lg)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--spacing-2xl)',
              lineHeight: 1.6
            }}
          >
            Join hundreds of businesses streamlining their operations with our platform.
            From small contractors to enterprise facilities management.
          </p>

          {/* Logo placeholders */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'var(--spacing-3xl)',
              flexWrap: 'wrap',
              alignItems: 'center',
              opacity: 0.6
            }}
          >
            {['Company A', 'Company B', 'Company C', 'Company D'].map((company, i) => (
              <div
                key={i}
                style={{
                  fontFamily: 'var(--font-section-title)',
                  fontSize: 'var(--font-lg)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600
                }}
              >
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        style={{
          padding: 'var(--spacing-5xl) var(--spacing-3xl)',
          background: 'var(--bg-primary)'
        }}
      >
        <div
          style={{
            maxWidth: '1000px',
            margin: '0 auto'
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-section-title)',
              fontSize: 'var(--font-3xl)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              textAlign: 'center',
              marginBottom: 'var(--spacing-4xl)'
            }}
          >
            How It Works
          </h2>

          {/* Steps */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--spacing-2xl)'
            }}
          >
            {[
              { step: '1', title: 'Post Your Job', desc: 'Describe the work that needs to be done with all relevant details' },
              { step: '2', title: 'Get Matched', desc: 'Our AI finds qualified technicians in your area instantly' },
              { step: '3', title: 'Track Progress', desc: 'Monitor job status, location, and completion in real-time' }
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--accent-primary)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--font-3xl)',
                    fontWeight: 'bold',
                    margin: '0 auto var(--spacing-lg)'
                  }}
                >
                  {item.step}
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-text-body)',
                    fontSize: 'var(--font-lg)',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--spacing-sm)'
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-text-body)',
                    fontSize: 'var(--font-md)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <CTASection
        title="Ready to Transform Your Operations?"
        description="Start your 14-day free trial today. No credit card required."
        buttonText="Get Started Now"
        buttonLink="/signup"
        centered={true}
      />

      {/* Footer */}
      <footer
        style={{
          background: 'var(--bg-primary)',
          borderTop: 'var(--container-border)',
          padding: 'var(--spacing-3xl) var(--spacing-3xl)',
          color: 'var(--text-secondary)',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            fontFamily: 'var(--font-text-body)',
            fontSize: 'var(--font-sm)'
          }}
        >
          <p style={{ marginBottom: 'var(--spacing-md)' }}>
            © 2025 Trade Services Platform. All rights reserved.
          </p>
          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-xl)',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}
          >
            <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Terms</a>
            <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Contact</a>
          </div>
        </div>
      </footer>

      {/* Responsive Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          section {
            padding: var(--spacing-4xl) var(--spacing-lg) !important;
          }
        }
      `}</style>
    </div>
  );
}
