import { resumeDownload } from '../content/resume';

type ResumeDownloadLinkProps = {
  className?: string;
};

export function ResumeDownloadLink({ className }: ResumeDownloadLinkProps) {
  return (
    <a
      className={className}
      href={resumeDownload.href}
      download={resumeDownload.downloadName}
    >
      <span>下载简历</span>
      <span aria-hidden="true">↓</span>
    </a>
  );
}
