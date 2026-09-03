import { experiences } from '../content/resume';
import { FadeUp } from './FadeUp';
import { SectionHeading } from './SectionHeading';

export function ExperienceSection() {
  return (
    <section id="experience" className="content-section resume-section">
      <div className="content-frame">
        <SectionHeading eyebrow="EXPERIENCE" title="工作经历" />

        <div className="experience-list">
          {experiences.map((experience, index) => (
            <FadeUp key={experience.company} delay={index * 0.08}>
              <article className="experience-row">
                <p className="experience-dates">{experience.dates}</p>
                <div className="experience-main">
                  <h3>{experience.company}</h3>
                  <p className="experience-role">{experience.role}</p>
                  <p className="experience-summary">{experience.summary}</p>
                  <a className="inline-link" href={experience.projectHref}>
                    <span>{experience.projectLabel}</span>
                    <span aria-hidden="true">↘</span>
                  </a>
                </div>
              </article>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
