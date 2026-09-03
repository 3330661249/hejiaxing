import { capabilities, education } from '../content/resume';
import { FadeUp } from './FadeUp';
import { SectionHeading } from './SectionHeading';

export function CapabilitiesSection() {
  return (
    <section id="about" className="content-section resume-section compact-section">
      <div className="content-frame">
        <SectionHeading
          eyebrow="CAPABILITIES / EDUCATION"
          title="能力与教育"
        />

        <div className="about-grid">
          <FadeUp className="capability-block">
            <p className="block-label">CAPABILITIES</p>
            <ul className="capability-list">
              {capabilities.map((capability, index) => (
                <li key={capability}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{capability}</strong>
                </li>
              ))}
            </ul>
          </FadeUp>

          <FadeUp delay={0.08} className="education-block">
            <p className="block-label">EDUCATION</p>
            <div className="education-copy">
              <h3>{education.school}</h3>
              <p>{education.major}</p>
              <p>{education.degree}</p>
              <p className="education-dates">{education.dates}</p>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
