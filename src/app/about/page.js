import Navigation from '../../components/Navigation'
import Link from 'next/link'

export const metadata = {
  title: 'Our Beliefs - Guest Signal Hospitality',
  description: 'Learn about Guest Signal Hospitality\'s mission, values, and commitment to helping independent restaurants thrive through data-driven insights.',
}

export default function About() {
  return (
    <>
      <Navigation />
      <section className="about-hero">
        <div className="container">
          <div className="about-hero-content">
            <h1 className="about-hero-title">Our Beliefs</h1>
            <p className="about-hero-subtitle">
              Every independent restaurant deserves the intelligence to compete, grow, and create exceptional guest experiences.
            </p>
          </div>
        </div>
      </section>
      <section className="mission-section">
        <div className="container">
          <div className="mission-content">
            <div className="mission-text">
              <span className="section-label">Our Mission</span>
              <h2>Empowering Independent Restaurants with Actionable Intelligence</h2>
              <p>
                At Guest Signal Hospitality, we believe independent restaurants are the backbone of our communities. 
                Yet many operators lack access to the same level of operational intelligence and competitive insight 
                available to large chains.
              </p>
              <p>
                Our mission is to close that gap.
              </p>
              <p>
                We transform guest feedback, review data, and market signals into clear, actionable intelligence—helping 
                independent restaurant owners strengthen their operations, protect their reputation, and grow sustainably.
              </p>
              <p>
                By democratizing hospitality intelligence, we enable passionate operators to make smarter decisions, 
                deliver exceptional guest experiences, and build stronger, more resilient businesses.
              </p>
            </div>
          </div>
        </div>
      </section>
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="logo-container footer-logo">
                <img src="/logo.png" alt="Guest Signal Hospitality Logo" className="logo" />
                <div className="logo-text">
                  <span className="logo-main">GUEST SIGNAL</span>
                  <span className="logo-sub">HOSPITALITY</span>
                </div>
              </div>
              <p>Hospitality Intelligence & Guest Experience Analytics</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Services</h4>
                <ul>
                  <li><a href="/#services">Review Analysis</a></li>
                  <li><a href="/#services">Competitive Intelligence</a></li>
                  <li><a href="/#audit">Guest Intelligence Audit</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <ul>
                  <li><Link href="/about">About Us</Link></li>
                  <li><a href="/#contact">Contact Us</a></li>
                  <li><a href="/#audit">Pricing</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Guest Signal Hospitality. All rights reserved.</p>
            <p className="domain">guestsignalhospitality.com</p>
          </div>
        </div>
      </footer>
    </>
  )
}

