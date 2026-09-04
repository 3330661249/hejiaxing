import { contact } from '../content/resume';
import { FadeUp } from './FadeUp';
import { ResumeDownloadLink } from './ResumeDownloadLink';

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
            <ResumeDownloadLink className="text-action" />
            <a className="text-action" href="#top">
              <span>返回顶部</span>
              <span aria-hidden="true">↑</span>
            </a>
          </div>
        </FadeUp>
      </div>
    </footer>
  );
}
