import { render, screen } from '@testing-library/react';
import { MetricCard } from '../metric-card';

describe('MetricCard', () => {
  it('renders label and value', () => {
    render(<MetricCard label="Total Revenue" value="PKR 1,200,000" />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('PKR 1,200,000')).toBeInTheDocument();
  });

  it('renders numeric value', () => {
    render(<MetricCard label="Count" value={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<MetricCard label="Test" value="0" icon={<span data-testid="icon">💰</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders subText when provided', () => {
    render(<MetricCard label="Test" value="0" subText="Last 30 days" />);
    const subTexts = screen.getAllByText('Last 30 days');
    expect(subTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders positive trend', () => {
    render(<MetricCard label="Test" value="0" trend={{ value: 12.5, label: 'vs last month' }} />);
    expect(screen.getByText('12.5%')).toBeInTheDocument();
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('shows green color for positive trend', () => {
    render(<MetricCard label="Test" value="0" trend={{ value: 5 }} />);
    const trendText = screen.getByText('5%');
    // The text is inside a span > (icon + text). The closest span with the class is the parent.
    const trendContainer = trendText.closest('span.inline-flex') || trendText.parentElement;
    expect(trendContainer?.className).toContain('text-green-600');
  });

  it('shows red color for negative trend', () => {
    render(<MetricCard label="Test" value="0" trend={{ value: -3 }} />);
    const trendText = screen.getByText('3%');
    const trendContainer = trendText.closest('span.inline-flex') || trendText.parentElement;
    expect(trendContainer?.className).toContain('text-red-600');
  });
});
