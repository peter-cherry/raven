'use client'

import HeroSection from './components/HeroSection'
import ValuePropSection from './components/ValuePropSection'
import HowItWorks from './components/HowItWorks'
import FeaturesSection from './components/FeaturesSection'
import CaseStudiesSection from './components/CaseStudiesSection'
import PricingSection from './components/PricingSection'
import FAQSection from './components/FAQSection'
import CTASection from './components/CTASection'

export default function OperatorsLandingClient() {
  const handleCTAClick = () => {
    // TODO: Implement signup/demo modal or navigation
    console.log('CTA clicked - implement signup flow')
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background pattern overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(101, 98, 144, 0.08) 0%, transparent 40%),
          radial-gradient(circle at 80% 70%, rgba(101, 98, 144, 0.06) 0%, transparent 40%)
        `,
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HeroSection onCtaClick={handleCTAClick} />
        <ValuePropSection />
        <HowItWorks />
        <FeaturesSection />
        <CaseStudiesSection />
        <PricingSection />
        <FAQSection />
        <CTASection onCtaClick={handleCTAClick} />
      </div>

      {/* Footer */}
      <footer style={{
        padding: 'var(--spacing-3xl) var(--spacing-2xl)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(47, 47, 47, 0.5)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--spacing-3xl)'
        }}>
          {/* Company */}
          <div>
            <h3 style={{
              fontSize: 'var(--font-xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              Raven
            </h3>
            <p style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: 'var(--spacing-lg)'
            }}>
              The modern platform connecting facility managers with verified maintenance technicians.
            </p>
            <div style={{
              fontSize: 'var(--font-sm)',
              color: 'var(--text-secondary)'
            }}>
              © 2025 Raven. All rights reserved.
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 style={{
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              Product
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              {['Features', 'Pricing', 'Case Studies', 'Integrations', 'Security'].map((item) => (
                <li key={item} style={{ marginBottom: 'var(--spacing-sm)' }}>
                  <a
                    href={`#${item.toLowerCase().replace(' ', '-')}`}
                    style={{
                      fontSize: 'var(--font-md)',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 style={{
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              Resources
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              {['Blog', 'Help Center', 'API Docs', 'System Status', 'Contact'].map((item) => (
                <li key={item} style={{ marginBottom: 'var(--spacing-sm)' }}>
                  <a
                    href={`#${item.toLowerCase().replace(' ', '-')}`}
                    style={{
                      fontSize: 'var(--font-md)',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              Legal
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Compliance'].map((item) => (
                <li key={item} style={{ marginBottom: 'var(--spacing-sm)' }}>
                  <a
                    href={`#${item.toLowerCase().replace(' ', '-')}`}
                    style={{
                      fontSize: 'var(--font-md)',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </main>
  )
}
