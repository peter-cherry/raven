import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="content-area">
      {/* Hero */}
      <section className="landing-hero">
        <h1 className="header-title landing-hero-title">Find, verify, and assign technicians faster</h1>
        <p className="header-subtitle landing-hero-sub">HVAC • Plumbing • Electrical • Handyman — one place to recruit, verify compliance, and dispatch nearby pros.</p>
        <div className="landing-hero-ctas">
          <Link href="/signup" className="primary-button">Get started</Link>
          <Link href="/" className="outline-button">Go to Home →</Link>
        </div>
      </section>

      {/* Value props */}
      <section className="landing-values">
        <div className="value-card">
          <div className="value-title">Smart matching</div>
          <div className="value-copy">Distance‑based ranking with compliance lights for COI and licenses.</div>
        </div>
        <div className="value-card">
          <div className="value-title">Zero guesswork</div>
          <div className="value-copy">See reasons for every recommendation and assign with one click.</div>
        </div>
        <div className="value-card">
          <div className="value-title">Faster onboarding</div>
          <div className="value-copy">Handyman, HVAC, Plumbing, and Electrical — optimized flows per trade.</div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="landing-testimonials">
        <h2 className="section-title">Trusted by local pros</h2>
        <div className="testimonial-list">
          <article className="testimonial-card">
            <div className="testimonial-name">Mike R. — Handyman</div>
            <p className="testimonial-quote">“I average 15 jobs/month and never chase payments.”</p>
          </article>
          <article className="testimonial-card">
            <div className="testimonial-name">Alicia P. — Plumbing</div>
            <p className="testimonial-quote">“Emergency calls + maintenance contracts keep the calendar full.”</p>
          </article>
          <article className="testimonial-card">
            <div className="testimonial-name">Carlos M. — Electrical</div>
            <p className="testimonial-quote">“Commercial work, verified clients, and 48‑hour payouts.”</p>
          </article>
        </div>
      </section>

      {/* Dashboard CTA */}
      <section className="landing-dashboard">
        <div className="dashboard-copy">
          <h3 className="section-title">Explore the dashboard</h3>
          <p className="section-subtitle">Create a work order, preview nearby matches, and assign instantly.</p>
          <div className="landing-hero-ctas">
            <Link href="/jobs/create" className="primary-button">Create a work order</Link>
            <Link href="/" className="cta-muted-link">Go to Home →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
