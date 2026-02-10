import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '../empty-state';

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...rest }: any) {
    return <a href={href} {...rest}>{children}</a>;
  };
});

describe('EmptyState', () => {
  it('renders the heading', () => {
    render(<EmptyState heading="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders the message when provided', () => {
    render(<EmptyState heading="Empty" message="Try different filters" />);
    expect(screen.getByText('Try different filters')).toBeInTheDocument();
  });

  it('does not render message when not provided', () => {
    const { container } = render(<EmptyState heading="Empty" />);
    expect(container.querySelectorAll('p')).toHaveLength(0);
  });

  it('renders icon when provided', () => {
    render(<EmptyState heading="Empty" icon={<span data-testid="icon">📦</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders a link when actionLabel and actionHref are provided', () => {
    render(<EmptyState heading="Empty" actionLabel="Browse" actionHref="/browse" />);
    const link = screen.getByText('Browse');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/browse');
  });

  it('renders a button when actionLabel and onAction are provided (no href)', async () => {
    const handleAction = jest.fn();
    render(<EmptyState heading="Empty" actionLabel="Retry" onAction={handleAction} />);
    const button = screen.getByText('Retry');
    expect(button.tagName).toBe('BUTTON');
    await userEvent.click(button);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('does not render action when only actionLabel provided without href or onAction', () => {
    render(<EmptyState heading="Empty" actionLabel="Nothing" />);
    expect(screen.queryByText('Nothing')).not.toBeInTheDocument();
  });
});
