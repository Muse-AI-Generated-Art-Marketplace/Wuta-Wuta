import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';

// Mock the store
jest.mock('../../store/museStore', () => ({
  useMuseStore: () => ({
    isConnected: true,
    isLoading: false,
    error: null,
    userAddress: '0x1234567890123456789012345678901234567890',
    artworks: [
      {
        id: 1,
        name: 'Artwork 1',
        humanCreator: '0x1234567890123456789012345678901234567890',
        aiModel: 'stable-diffusion',
        humanContribution: 60,
        aiContribution: 40,
        prompt: 'A beautiful landscape',
        tokenURI: 'https://metadata.example.com/art/1',
        canEvolve: true,
        evolutionCount: 0,
        createdAt: Date.now() - 86400000, // 1 day ago
      },
      {
        id: 2,
        name: 'Artwork 2',
        humanCreator: '0x1234567890123456789012345678901234567890',
        aiModel: 'dall-e',
        humanContribution: 50,
        aiContribution: 50,
        prompt: 'Abstract composition',
        tokenURI: 'https://metadata.example.com/art/2',
        canEvolve: false,
        evolutionCount: 0,
        createdAt: Date.now() - 172800000, // 2 days ago
      },
    ],
    totalSupply: 2,
    fetchUserArtworks: jest.fn(),
    fetchTotalSupply: jest.fn(),
    formatEther: (value) => (Number(value) / 1e18).toString(),
  }),
}));

// Mock react-router-dom
const MockRouter = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe('Dashboard Component', () => {
  const renderComponent = () => {
    return render(
      <MockRouter>
        <Dashboard />
      </MockRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the dashboard', () => {
      renderComponent();
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Your Artworks')).toBeInTheDocument();
      expect(screen.getByText('Marketplace Statistics')).toBeInTheDocument();
    });

    it('should show user address', () => {
      renderComponent();
      
      expect(screen.getByText(/0x1234\.\.\./)).toBeInTheDocument();
    });

    it('should show connection message when not connected', () => {
      jest.doMock('../../store/museStore', () => ({
        useMuseStore: () => ({
          isConnected: false,
          isLoading: false,
          error: null,
        }),
      }));
      
      renderComponent();
      expect(screen.getByText('Please connect your wallet to view dashboard')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      jest.doMock('../../store/museStore', () => ({
        useMuseStore: () => ({
          isConnected: true,
          isLoading: true,
          error: null,
        }),
      }));
      
      renderComponent();
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });
  });

  describe('Artwork Display', () => {
    it('should display user artworks', () => {
      renderComponent();
      
      expect(screen.getByText('Artwork 1')).toBeInTheDocument();
      expect(screen.getByText('Artwork 2')).toBeInTheDocument();
      expect(screen.getByText('A beautiful landscape')).toBeInTheDocument();
      expect(screen.getByText('Abstract composition')).toBeInTheDocument();
    });

    it('should show artwork details', () => {
      renderComponent();
      
      expect(screen.getByText('stable-diffusion')).toBeInTheDocument();
      expect(screen.getByText('dall-e')).toBeInTheDocument();
      expect(screen.getByText('60% Human / 40% AI')).toBeInTheDocument();
      expect(screen.getByText('50% Human / 50% AI')).toBeInTheDocument();
    });

    it('should show evolution status', () => {
      renderComponent();
      
      expect(screen.getByText('Can Evolve')).toBeInTheDocument();
      expect(screen.getByText('Cannot Evolve')).toBeInTheDocument();
    });

    it('should show creation time', () => {
      renderComponent();
      
      expect(screen.getByText(/1 day ago/)).toBeInTheDocument();
      expect(screen.getByText(/2 days ago/)).toBeInTheDocument();
    });

    it('should show empty state when no artworks', () => {
      jest.doMock('../../store/museStore', () => ({
        useMuseStore: () => ({
          isConnected: true,
          isLoading: false,
          error: null,
          userAddress: '0x1234567890123456789012345678901234567890',
          artworks: [],
          totalSupply: 0,
        }),
      }));
      
      renderComponent();
      
      expect(screen.getByText('No artworks found')).toBeInTheDocument();
      expect(screen.getByText('Create your first collaborative artwork')).toBeInTheDocument();
    });
  });

  describe('Statistics', () => {
    it('should show marketplace statistics', () => {
      renderComponent();
      
      expect(screen.getByText('Total Artworks')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Your Artworks')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should show contribution breakdown', () => {
      renderComponent();
      
      expect(screen.getByText('Average Human Contribution')).toBeInTheDocument();
      expect(screen.getByText('55%')).toBeInTheDocument();
      expect(screen.getByText('Average AI Contribution')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('should show evolution statistics', () => {
      renderComponent();
      
      expect(screen.getByText('Evolvable Artworks')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Total Evolutions')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Artwork Actions', () => {
    it('should show view details button', () => {
      renderComponent();
      
      const viewButtons = screen.getAllByText('View Details');
      expect(viewButtons.length).toBe(2);
    });

    it('should show evolve button for evolvable artworks', () => {
      renderComponent();
      
      expect(screen.getByText('Evolve')).toBeInTheDocument();
    });

    it('should not show evolve button for non-evolvable artworks', () => {
      renderComponent();
      
      const evolveButtons = screen.getAllByText('Evolve');
      expect(evolveButtons.length).toBe(1);
    });

    it('should open artwork details modal', () => {
      renderComponent();
      
      const viewButton = screen.getAllByText('View Details')[0];
      fireEvent.click(viewButton);
      
      expect(screen.getByText('Artwork Details')).toBeInTheDocument();
      expect(screen.getByText('Artwork 1')).toBeInTheDocument();
    });

    it('should close artwork details modal', () => {
      renderComponent();
      
      const viewButton = screen.getAllByText('View Details')[0];
      fireEvent.click(viewButton);
      
      const closeButton = screen.getByLabelText('Close details');
      fireEvent.click(closeButton);
      
      expect(screen.queryByText('Artwork Details')).not.toBeInTheDocument();
    });
  });

  describe('Filtering and Sorting', () => {
    it('should show filter options', () => {
      renderComponent();
      
      expect(screen.getByText('Filter by AI Model')).toBeInTheDocument();
      expect(screen.getByText('Sort by')).toBeInTheDocument();
    });

    it('should filter artworks by AI model', () => {
      renderComponent();
      
      const filterSelect = screen.getByLabelText('Filter by AI Model');
      fireEvent.change(filterSelect, { target: { value: 'stable-diffusion' } });
      
      expect(screen.getByText('Artwork 1')).toBeInTheDocument();
      expect(screen.queryByText('Artwork 2')).not.toBeInTheDocument();
    });

    it('should sort artworks by creation date', () => {
      renderComponent();
      
      const sortSelect = screen.getByLabelText('Sort by');
      fireEvent.change(sortSelect, { target: { value: 'newest' } });
      
      const artworks = screen.getAllByTestId('artwork-card');
      expect(artworks[0]).toHaveTextContent('Artwork 1');
      expect(artworks[1]).toHaveTextContent('Artwork 2');
    });

    it('should sort artworks by contribution', () => {
      renderComponent();
      
      const sortSelect = screen.getByLabelText('Sort by');
      fireEvent.change(sortSelect, { target: { value: 'human-contribution' } });
      
      const artworks = screen.getAllByTestId('artwork-card');
      expect(artworks[0]).toHaveTextContent('60% Human');
      expect(artworks[1]).toHaveTextContent('50% Human');
    });
  });

  describe('Search', () => {
    it('should have search input', () => {
      renderComponent();
      
      expect(screen.getByPlaceholderText('Search artworks...')).toBeInTheDocument();
    });

    it('should filter artworks by search term', () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText('Search artworks...');
      fireEvent.change(searchInput, { target: { value: 'landscape' } });
      
      expect(screen.getByText('Artwork 1')).toBeInTheDocument();
      expect(screen.queryByText('Artwork 2')).not.toBeInTheDocument();
    });

    it('should clear search when input is empty', () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText('Search artworks...');
      fireEvent.change(searchInput, { target: { value: 'landscape' } });
      fireEvent.change(searchInput, { target: { value: '' } });
      
      expect(screen.getByText('Artwork 1')).toBeInTheDocument();
      expect(screen.getByText('Artwork 2')).toBeInTheDocument();
    });
  });

  describe('Refresh', () => {
    it('should have refresh button', () => {
      renderComponent();
      
      expect(screen.getByLabelText('Refresh')).toBeInTheDocument();
    });

    it('should call fetch functions when refresh is clicked', () => {
      const mockFetchUserArtworks = jest.fn();
      const mockFetchTotalSupply = jest.fn();
      
      jest.doMock('../../store/museStore', () => ({
        useMuseStore: () => ({
          isConnected: true,
          isLoading: false,
          error: null,
          userAddress: '0x1234567890123456789012345678901234567890',
          artworks: [],
          totalSupply: 0,
          fetchUserArtworks: mockFetchUserArtworks,
          fetchTotalSupply: mockFetchTotalSupply,
        }),
      }));
      
      renderComponent();
      
      const refreshButton = screen.getByLabelText('Refresh');
      fireEvent.click(refreshButton);
      
      expect(mockFetchUserArtworks).toHaveBeenCalled();
      expect(mockFetchTotalSupply).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when error exists', () => {
      jest.doMock('../../store/museStore', () => ({
        useMuseStore: () => ({
          isConnected: true,
          isLoading: false,
          error: 'Failed to load artworks',
          userAddress: '0x1234567890123456789012345678901234567890',
          artworks: [],
          totalSupply: 0,
        }),
      }));
      
      renderComponent();
      
      expect(screen.getByText('Failed to load artworks')).toBeInTheDocument();
    });

    it('should show retry button when error occurs', () => {
      jest.doMock('../../store/museStore', () => ({
        useMuseStore: () => ({
          isConnected: true,
          isLoading: false,
          error: 'Failed to load artworks',
          userAddress: '0x1234567890123456789012345678901234567890',
          artworks: [],
          totalSupply: 0,
          fetchUserArtworks: jest.fn(),
          fetchTotalSupply: jest.fn(),
        }),
      }));
      
      renderComponent();
      
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderComponent();
      
      expect(screen.getByLabelText('Filter by AI Model')).toBeInTheDocument();
      expect(screen.getByLabelText('Sort by')).toBeInTheDocument();
      expect(screen.getByLabelText('Search artworks...')).toBeInTheDocument();
    });

    it('should announce filter changes to screen readers', () => {
      renderComponent();
      
      const filterSelect = screen.getByLabelText('Filter by AI Model');
      fireEvent.change(filterSelect, { target: { value: 'stable-diffusion' } });
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      renderComponent();
      
      const firstArtwork = screen.getByText('Artwork 1');
      firstArtwork.focus();
      
      expect(document.activeElement).toBe(firstArtwork);
      
      fireEvent.tab();
      expect(document.activeElement).toBe(screen.getAllByText('View Details')[0]);
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile view', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      renderComponent();
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      // Should still show all key elements in mobile view
      expect(screen.getByText('Your Artworks')).toBeInTheDocument();
    });

    it('should show grid layout on desktop', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      renderComponent();
      
      const artworkGrid = screen.getByTestId('artwork-grid');
      expect(artworkGrid).toBeInTheDocument();
    });
  });
});
