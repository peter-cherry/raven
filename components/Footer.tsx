import Link from 'next/link';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand-name">RAVENSEARCH</span>
          <p className="footer-tag">Find, verify, and assign technicians faster.</p>
        </div>
        <nav className="footer-links">
          <Link href="/" className="footer-link">Home</Link>
          <Link href="/jobs" className="footer-link">Jobs</Link>
          <Link href="/technicians" className="footer-link">Technicians</Link>
          <Link href="/compliance" className="footer-link">Compliance</Link>
          <Link href="/contact" className="footer-link">Contact</Link>
        </nav>
        <div className="footer-contact">
          <div className="footer-contact-line">Email: <a className="footer-link" href="mailto:hello@ravensearch.app">hello@ravensearch.app</a></div>
          <div className="footer-contact-line">Address: 123 Business Street, Miami, FL 33101</div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Ravensearch. All rights reserved.</span>
      </div>
    </footer>
  );
}
