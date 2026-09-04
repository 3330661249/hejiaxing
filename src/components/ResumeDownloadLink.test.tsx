import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ResumeDownloadLink } from './ResumeDownloadLink';

afterEach(cleanup);

describe('ResumeDownloadLink', () => {
  it('uses the approved resource path and Chinese download filename', () => {
    render(<ResumeDownloadLink className="probe" />);

    const link = screen.getByRole('link', { name: '下载简历' });
    expect(link).toHaveAttribute(
      'href',
      './he-jiaxing-ai-product-manager-resume.pdf',
    );
    expect(link).toHaveAttribute('download', '何佳兴_AI产品经理_简历.pdf');
    expect(link).toHaveClass('probe');
  });
});
