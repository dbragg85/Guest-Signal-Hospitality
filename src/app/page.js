import Navigation from '../components/Navigation'
import ContactForm from '../components/ContactForm'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Navigation />
      
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Hospitality Intelligence &<br />
              <span className="highlight">Guest Experience Analytics</span>
            </h1>
            <p className="hero-subtitle">
              We help restaurants identify operational strengths, guest experience gaps, and revenue opportunities through advanced review intelligence and competitive analysis.
            </p>
            <div className="hero-cta">
              <a href="#audit" className="btn btn-primary">Get Your Guest Intelligence Audit</a>
              <a href="#services" className="btn btn-secondary">Learn More</a>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">48hrs</span>
                <span className="stat-label">Delivery Time</span>
              </div>
              <div className="stat">
                <span className="stat-number">$149</span>
                <span className="stat-label">Intro Price</span>
              </div>
              <div className="stat">
                <span className="stat-number">5+</span>
                <span className="stat-label">Actionable Insights</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,60 Q300,20 600,60 T1200,60 L1200,120 L0,120 Z" fill="currentColor" />
          </svg>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">What We Do</h2>
            <p className="section-subtitle">Transform guest feedback into actionable business intelligence</p>
          </div>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 20 50 Q 30 30 50 50 T 80 50" stroke="#00b4d8" strokeWidth="6" fill="none" strokeLinecap="round" />
                  <circle cx="50" cy="50" r="35" stroke="#d4af37" strokeWidth="3" fill="none" />
                </svg>
              </div>
              <h3>Review Sentiment Analysis</h3>
              <p>Deep dive into guest reviews to understand what customers truly feel about your restaurant experience.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 30 70 L 50 30 L 70 70" stroke="#d4af37" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="30" y1="50" x2="70" y2="50" stroke="#00b4d8" strokeWidth="3" />
                </svg>
              </div>
              <h3>Strength & Weakness Identification</h3>
              <p>Pinpoint exactly where your restaurant excels and where improvements can drive the most impact.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="30" stroke="#00b4d8" strokeWidth="3" fill="none" />
                  <path d="M 20 50 L 50 20 L 80 50" stroke="#d4af37" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </div>
              <h3>Competitive Positioning</h3>
              <p>See how you stack up against local competitors and identify opportunities to stand out.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 30 70 L 50 30 L 70 70" stroke="#d4af37" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="50" cy="50" r="8" fill="#00b4d8" />
                </svg>
              </div>
              <h3>Revenue Opportunity Identification</h3>
              <p>Discover specific areas where improvements can directly increase repeat customers and revenue.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Section */}
      <section id="audit" className="audit">
        <div className="container">
          <div className="audit-content">
            <div className="audit-info">
              <span className="badge">Introductory Offer</span>
              <h2 className="audit-title">Guest Intelligence Audit</h2>
              <p className="audit-description">
                Get a comprehensive analysis of your restaurant's guest experience with actionable recommendations to improve operations and increase revenue.
              </p>
              <div className="price-section">
                <span className="price-label">Starting at</span>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">149</span>
                </div>
              </div>
              <div className="audit-features">
                <h3>What's Included:</h3>
                <ul className="features-list">
                  <li>
                    <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Review sentiment analysis
                  </li>
                  <li>
                    <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Strength and weakness identification
                  </li>
                  <li>
                    <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Competitive positioning analysis
                  </li>
                  <li>
                    <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Revenue opportunity identification
                  </li>
                  <li>
                    <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    5 actionable improvement recommendations
                  </li>
                </ul>
                <div className="delivery-info">
                  <svg className="clock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Delivery time: <strong>48 hours</strong></span>
                </div>
              </div>
              <a href="#contact" className="btn btn-primary btn-large">Get Your Audit Now</a>
            </div>
            <div className="audit-visual">
              <div className="visual-card">
                <div className="signal-animation">
                  <svg viewBox="0 0 400 300" className="signal-svg">
                    <path d="M 50 150 Q 100 50 150 150 T 250 150 T 350 150" 
                          stroke="#00b4d8" strokeWidth="8" fill="none" strokeLinecap="round" className="signal-wave" />
                    <path d="M 50 150 Q 100 250 150 150 T 250 150 T 350 150" 
                          stroke="#00b4d8" strokeWidth="8" fill="none" strokeLinecap="round" className="signal-wave" opacity="0.6" />
                  </svg>
                </div>
                <div className="insights-preview">
                  <h4>Sample Insights</h4>
                  <div className="insight-item">
                    <span className="insight-badge positive">Strength</span>
                    <p>Exceptional food quality mentioned in 78% of reviews</p>
                  </div>
                  <div className="insight-item">
                    <span className="insight-badge opportunity">Opportunity</span>
                    <p>Service speed identified as improvement area</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Clients Section */}
      <section className="target-clients">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Ideal For</h2>
            <p className="section-subtitle">We work best with restaurants that are ready to grow</p>
          </div>
          <div className="client-criteria">
            <div className="criterion">
              <div className="criterion-icon">⭐</div>
              <h3>4.0–4.5 Stars</h3>
              <p>Restaurants with good ratings looking to reach excellence</p>
            </div>
            <div className="criterion">
              <div className="criterion-icon">📊</div>
              <h3>150–600 Reviews</h3>
              <p>Enough data for meaningful analysis, room for growth</p>
            </div>
            <div className="criterion">
              <div className="criterion-icon">🏪</div>
              <h3>Independent</h3>
              <p>Owner-operated establishments with flexibility to implement changes</p>
            </div>
            <div className="criterion">
              <div className="criterion-icon">🔥</div>
              <h3>Busy & Growing</h3>
              <p>Not corporate chains - places where insights make a real difference</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact">
        <div className="container">
          <div className="contact-content">
            <div className="contact-info">
              <h2>Ready to Transform Your Guest Experience?</h2>
              <p>Let's discuss how our Guest Intelligence Audit can help identify specific opportunities to increase repeat customers and revenue for your restaurant.</p>
              <div className="contact-details">
                <div className="contact-item">
                  <svg className="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <div>
                    <strong>Service Area</strong>
                    <p>Nationwide Restaurant Analysis</p>
                  </div>
                </div>
                <div className="contact-item">
                  <svg className="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <div>
                    <strong>Get Started</strong>
                    <p>Contact us for your Guest Intelligence Audit</p>
                  </div>
                </div>
              </div>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Footer */}
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
                  <li><a href="#services">Review Analysis</a></li>
                  <li><a href="#services">Competitive Intelligence</a></li>
                  <li><a href="#audit">Guest Intelligence Audit</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <ul>
                  <li><Link href="/about">About Us</Link></li>
                  <li><a href="#contact">Contact Us</a></li>
                  <li><a href="#audit">Pricing</a></li>
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
