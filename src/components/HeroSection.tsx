import { profile } from '../content/resume';
import { FadeUp } from './FadeUp';
import { ResumeDownloadLink } from './ResumeDownloadLink';

export function HeroSection() {
  return (
    <section id="top" className="content-section hero-section">
      <div className="content-frame hero-layout">
        <div className="hero-copy">
          <FadeUp as="p" delay={0.04} y={16} className="section-eyebrow">
            {profile.eyebrow}
          </FadeUp>

          <h1 className="hero-title" aria-label={profile.title}>
            {profile.titleWords.map((word, index) =>
              word === ' ' ? (
                <span key={`space-${index}`} className="hero-space" aria-hidden="true">
                  {'\u00a0'}
                </span>
              ) : (
                <FadeUp
                  as="span"
                  key={`${word}-${index}`}
                  delay={0.12 + index * 0.06}
                  y={28}
                  className="hero-word"
                >
                  {word}
                </FadeUp>
              ),
            )}
          </h1>

          <FadeUp as="p" delay={0.62} className="hero-description">
            {profile.description}
          </FadeUp>

          <FadeUp delay={0.72} className="hero-actions">
            <a className="text-action text-action-primary" href={profile.primaryAction.href}>
              <span>{profile.primaryAction.label}</span>
              <span aria-hidden="true">↓</span>
            </a>
            <ResumeDownloadLink className="text-action text-action-secondary" />
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
