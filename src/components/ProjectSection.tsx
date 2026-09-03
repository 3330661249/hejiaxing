import type { ResumeProject } from '../content/resume';
import { FadeUp } from './FadeUp';
import { SectionHeading } from './SectionHeading';

type ProjectSectionProps = {
  project: ResumeProject;
};

export function ProjectSection({ project }: ProjectSectionProps) {
  return (
    <section
      id={project.id}
      className="content-section resume-section project-section"
    >
      <div className="content-frame">
        <SectionHeading
          eyebrow={`PROJECT ${project.index}`}
          title={project.title}
        />

        <FadeUp as="p" className="project-meta">
          {project.meta}
        </FadeUp>

        <dl className="project-details">
          {project.sections.map((section, index) => (
            <FadeUp
              key={section.label}
              delay={index * 0.06}
              className="project-detail-row"
            >
              <dt>{section.label}</dt>
              <dd>
                <p>{section.text}</p>
              </dd>
            </FadeUp>
          ))}
        </dl>
      </div>
    </section>
  );
}
