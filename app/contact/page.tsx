import Link from 'next/link';

export default function ContactPage() {
  return (
    <main className="content-area">
      <div className="container-card" style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 className="header-title">Contact us</h1>
        <p className="header-subtitle">We'd love to hear from you. Send a message and our team will get back within 1 business day.</p>

        <form className="form-grid" action="mailto:hello@ravensearch.app" method="post" encType="text/plain">
          <div className="form-field">
            <label className="form-label" htmlFor="name">Your name</label>
            <input id="name" name="name" className="text-input" required />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" className="text-input" required />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="message">Message</label>
            <textarea id="message" name="message" className="textarea-input" required />
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button type="submit" className="primary-button">Send message</button>
            <Link href="/" className="cta-muted-link">Go to Home →</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
