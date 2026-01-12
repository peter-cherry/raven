'use client';

import Hero from './components/Hero';
import StatCard from './components/StatCard';
import FeatureCard from './components/FeatureCard';
import FeatureGrid from './components/FeatureGrid';
import CTASection from './components/CTASection';
import PageSection from './components/PageSection';

/**
 * Sample Landing Page - Trade Services Platform
 * 
 * Demonstrates all landing page components using globals.css design tokens
 * This is a complete, working example you can customize
 */
export default function SampleLandingPage() {
  return (
    <main style={{ background: 'var(--bg-primary)' }}>
      {/* Hero Section */}
      <Hero
        title="Connect with Qualified Technicians"
        subtitle="Find HVAC, plumbing, and electrical experts in minutes. Our platform makes it easy to match with verified professionals."
        ctaText="Get Started Free"
        ctaLink="/signup"
        height="600px"
      />

      {/* Stats Section */}
      <PageSection spacing="xl">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--spacing-xl)'
        }}>
          <StatCard 
            number="1,000+" 
            label="Active Technicians" 
            sublabel="Verified & insured"
            accentColor="var(--success)"
          />
          <StatCard 
            number="5,000+" 
            label="Jobs Completed" 
            sublabel="This month"
            accentColor="var(--accent-primary)"
          />
          <StatCard 
            number="98%" 
            label="Success Rate" 
            sublabel="Customer satisfaction"
            accentColor="var(--success)"
          />
        </div>
      </PageSection>

      {/* Features Section 1 - Smart Matching */}
      <PageSection spacing="xl">
        <h2 style={{
          fontFamily: 'var(--font-section-title)',
          fontSize: 'var(--font-section-title-size)',
          fontWeight: 'var(--font-section-title-weight)',
          color: 'var(--text-primary)',
          textAlign: 'center',
          marginBottom: 'var(--spacing-3xl)'
        }}>
          Why Choose Our Platform?
        </h2>
        <FeatureGrid columns={3}>
          <FeatureCard
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2"/>
                <path d="M15 15L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            }
            title="Smart Matching"
            description="Our AI-powered algorithm instantly matches you with the perfect technician based on skills, location, and availability."
            ctaText="Learn More"
            ctaLink="/features/matching"
          />
          <FeatureCard
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            title="Verified Professionals"
            description="Every technician is background-checked, licensed, and insured. We verify credentials so you don't have to."
            ctaText="View Process"
            ctaLink="/verification"
          />
          <FeatureCard
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            }
            title="Real-Time Tracking"
            description="Track your service request from posting to completion. Get live updates and communicate directly with your technician."
            ctaText="See Demo"
            ctaLink="/demo"
          />
        </FeatureGrid>
      </PageSection>

      {/* Features Section 2 - Platform Benefits */}
      <PageSection spacing="xl" background="primary">
        <h2 style={{
          fontFamily: 'var(--font-section-title)',
          fontSize: 'var(--font-section-title-size)',
          fontWeight: 'var(--font-section-title-weight)',
          color: 'var(--text-primary)',
          textAlign: 'center',
          marginBottom: 'var(--spacing-3xl)'
        }}>
          Everything You Need
        </h2>
        <FeatureGrid columns={3}>
          <FeatureCard
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M9 11L11 13L15 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            title="Compliance Management"
            description="Automated tracking of licenses, insurance, and certifications. Never miss an expiration date."
          />
          <FeatureCard
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 6 6 3 9 3C10.5 3 12 4 12 4C12 4 13.5 3 15 3C18 3 21 6 21 10Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            }
            title="Service Area Coverage"
            description="Visual service area mapping ensures you're only matched with techs who can reach your location."
          />
          <FeatureCard
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            title="Job Management"
            description="Organize, schedule, and track all your jobs in one centralized dashboard. Stay in control."
          />
        </FeatureGrid>
      </PageSection>

      {/* CTA Section */}
      <PageSection spacing="xl">
        <CTASection
          title="Ready to Get Started?"
          description="Join hundreds of service providers and property managers who trust our platform to connect with qualified technicians. Sign up free today."
          buttonText="Create Free Account"
          buttonLink="/signup"
          centered={true}
        />
      </PageSection>

      {/* Footer spacing */}
      <div style={{ height: 'var(--spacing-5xl)' }} />
    </main>
  );
}
