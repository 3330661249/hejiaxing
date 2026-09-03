import { practices } from '../content/resume';
import { FadeUp } from './FadeUp';
import { SectionHeading } from './SectionHeading';

export function AILabSection() {
  return (
    <section id="ai-lab" className="content-section resume-section compact-section">
      <div className="content-frame">
        <SectionHeading eyebrow="AI LAB" title="个人实践" />

        <div className="practice-list">
          {practices.map((practice, index) => (
            <FadeUp key={practice.title} delay={index * 0.08}>
              <article className="practice-row">
                <p className="practice-number">{String(index + 1).padStart(2, '0')}</p>
                <div>
                  <h3>{practice.title}</h3>
                  <p>{practice.text}</p>
                </div>
              </article>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
