'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TechniciansLanding() {
  const router = useRouter();
  const [exitModalShown, setExitModalShown] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    // Scroll reveal animation
    const revealOnScroll = () => {
      const sections = document.querySelectorAll('section');
      sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        if (sectionTop < windowHeight * 0.85) {
          section.classList.add('visible');
        }
      });
    };

    // Animated counters
    const animateCounters = () => {
      const counters = document.querySelectorAll('.counter');
      counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target') || '0');
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
          current += increment;
          if (current < target) {
            counter.textContent = Math.floor(current).toString();
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = target.toString();
          }
        };

        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && counter.textContent === '0') {
              updateCounter();
            }
          });
        }, { threshold: 0.5 });

        observer.observe(counter);
      });
    };

    // Exit intent detection
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitModalShown) {
        setExitModalShown(true);
        setShowExitModal(true);
      }
    };

    window.addEventListener('scroll', revealOnScroll);
    document.addEventListener('mouseleave', handleMouseLeave);

    revealOnScroll();
    animateCounters();

    return () => {
      window.removeEventListener('scroll', revealOnScroll);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [exitModalShown]);

  const handleSignup = () => {
    router.push('/contractors/onboarding');
  };

  const scrollToSignup = () => {
    document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: #FAFAFA;
          color: #333;
          overflow-x: hidden;
        }

        html {
          scroll-behavior: smooth;
        }

        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #2A2931;
          color: white;
          position: relative;
          overflow: hidden;
        }

        .hero-bg-grid {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(rgba(108, 114, 201, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(108, 114, 201, 0.03) 1px, transparent 1px);
          background-size: 100px 100px;
          opacity: 0.3;
          animation: gridMove 20s linear infinite;
        }

        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(100px, 100px); }
        }

        .hero-content {
          text-align: center;
          max-width: 1200px;
          padding: 0 40px;
          position: relative;
          z-index: 1;
          animation: fadeInUp 1s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hero h1 {
          font-size: clamp(48px, 8vw, 96px);
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 30px;
          letter-spacing: -0.02em;
          animation: fadeInUp 1s ease-out 0.2s both;
        }

        .hero-subtitle {
          font-size: clamp(20px, 3vw, 32px);
          line-height: 1.5;
          margin-bottom: 20px;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 400;
          animation: fadeInUp 1s ease-out 0.4s both;
        }

        .hero-text {
          font-size: clamp(18px, 2.5vw, 28px);
          line-height: 1.6;
          margin-bottom: 60px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 300;
          animation: fadeInUp 1s ease-out 0.6s both;
        }

        .cta-button {
          background: #6C72C9;
          color: white;
          border: none;
          padding: 24px 60px;
          font-size: 20px;
          font-weight: 600;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(108, 114, 201, 0.2);
          transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
          animation: fadeInUp 1s ease-out 0.8s both;
          display: inline-block;
          text-decoration: none;
        }

        .cta-button:hover {
          transform: scale(1.05);
          box-shadow: 0 20px 40px rgba(108, 114, 201, 0.3);
        }

        .cta-button:active {
          transform: scale(0.95);
        }

        .hero-small-text {
          margin-top: 24px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          animation: fadeIn 1s ease-out 1s both;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .scroll-indicator {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-10px); }
        }

        section {
          padding: 200px 40px;
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }

        section.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .section-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .section-container-wide {
          max-width: 1200px;
          margin: 0 auto;
        }

        h2 {
          font-size: clamp(36px, 5vw, 60px);
          font-weight: 700;
          margin-bottom: 60px;
          color: #000;
          line-height: 1.2;
        }

        .text-large {
          font-size: clamp(20px, 2.5vw, 28px);
          line-height: 1.8;
          color: #333;
          margin-bottom: 20px;
        }

        .text-accent {
          font-size: clamp(24px, 3vw, 36px);
          font-weight: 600;
          color: #6C72C9;
          margin-top: 60px;
        }

        .problem-section {
          background: #FAFAFA;
        }

        .solution-section {
          background: linear-gradient(180deg, #FAFAFA 0%, #F0F0F0 100%);
          text-align: center;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 60px;
          margin-top: 80px;
        }

        .benefit-card {
          padding: 40px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          transition: all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1);
          cursor: default;
        }

        .benefit-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .benefit-emoji {
          font-size: 48px;
          margin-bottom: 20px;
        }

        .benefit-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 16px;
          color: #000;
        }

        .benefit-description {
          font-size: 18px;
          line-height: 1.6;
          color: #666;
        }

        .stats-section {
          background: #2A2931;
          color: white;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 60px;
          text-align: center;
        }

        .stat-number {
          font-size: clamp(48px, 6vw, 72px);
          font-weight: 800;
          color: #6C72C9;
          margin-bottom: 16px;
        }

        .stat-label {
          font-size: 20px;
          color: rgba(255, 255, 255, 0.7);
        }

        .steps-container {
          position: relative;
          margin-top: 80px;
        }

        .steps-line {
          position: absolute;
          left: 40px;
          top: 60px;
          bottom: 60px;
          width: 2px;
          background: linear-gradient(180deg, #6C72C9 0%, rgba(108, 114, 201, 0.2) 100%);
        }

        .step {
          display: flex;
          align-items: flex-start;
          margin-bottom: 100px;
          position: relative;
        }

        .step:last-child {
          margin-bottom: 0;
        }

        .step-number {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #6C72C9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 800;
          color: white;
          flex-shrink: 0;
          margin-right: 40px;
          box-shadow: 0 10px 30px rgba(108, 114, 201, 0.3);
          transition: transform 0.3s ease;
        }

        .step-number:hover {
          transform: scale(1.1);
        }

        .step-content {
          flex: 1;
          padding-top: 10px;
        }

        .step-title {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 16px;
          color: #000;
        }

        .step-description {
          font-size: 20px;
          line-height: 1.6;
          color: #666;
        }

        .testimonial {
          background: white;
          padding: 60px;
          border-radius: 24px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          margin-bottom: 60px;
          transition: transform 0.3s ease;
        }

        .testimonial:hover {
          transform: scale(1.02);
        }

        .testimonial-text {
          font-size: 28px;
          line-height: 1.6;
          color: #333;
          margin-bottom: 24px;
          font-style: italic;
        }

        .testimonial-author {
          font-size: 18px;
          color: #666;
          font-weight: 600;
        }

        .faq-item {
          margin-bottom: 40px;
          padding-left: 20px;
          border-left: 4px solid rgba(108, 114, 201, 0);
          transition: all 0.3s ease;
        }

        .faq-item:hover {
          border-left-color: #6C72C9;
          padding-left: 30px;
        }

        .faq-question {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 12px;
          color: white;
        }

        .faq-answer {
          font-size: 18px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.7);
        }

        .exit-modal {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          z-index: 1000;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease-out;
        }

        .exit-modal.show {
          display: flex;
        }

        .exit-modal-content {
          background: white;
          border-radius: 24px;
          padding: 60px;
          max-width: 500px;
          width: 90%;
          text-align: center;
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: scaleIn 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          font-size: 32px;
          cursor: pointer;
          color: #999;
          line-height: 1;
          padding: 0;
          width: 32px;
          height: 32px;
        }

        .exit-modal h3 {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 20px;
          color: #000;
        }

        .exit-modal p {
          font-size: 20px;
          line-height: 1.6;
          color: #666;
          margin-bottom: 40px;
        }

        .exit-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .exit-form input {
          padding: 16px;
          font-size: 16px;
          border-radius: 8px;
          border: 2px solid #E0E0E0;
          outline: none;
          transition: border-color 0.3s ease;
        }

        .exit-form input:focus {
          border-color: #6C72C9;
        }

        .exit-form button {
          background: #6C72C9;
          color: white;
          border: none;
          padding: 16px;
          font-size: 18px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .exit-form button:hover {
          transform: scale(1.02);
        }

        footer {
          padding: 60px 40px;
          text-align: center;
          border-top: 1px solid #E0E0E0;
        }

        footer p {
          font-size: 14px;
          color: #999;
        }

        @media (max-width: 768px) {
          section {
            padding: 100px 20px;
          }

          .hero-content {
            padding: 0 20px;
          }

          .cta-button {
            padding: 20px 40px;
            font-size: 18px;
          }

          .benefit-card {
            padding: 30px;
          }

          .testimonial {
            padding: 40px 30px;
          }

          .exit-modal-content {
            padding: 40px 30px;
          }

          .step {
            flex-direction: column;
            align-items: flex-start;
          }

          .step-number {
            margin-bottom: 20px;
          }

          .steps-line {
            display: none;
          }
        }
      `}</style>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg-grid"></div>
        <div className="hero-content">
          <h1>Stop paying for leads.</h1>
          <p className="hero-subtitle">Get commercial facility work sent directly to you.</p>
          <p className="hero-text">No bidding. No lead fees. Just jobs.</p>
          <button className="cta-button" onClick={scrollToSignup}>Get Commercial Jobs →</button>
          <p className="hero-small-text">No credit card required. Join in 5 minutes.</p>
        </div>
        <div className="scroll-indicator">
          <svg width="30" height="50" viewBox="0 0 30 50">
            <rect x="5" y="5" width="20" height="40" rx="10" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none"/>
            <circle cx="15" cy="15" r="3" fill="rgba(255,255,255,0.5)"/>
          </svg>
        </div>
      </section>

      {/* Problem Section */}
      <section className="problem-section">
        <div className="section-container">
          <h2>The current system is broken.</h2>
          <p className="text-large">$50/lead on Thumbtack. Maybe you win the job. Maybe you don't.</p>
          <p className="text-large">Race to the bottom against unlicensed workers.</p>
          <p className="text-large">Feast or famine. Repeat.</p>
          <p className="text-accent">There's a better way.</p>
        </div>
      </section>

      {/* Solution Section */}
      <section className="solution-section">
        <div className="section-container">
          <h2>Simple.</h2>
          <p className="text-large">Raven connects licensed technicians with facility management companies.</p>
          <p className="text-large">They need qualified contractors for commercial work.<br/>You need consistent, well-paying jobs.</p>
          <p className="text-accent">We match you. Simple.</p>
        </div>
      </section>

      {/* Benefits Section */}
      <section>
        <div className="section-container-wide">
          <h2 style={{ textAlign: 'center' }}>Why technicians choose us.</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-emoji">💰</div>
              <div className="benefit-title">Better Pay</div>
              <p className="benefit-description">$75/hr commercial vs. $50/hr residential.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-emoji">📅</div>
              <div className="benefit-title">Consistent Work</div>
              <p className="benefit-description">Facilities need maintenance year-round.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-emoji">✓</div>
              <div className="benefit-title">No Lead Fees</div>
              <p className="benefit-description">We don't charge you to access jobs.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-emoji">⭐</div>
              <div className="benefit-title">Build Reputation</div>
              <p className="benefit-description">Your verified record follows you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="section-container-wide">
          <div className="stats-grid">
            <div>
              <div className="stat-number"><span className="counter" data-target="500">0</span>+</div>
              <div className="stat-label">Licensed Technicians</div>
            </div>
            <div>
              <div className="stat-number"><span className="counter" data-target="3000">0</span>+</div>
              <div className="stat-label">Jobs Completed</div>
            </div>
            <div>
              <div className="stat-number">$<span className="counter" data-target="75">0</span>/hr</div>
              <div className="stat-label">Average Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section>
        <div className="section-container">
          <h2 style={{ textAlign: 'center' }}>How it works.</h2>
          <div className="steps-container">
            <div className="steps-line"></div>
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <div className="step-title">Verify</div>
                <p className="step-description">Upload your licenses and insurance. We track renewals for you.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <div className="step-title">Match</div>
                <p className="step-description">Get notified when commercial jobs match your trade and location.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <div className="step-title">Work</div>
                <p className="step-description">Claim jobs you want. Do the work. Get paid.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="solution-section">
        <div className="section-container">
          <div className="testimonial">
            <p className="testimonial-text">&ldquo;Finally, work that pays what I&apos;m worth.&rdquo;</p>
            <p className="testimonial-author">— Mike Johnson, Licensed HVAC, Miami</p>
          </div>
          <div style={{ textAlign: 'center', fontSize: 20, color: '#666' }}>
            <strong style={{ color: '#000' }}>500+ licensed technicians.</strong> 3,000+ commercial jobs completed.
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section>
        <div className="section-container" style={{ textAlign: 'center' }}>
          <h2>Free for technicians.</h2>
          <p className="text-large">No subscription. No lead fees. No hidden costs.</p>
          <p style={{ fontSize: 20, lineHeight: 1.6, color: '#666', marginTop: 30 }}>
            We get paid when facility companies use our platform.<br/>
            You get paid when you do the work.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="stats-section">
        <div className="section-container">
          <h2 style={{ textAlign: 'center', color: 'white' }}>Questions?</h2>
          <div className="faq-item">
            <div className="faq-question">How do I get paid?</div>
            <p className="faq-answer">Directly by the facility company you work for. We facilitate the connection, they handle payment.</p>
          </div>
          <div className="faq-item">
            <div className="faq-question">What if I'm already busy?</div>
            <p className="faq-answer">Only claim jobs when you have capacity. No obligation to accept every notification.</p>
          </div>
          <div className="faq-item">
            <div className="faq-question">Who are the facility companies?</div>
            <p className="faq-answer">Professional IFM companies managing commercial properties, retail chains, office buildings, and industrial facilities.</p>
          </div>
          <div className="faq-item">
            <div className="faq-question">How do you verify my credentials?</div>
            <p className="faq-answer">You upload your licenses and insurance. We track expirations and send reminders. Facility companies verify before hiring.</p>
          </div>
          <div className="faq-item">
            <div className="faq-question">Can I work for multiple companies?</div>
            <p className="faq-answer">Yes. You&apos;re an independent contractor. Work for as many companies as you want.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="signup">
        <div className="section-container" style={{ textAlign: 'center' }}>
          <h2>Stop competing on price.<br/>Start getting paid for your expertise.</h2>
          <button className="cta-button" onClick={handleSignup}>Get Commercial Jobs →</button>
          <p style={{ marginTop: 24, fontSize: 16, color: '#999' }}>
            No credit card required. Join in 5 minutes.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <p>© 2025 Raven Search. All rights reserved.</p>
      </footer>

      {/* Exit Intent Modal */}
      <div className={`exit-modal ${showExitModal ? 'show' : ''}`}>
        <div className="exit-modal-content">
          <button className="close-btn" onClick={() => setShowExitModal(false)}>×</button>
          <h3>One more thing.</h3>
          <p>Join 500+ licensed techs getting commercial work.<br/><strong>Zero lead fees. Ever.</strong></p>
          <div className="exit-form">
            <button type="button" onClick={handleSignup}>Start Onboarding →</button>
          </div>
        </div>
      </div>
    </>
  );
}
