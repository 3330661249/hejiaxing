import { contact } from '../content/resume';
import { FadeUp } from './FadeUp';

export function ContactSection() {
  return (
    <footer id="contact" className="content-section contact-section">
      <div className="content-frame">
        <FadeUp>
          <p className="section-eyebrow">CONTACT</p>
          <p className="contact-statement">{contact.text}</p>
        </FadeUp>

        <FadeUp delay={0.08} className="contact-links">
          <a className="contact-email" href={contact.mailto}>
            {contact.email}
          </a>
          <div className="contact-actions">
            <a className="text-action" href="#top">
              <span>返回顶部</span>
              <span aria-hidden="true">↑</span>
            </a>
          </div>
        </FadeUp>

        <div className="contact-footnote">
          <span>何佳兴 · AI PRODUCT MANAGER</span>
          <span>2026</span>
        </div>
      </div>
    </footer>
  );
}
