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
            <p className="newsletter-meta">Published April 1, 2026 | Issue 02 | 10-15 minute read</p>
            <h1>Guest Signal Report</h1>
            <p className="newsletter-dek">
              Cincinnati dining demand is active, but attention does not equal retention. This
              report connects national and regional movement to practical operating moves local
              owners can implement immediately.
            </p>
            <div className="newsletter-highlights" aria-label="Issue highlights">
              <p className="newsletter-highlight">National + regional demand intelligence</p>
              <p className="newsletter-highlight">Greater Cincinnati conversion pressure</p>
              <p className="newsletter-highlight">Action plan for the next 90 days</p>
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
              <a
                className="btn btn-secondary"
                href="/newsletters/issue-02/GUESIGNAL_Newsletter_2026-04-01_Issue-02.txt"
              >
                Read Plain Text
              </a>
            </div>
            <div className="newsletter-hero-foot">
              <p className="newsletter-foot-label">Operator snapshot</p>
              <div className="newsletter-kpis">
                <article className="newsletter-kpi-card">
                  <p className="newsletter-kpi-label">Demand Pulse</p>
                  <p className="newsletter-kpi-value">Up</p>
                  <p className="newsletter-kpi-note">Traffic visibility remains elevated</p>
                </article>
                <article className="newsletter-kpi-card">
                  <p className="newsletter-kpi-label">Core Risk</p>
                  <p className="newsletter-kpi-value">Retention</p>
                  <p className="newsletter-kpi-note">First visits still leak without follow-up</p>
                </article>
                <article className="newsletter-kpi-card">
                  <p className="newsletter-kpi-label">Owner Priority</p>
                  <p className="newsletter-kpi-value">System</p>
                  <p className="newsletter-kpi-note">Track list growth + weekly signal review</p>
                </article>
              </div>
            </div>
          </section>

          <section className="newsletter-section">
            <h2>The Core Problem</h2>
            <p>
              <strong>Strong food. Weak system.</strong> Restaurant Week and local press can
              generate a spike, but without a conversion and follow-up system, demand fades fast.
            </p>
            <div className="newsletter-callout">
              <h3>What this means</h3>
              <p>
                Visibility wins your first look. Retention wins your quarter. Operators with a
                clear story, a capture mechanism, and weekly operating reviews will outperform the
                market noise.
              </p>
            </div>
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
            <div className="newsletter-operator-grid">
              <article className="newsletter-operator-card">
                <h3>1) Capture the first visit</h3>
                <p>Track list growth daily and launch a 24-hour post-visit follow-up message.</p>
              </article>
              <article className="newsletter-operator-card">
                <h3>2) Sharpen your signature</h3>
                <p>
                  Make your concept easy to repeat in one sentence so guests can market you for
                  free.
                </p>
              </article>
              <article className="newsletter-operator-card">
                <h3>3) Run a weekly signal review</h3>
                <p>
                  Convert reviews and local demand cues into one owner task list every Monday.
                </p>
              </article>
            </div>
            <p className="newsletter-aha">
              <strong>Aha moment:</strong> Restaurant Week does not create demand. It exposes which
              restaurants already have a system.
            </p>
          </section>

          <section className="newsletter-section">
            <h2>90-Day Action Sequence</h2>
            <ol className="newsletter-timeline">
              <li>
                <span className="newsletter-week">Days 1-14</span>
                Implement one offer capture point and one automated guest follow-up message.
              </li>
              <li>
                <span className="newsletter-week">Days 15-45</span>
                Refine menu and service messaging around your strongest repeat-visit triggers.
              </li>
              <li>
                <span className="newsletter-week">Days 46-90</span>
                Publish owner scorecards each week: list growth, repeat visit rate, and top review
                friction points.
              </li>
            </ol>
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
