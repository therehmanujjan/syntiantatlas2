import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterPanel } from '../filter-panel';

const selectFilter = {
  key: 'status',
  label: 'Status',
  type: 'select' as const,
  options: [
    { label: 'Active', value: 'active' },
    { label: 'Pending', value: 'pending' },
  ],
};

const checkboxFilter = {
  key: 'type',
  label: 'Type',
  type: 'checkbox-group' as const,
  options: [
    { label: 'Residential', value: 'residential' },
    { label: 'Commercial', value: 'commercial' },
  ],
};

describe('FilterPanel', () => {
  it('renders filter header with Filters label', () => {
    render(
      <FilterPanel
        filters={[selectFilter]}
        values={{ status: '' }}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('renders select filter with options', () => {
    render(
      <FilterPanel
        filters={[selectFilter]}
        values={{ status: '' }}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('calls onChange when select value changes', async () => {
    const handleChange = jest.fn();
    render(
      <FilterPanel
        filters={[selectFilter]}
        values={{ status: '' }}
        onChange={handleChange}
      />
    );
    await userEvent.selectOptions(screen.getByRole('combobox'), 'active');
    expect(handleChange).toHaveBeenCalledWith({ status: 'active' });
  });

  it('renders checkbox group filter', () => {
    render(
      <FilterPanel
        filters={[checkboxFilter]}
        values={{ type: [] }}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText('Residential')).toBeInTheDocument();
    expect(screen.getByText('Commercial')).toBeInTheDocument();
  });

  it('calls onChange when checkbox is checked', async () => {
    const handleChange = jest.fn();
    render(
      <FilterPanel
        filters={[checkboxFilter]}
        values={{ type: [] }}
        onChange={handleChange}
      />
    );
    await userEvent.click(screen.getByLabelText('Residential'));
    expect(handleChange).toHaveBeenCalledWith({ type: ['residential'] });
  });

  it('renders active filter chips', () => {
    render(
      <FilterPanel
        filters={[selectFilter]}
        values={{ status: 'active' }}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText('Status: Active')).toBeInTheDocument();
  });

  it('shows active filter count badge', () => {
    render(
      <FilterPanel
        filters={[selectFilter]}
        values={{ status: 'active' }}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('clears all filters when Clear All is clicked', async () => {
    const handleChange = jest.fn();
    render(
      <FilterPanel
        filters={[selectFilter]}
        values={{ status: 'active' }}
        onChange={handleChange}
      />
    );
    await userEvent.click(screen.getByText('Clear All'));
    expect(handleChange).toHaveBeenCalledWith({ status: '' });
  });

  it('toggles filter panel collapsed/expanded', async () => {
    render(
      <FilterPanel
        filters={[selectFilter]}
        values={{ status: '' }}
        onChange={jest.fn()}
      />
    );
    // Initially expanded - select field is visible
    expect(screen.getByText('Status')).toBeInTheDocument();

    // Click header to collapse
    await userEvent.click(screen.getByText('Filters'));
    // The label "Status" from the filter field should be gone (only header remains)
    // Check that the select element is no longer present
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
