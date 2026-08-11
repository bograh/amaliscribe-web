import { PLATFORMS, PLATFORM_LABELS, type Platform, type Release } from '@/lib/release'
import { LatestRelease } from './LatestRelease'
import { ReleaseCard } from './ReleaseCard'
import {
  ArrowRightIcon,
  BoltIcon,
  ChipIcon,
  CloudOffIcon,
  DownloadIcon,
  FileTextIcon,
  MicIcon,
  PlatformIcon,
  PlugIcon,
  ShieldIcon,
  WaveformIcon,
} from './icons'

export interface ReleasePortalProps {
  /** Newest-first; ordering is the API's responsibility. */
  releases: Release[]
  detected: Platform | null
}

/**
 * The whole portal, as a pure synchronous component. Data loading and
 * `User-Agent` sniffing happen in `app/page.tsx`, which keeps this renderable
 * in tests without a request context.
 */
export function ReleasePortal({ releases, detected }: ReleasePortalProps) {
  const [latest, ...previous] = releases

  return (
    <>
      <a className="skip-link" href="#downloads">
        Skip to downloads
      </a>

      <header className="masthead">
        <div className="shell masthead__inner">
          <a className="wordmark" href="#top">
            <span className="wordmark__glyph">
              <WaveformIcon />
            </span>
            AmaliScribe
          </a>

          <nav aria-label="Page sections">
            <a href="#downloads">Downloads</a>
            <a href="#privacy">Privacy</a>
            <a href="#how">How it works</a>
            <a href="#history">Releases</a>
          </nav>

          <div className="masthead__actions">
            <a className="btn btn--primary" href="#downloads">
              <DownloadIcon />
              Get AmaliScribe
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-heading">
          <div className="shell hero__inner">
            <p className="eyebrow">
              <BoltIcon />
              Runs entirely on your machine
            </p>

            <h1 id="hero-heading">
              Meeting notes that <span className="marker">never leave</span> your laptop
            </h1>

            <p className="hero__lede">
              AmaliScribe is a self-hosted desktop app that records, transcribes and summarises
              your meetings locally. Speech-to-text runs on-device with <code>whisper.cpp</code>,
              so audio and transcripts never have to reach a cloud service.
            </p>

            <div className="hero__cta">
              <a className="btn btn--primary btn--lg" href="#downloads">
                <DownloadIcon />
                {latest && detected && latest.downloads[detected]
                  ? `Download for ${PLATFORM_LABELS[detected]}`
                  : 'Download AmaliScribe'}
              </a>
              <a className="btn btn--ghost btn--lg" href="#history">
                Release history
                <ArrowRightIcon />
              </a>
            </div>

            <div className="hero__trust">
              <p className="hero__trust-label">
                {latest ? `Version ${latest.version} · available for` : 'Available for'}
              </p>
              <ul className="hero__platforms">
                {PLATFORMS.map((platform) => (
                  <li key={platform}>
                    <PlatformIcon platform={platform} />
                    {PLATFORM_LABELS[platform]}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="latest" id="downloads" aria-labelledby="downloads-heading">
          <h2 className="visually-hidden" id="downloads-heading">
            Download the latest release
          </h2>
          <div className="shell">
            {latest ? (
              <LatestRelease release={latest} detected={detected} />
            ) : (
              <div className="state">
                <h3>No releases published yet</h3>
                <p>
                  The first AmaliScribe build will appear here as soon as CI finishes a successful
                  cross-platform release.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="section section--white" id="privacy" aria-labelledby="privacy-heading">
          <div className="shell">
            <div className="section-head">
              <p className="eyebrow">
                <ShieldIcon />
                Privacy
              </p>
              <h2 id="privacy-heading">
                Private because of how it&rsquo;s <span className="marker">built</span>
              </h2>
              <p>
                Meeting audio is some of the most sensitive data a team produces. AmaliScribe keeps
                it private by default — not because of a policy you have to trust, but because
                nothing is wired up to send it anywhere.
              </p>
            </div>

            <div className="section__body">
              <ul className="feature-grid">
                <li className="card card--wide">
                  <div>
                    <h3>Capture, transcribe and summarise on-device</h3>
                    <p>
                      A native Go sidecar captures system and microphone audio and feeds it
                      straight to <code>whisper.cpp</code> running on your own CPU or GPU. The
                      Electron front-end talks to that sidecar over a local socket — there is no
                      upload step in the pipeline.
                    </p>
                  </div>
                  <div className="flow" aria-hidden="true">
                    <div className="flow__row">
                      <span className="flow__step">
                        <MicIcon />
                      </span>
                      <span className="flow__name">Audio capture</span>
                      <span className="flow__tag">Local</span>
                    </div>
                    <div className="flow__row flow__row--active">
                      <span className="flow__step">
                        <ChipIcon />
                      </span>
                      <span className="flow__name">whisper.cpp inference</span>
                      <span className="flow__tag">On-device</span>
                    </div>
                    <div className="flow__row">
                      <span className="flow__step">
                        <FileTextIcon />
                      </span>
                      <span className="flow__name">Transcript &amp; summary</span>
                      <span className="flow__tag">Your disk</span>
                    </div>
                    <div className="flow__row">
                      <span className="flow__step">
                        <CloudOffIcon />
                      </span>
                      <span className="flow__name">Cloud upload</span>
                      <span className="flow__tag">Never</span>
                    </div>
                  </div>
                </li>

                <li className="card">
                  <h3>Self-hosted, no account</h3>
                  <p>
                    Download an installer, run it, and you are done. There is no service to sign up
                    for, no per-seat billing and no tenant holding your recordings.
                  </p>
                </li>

                <li className="card">
                  <h3>One release, every desktop</h3>
                  <p>
                    Windows, macOS and Linux installers are built from the same commit by CI, and
                    published here automatically the moment that build succeeds.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section section--paper" id="how" aria-labelledby="how-heading">
          <div className="shell">
            <div className="block-forest on-forest">
              <div className="shell">
                <div className="section-head">
                  <p className="eyebrow">
                    <PlugIcon />
                    How it works
                  </p>
                  <h2 id="how-heading">Three parts, all on your hardware</h2>
                  <p>
                    AmaliScribe is a desktop app, not a client for someone else&rsquo;s server. Each
                    piece runs locally and talks only to the piece next to it.
                  </p>
                </div>

                <ul className="pill-grid">
                  <li className="pill">
                    <span className="pill__glyph">
                      <MicIcon />
                    </span>
                    <h3>Go audio sidecar</h3>
                    <p>
                      A native binary captures system and microphone audio with low overhead and
                      streams it to the transcription engine.
                    </p>
                  </li>
                  <li className="pill">
                    <span className="pill__glyph">
                      <ChipIcon />
                    </span>
                    <h3>Local whisper.cpp</h3>
                    <p>
                      Speech-to-text inference runs on your own CPU or GPU. Model files live on
                      your disk and the audio never leaves the process.
                    </p>
                  </li>
                  <li className="pill">
                    <span className="pill__glyph">
                      <WaveformIcon />
                    </span>
                    <h3>Electron + React app</h3>
                    <p>
                      The interface you actually use: live transcripts, speaker view, summaries and
                      exports, all reading from local storage.
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="section section--white" id="history" aria-labelledby="history-heading">
          <div className="shell">
            <div className="section-head">
              <p className="eyebrow">
                <FileTextIcon />
                Changelog
              </p>
              <h2 id="history-heading">Release history</h2>
              <p>
                Every published build, newest first. Download links point straight at the installer
                artifacts produced by our cross-platform CI pipeline.
              </p>
            </div>

            {previous.length > 0 ? (
              <ul className="history" aria-label="Earlier releases">
                {previous.map((release) => (
                  <ReleaseCard key={release.version} release={release} />
                ))}
              </ul>
            ) : (
              <div className="history">
                <div className="state">
                  <h3>{latest ? `${latest.version} is the only release so far` : 'Nothing here yet'}</h3>
                  <p>
                    {latest
                      ? 'Earlier versions will be listed here as new releases are published.'
                      : 'Published releases and their notes will be listed here.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="section section--paper" aria-labelledby="numbers-heading">
          <div className="shell">
            <h2 className="visually-hidden" id="numbers-heading">
              AmaliScribe at a glance
            </h2>
            <dl className="stats">
              <div>
                <dt>0</dt>
                <dd>Bytes of audio sent to a cloud service</dd>
              </div>
              <div>
                <dt>3</dt>
                <dd>Desktop platforms built from every release</dd>
              </div>
              <div>
                <dt>100%</dt>
                <dd>Transcription running on your own hardware</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="section section--white" aria-labelledby="cta-heading">
          <div className="shell">
            <div className="cta on-forest">
              <div>
                <h2 id="cta-heading">
                  Keep your meetings <span className="marker">yours</span>
                </h2>
                <p>
                  {latest
                    ? `Grab version ${latest.version} for your platform, or browse the full release history.`
                    : 'Installers will be published here as soon as the first release ships.'}
                </p>
              </div>
              <div className="cta__actions">
                <a className="btn btn--lime btn--lg" href="#downloads">
                  <DownloadIcon />
                  Download now
                </a>
                <a className="btn btn--ghost btn--lg" href="#history">
                  Release history
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer on-forest">
        <div className="shell">
          <div className="footer__top">
            <div className="footer__brand">
              <a className="wordmark" href="#top">
                <span className="wordmark__glyph">
                  <WaveformIcon />
                </span>
                AmaliScribe
              </a>
              <p className="footer__blurb">
                Private, local-first meeting transcription for Windows, macOS and Linux. Builds are
                published automatically by CI.
              </p>
            </div>

            <div>
              <h2>Download</h2>
              <ul>
                {PLATFORMS.map((platform) => (
                  <li key={platform}>
                    <a href="#downloads">{PLATFORM_LABELS[platform]}</a>
                  </li>
                ))}
                <li>
                  <a href="#history">All releases</a>
                </li>
              </ul>
            </div>

            <div>
              <h2>Product</h2>
              <ul>
                <li>
                  <a href="#privacy">Privacy</a>
                </li>
                <li>
                  <a href="#how">How it works</a>
                </li>
                <li>
                  <a href="#history">Changelog</a>
                </li>
              </ul>
            </div>

            <div>
              <h2>Developers</h2>
              <ul>
                <li>
                  <a href="/api/releases">Releases API</a>
                </li>
                <li>
                  <a href="/api/releases/latest">Latest release API</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer__bottom">
            <p>© {new Date().getUTCFullYear()} AmaliScribe. Self-hosted and local-first.</p>
            <p>Report a problem with a download in the project issue tracker.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
