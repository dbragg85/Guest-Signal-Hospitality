import Navigation from '../../components/Navigation'

export const metadata = {
  title: 'Guest Signal Report | Issue 02',
  description:
    'Guest Signal Report Issue 02 with national, regional, and Greater Cincinnati restaurant intelligence.',
}

export default function NewsletterPage() {
  return (
    <>
      <Navigation />
      <main className="newsletter-page">
        <div className="container">
          <section className="newsletter-hero">
            <p className="newsletter-meta">Published April 1, 2026 | 10-15 minute read</p>
            <h1>Guest Signal Report: Issue 02</h1>
            <p className="newsletter-intro">
              The Cincinnati market has attention. The operators who convert that attention into
              repeat demand are the ones with clear positioning, a retention process, and fast
              response to guest signals.
            </p>
            <div className="newsletter-highlights">
              <p className="newsletter-highlight">National + regional signal synthesis</p>
              <p className="newsletter-highlight">Greater Cincinnati operator focus</p>
              <p className="newsletter-highlight">Practical action list for owners</p>
            </div>
            <div className="newsletter-actions">
              <a
                className="btn btn-primary"
                href="/newsletters/issue-02/GUESIGNAL_Newsletter_2026-04-01_Issue-02.doc"
              >
                Download .doc
              </a>
              <a
                className="btn btn-secondary"
                href="/newsletters/issue-02/GUESIGNAL_Newsletter_2026-04-01_Issue-02.md"
              >
                Read Markdown
              </a>
            </div>
          </section>

          <section className="newsletter-section">
            <h2>The Problem (In One Line)</h2>
            <p>
              <strong>Strong food. Weak system.</strong> Restaurant Week and local press can
              generate a spike, but without a conversion and follow-up system, demand fades fast.
            </p>
          </section>

          <section className="newsletter-section">
            <h2>What We Are Seeing Right Now</h2>
            <div className="newsletter-signal-grid">
              <article className="newsletter-signal-card">
                <h3>National signal</h3>
                <p>
                  The National Restaurant Association&apos;s 2026 Restaurant Performance Index
                  updates show improving demand conditions while guests remain selective on value.
                </p>
              </article>
              <article className="newsletter-signal-card">
                <h3>Regional signal</h3>
                <p>
                  Great Lakes and Midwest award cycles continue expanding visibility pressure for
                  independent concepts.
                </p>
              </article>
              <article className="newsletter-signal-card">
                <h3>Greater Cincinnati signal</h3>
                <p>
                  Cincinnati dining attention remains elevated through local event and media
                  cycles, and conversion discipline still separates operators.
                </p>
              </article>
            </div>
          </section>

          <section className="newsletter-section">
            <h2>Operator Implications</h2>
            <ul className="newsletter-checklist">
              <li>Capture demand in the first visit through measurable list growth and follow-up.</li>
              <li>Clarify your signature so guests can explain your concept in one sentence.</li>
              <li>Translate review signals into one owner action list every week.</li>
            </ul>
            <p>
              <strong>Aha moment:</strong> Restaurant Week does not create demand. It exposes which
              restaurants already have a system.
            </p>
          </section>

          <section className="newsletter-section">
            <h2>Sources</h2>
            <ul className="newsletter-sources">
              <li>
                <a href="https://restaurant.org/research-and-media/research/economists-notebook/">
                  National Restaurant Association, Economist&apos;s Notebook
                </a>
              </li>
              <li>
                <a href="https://www.jamesbeard.org/awards">James Beard Foundation Awards</a>
              </li>
              <li>
                <a href="https://www.citybeat.com/cincinnati">Cincinnati local restaurant reporting</a>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </>
  )
}
