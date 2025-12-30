/**
 * Dashboard Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../src/components/Dashboard/Dashboard';
import { api } from '../src/services/api';

// Mock the API
vi.mock('../src/services/api', () => ({
  api: {
    getLocations: vi.fn()
  }
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows loading state initially', () => {
    api.getLocations.mockImplementation(() => new Promise(() => {}));
    renderWithRouter(<Dashboard />);
    expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('displays stats when locations are loaded', async () => {
    api.getLocations.mockResolvedValue({
      locations: [
        {
          id: 1,
          business_name: 'Test Business',
          city: 'Austin',
          state: 'TX',
          zip_code: '78704',
          service_type: 'Plumbing',
          stats: { landmarkCount: 10, contentCount: 5, reviewCount: 3 }
        }
      ]
    });

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // 1 location
      expect(screen.getByText('Test Business')).toBeInTheDocument();
    });
  });

  it('shows empty state when no locations', async () => {
    api.getLocations.mockResolvedValue({ locations: [] });

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('No locations yet')).toBeInTheDocument();
    });
  });

  it('displays error message on API failure', async () => {
    api.getLocations.mockRejectedValue(new Error('Network error'));

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});
