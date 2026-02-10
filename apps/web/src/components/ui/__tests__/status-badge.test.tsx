import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../status-badge';

describe('StatusBadge', () => {
  it('renders the status label', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('uses custom label when provided', () => {
    render(<StatusBadge status="active" label="Live" />);
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('formats status with underscores', () => {
    render(<StatusBadge status="pending_review" />);
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
  });

  it('applies green variant for active status', () => {
    render(<StatusBadge status="active" />);
    const badge = screen.getByText('Active');
    expect(badge.className).toContain('bg-green-100');
  });

  it('applies red variant for failed status', () => {
    render(<StatusBadge status="failed" />);
    const badge = screen.getByText('Failed');
    expect(badge.className).toContain('bg-red-100');
  });

  it('applies yellow variant for pending status', () => {
    render(<StatusBadge status="pending" />);
    const badge = screen.getByText('Pending');
    expect(badge.className).toContain('bg-yellow-100');
  });

  it('applies gray fallback for unknown status', () => {
    render(<StatusBadge status="unknown_value" />);
    const badge = screen.getByText('Unknown Value');
    expect(badge.className).toContain('bg-gray-100');
  });

  it('applies sm size by default', () => {
    render(<StatusBadge status="active" />);
    const badge = screen.getByText('Active');
    expect(badge.className).toContain('text-xs');
  });

  it('applies md size when specified', () => {
    render(<StatusBadge status="active" size="md" />);
    const badge = screen.getByText('Active');
    expect(badge.className).toContain('text-sm');
  });

  it('applies additional className', () => {
    render(<StatusBadge status="active" className="ml-2" />);
    const badge = screen.getByText('Active');
    expect(badge.className).toContain('ml-2');
  });
});
