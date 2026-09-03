import { projects } from '../content/resume';
import { FadeUp } from './FadeUp';
import { SectionHeading } from './SectionHeading';

export function ProjectIndex() {
  return (
    <section id="selected-work" className="content-section resume-section">
      <div className="content-frame">
        <SectionHeading eyebrow="SELECTED WORK" title="核心项目" />

        <div className="project-index-list">
          {projects.map((project, index) => (
            <FadeUp key={project.id} delay={0.08 * index}>
              <a
                className="project-index-link"
                href={`#${project.id}`}
                aria-label={project.title}
              >
                <span className="project-index-number">{project.index}</span>
                <span className="project-index-title">{project.title}</span>
                <span className="project-index-tag">{project.indexTag}</span>
                <span className="project-index-arrow" aria-hidden="true">
                  ↘
                </span>
              </a>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
