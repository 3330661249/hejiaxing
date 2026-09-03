import { FadeUp } from './FadeUp';

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
};

export function SectionHeading({ eyebrow, title }: SectionHeadingProps) {
  return (
    <FadeUp className="section-heading">
      <p className="section-eyebrow">{eyebrow}</p>
      <div className="section-heading-copy">
        <h2>{title}</h2>
      </div>
    </FadeUp>
  );
}
