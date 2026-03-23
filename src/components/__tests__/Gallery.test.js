import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Gallery from '../Gallery';

// Mock the store
jest.mock('../../store/museStore', () => ({
  useMuseStore: () => ({
    isConnected: true,
    isLoading: false,
    error: null,
    artworks: [
      {
        id: 1,
        name: 'Cosmic Dreams',
        humanCreator: '0x1234567890123456789012345678901234567890',
        aiModel: 'stable-diffusion',
        humanContribution: 70,
        aiContribution: 30,
        prompt: 'A cosmic dream with stars and nebulae',
        tokenURI: 'https://metadata.example.com/art/1',
        canEvolve: true,
        evolutionCount: 2,
        createdAt: Date.now() - 3600000, // 1 hour ago
        price: '0.5',
        owner: '0x1234567890123456789012345678901234567890',
      },
      {
        id: 2,
        name: 'Digital Sunset',
        humanCreator: '0x9876543210987654321098765432109876543210',
        aiModel: 'dall-e',
        humanContribution: 40,
        aiContribution: 60,
        prompt: 'A digital sunset over a futuristic city',
        tokenURI: 'https://metadata.example.com/art/2',
        canEvolve: false,
        evolutionCount: 0,
        createdAt: Date.now() - 7200000, // 2 hours ago
        price: '0.3',
        owner: '0x9876543210987654321098765432109876543210',
      },
      {
        id: 3,
        name: 'Abstract Mind',
        humanCreator: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        aiModel: 'midjourney',
        humanContribution: 50,
        aiContribution: 50,
        prompt: 'An abstract representation of human consciousness',
        tokenURI: 'https://metadata.example.com/art/3',
        canEvolve: true,
        evolutionCount: 1,
        createdAt: Date.now() - 10800000, // 3 hours ago
        price: '0.8',
        owner: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      },
    ],
    fetchAllArtworks: jest.fn(),
    buyArtwork: jest.fn(),
    formatEther: (value) => (Number(value) / 1e18).toString(),
    parseEther: (value) => BigInt(value * 1e18),
  }),
}));

// Mock react-router-dom
const MockRouter = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe('Gallery Component', () => {
  const renderComponent = () => {
    return render(
      <MockRouter>
        <Gallery />
      </MockRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the gallery', () => {
      renderComponent();
      
      expect(screen.getByText('Art Gallery')).toBeInTheDocument();
      expect(screen.getByText('Explore AI-Human Collaborative Artwork')).toBeInTheDocument();
    });

    it('should display all artworks', () => {
      renderComponent();
      
      expect(screen.getByText('Cosmic Dreams')).toBeInTheDocument();
      expect(screen.getByText('Digital Sunset')).toBeInTheDocument();
      expect(screen.getByText('Abstract Mind')).toBeInTheDocument();
    });

    it('should show artwork metadata', () => {
      renderComponent();
      
      expect(screen.getByText('0.5 ETH')).toBeInTheDocument();
      expect(screen.getByText('0.3 ETH')).toBeInTheDocument();
      expect(screen.getByText('0.8 ETH')).toBeInTheDocument();
      
      expect(screen.getByText('stable-diffusion')).toBeInTheDocument();
      expect(screen.getByText('dall-e')).toBeInTheDocument();
      expect(screen.getByText('midjourney')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      jest.doMock('../../store/museStore', () => ({
        useMuseStore: () => ({
          isConnected: true,
          isLoading: true,
          error: null,
          artworks: [],
        }),
      }));
      
      renderComponent();
      expect(screen.getByText('Loading gallery...')).toBeInTheDocument();
    });

    it('should show empty state when no artworks', () => {
      jest.doMock('../../store/museStore', () => ({
        useMuseStore: () => ({
          isConnected: true,
          isLoading: false,
          error: null,
          artworks: [],
        }),
      }));
      
      renderComponent();
      
      expect(screen.getByText('No artworks found')).toBeInTheDocument();
      expect(screen.getByText('Be the first to create a collaborative artwork')).toBeInTheDocument();
    });
  });

  describe('Artwork Cards', () => {
    it('should display artwork image', () => {
      renderComponent();
      
      const images = screen.getAllByRole('img');
      expect(images.length).toBe(3);
      expect(images[0]).toHaveAttribute('src', 'https://metadata.example.com/art/1');
      expect(images[0]).toHaveAttribute('alt', 'Cosmic Dreams');
    });

    it('should show contribution percentages', () => {
      renderComponent();
      
      expect(screen.getByText('70% Human / 30% AI')).toBeInTheDocument();
      expect(screen.getByText('40% Human / 60% AI')).toBeInTheDocument();
      expect(screen.getByText('50% Human / 50% AI')).toBeInTheDocument();
    });

    it('should show evolution count', () => {
      renderComponent();
      
      expect(screen.getByText('2 Evolutions')).toBeInTheDocument();
      expect(screen.getByText('0 Evolutions')).toBeInTheDocument();
      expect(screen.getByText('1 Evolution')).toBeInTheDocument();
    });

    it('should show creator address truncated', () => {
      renderComponent();
      
      expect(screen.getByText(/0x1234\.\.\./)).toBeInTheDocument();
      expect(screen.getByText(/0x9876\.\.\./)).toBeInTheDocument();
      expect(screen.getByText(/0xabcd\.\.\./)).toBeInTheDocument();
    });

    it('should show creation time', () => {
      renderComponent();
      
      expect(screen.getByText(/1 hour ago/)).toBeInTheDocument();
      expect(screen.getByText(/2 hours ago/)).toBeInTheDocument();
      expect(screen.getByText(/3 hours ago/)).toBeInTheDocument();
    });
  });

  describe('Artwork Interaction', () => {
    it('should show artwork details on hover', () => {
      renderComponent();
      
      const artworkCard = screen.getByTestId('artwork-card-1');
      fireEvent.mouseEnter(artworkCard);
      
      expect(screen.getByText('A cosmic dream with stars and nebulae')).toBeInTheDocument();
    });

    it('should open artwork modal on click', () => {
      renderComponent();
      
      const artworkCard = screen.getByTestId('artwork-card-1');
      fireEvent.click(artworkCard);
      
      expect(screen.getByText('Cosmic Dreams')).toBeInTheDocument();
      expect(screen.getByText('Artwork Details')).toBeInTheDocument();
    });

    it('should close modal on close button click', () => {
      renderComponent();
      
      const artworkCard = screen.getByTestId('artwork-card-1');
      fireEvent.click(artworkCard);
      
      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);
      
      expect(screen.queryByText('Artwork Details')).not.toBeInTheDocument();
    });

    it('should close modal on escape key', () => {
      renderComponent();
      
      const artworkCard = screen.getByTestId('artwork-card-1');
      fireEvent.click(artworkCard);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(screen.queryByText('Artwork Details')).not.toBeInTheDocument();
    });
  });

  describe('Buying Artwork', () => {
    it('should show buy button for available artworks', () => {
      renderComponent();
      
      const buyButtons = screen.getAllByText('Buy Now');
      expect(buyButtons.length).toBe(3);
    });

    it('should show purchase confirmation modal', () => {
      renderComponent();
      
      const buyButton = screen.getAllByText('Buy Now')[0];
      fireEvent.click(buyButton);
      
      expect(screen.getByText('Confirm Purchase')).toBeInTheDocument();
      expect(screen.getByText('Cosmic Dreams')).toBeInTheDocument();
      expect(screen.getByText('0.5 ETH')).toBeInTheDocument();
    });

    it('should call buyArtwork when purchase is confirmed', async () => {
      const mockBuyArtwork = jest.fn().mockResolvedValue({ transactionHash: '0x123' });
      jest.doMock('../../store/museStore', () => ({
        useMuseStore: () => ({
          isConnected: true,
          isLoading: false,
          error: null,
          artworks: [
            {
              id: 1,
              name: 'Cosmic Dreams',
              price: '0.5',
              owner: '0x1234567890123456789012345678901234567890',
            },
          ],
          buyArtwork: mockBuyArtwork,
        }),
      }));
      
      renderComponent();
      
      const buyButton = screen.getAllByText('Buy Now')[0];
      fireEvent.click(buyButton);
      
      const confirmButton = screen.getByText('Confirm Purchase');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockBuyArtwork).toHaveBeenCalledWith(1);
      });
    });

    it('should show success message on successful purchase', async () => {
      const mockBuyArtwork = jest.fn().mockResolvedValue({ transactionHash: '0x123' });
      jest.doMock('../../store/museStore', () => ({
        useMuseStore: () => ({
          isConnected: true,
          isLoading: false,
          error: null,
          artworks: [
            {
              id: 1,
              name: 'Cosmic Dreams',
              price: '0.5',
              owner: '0x1234567890123456789012345678901234567890',
            },
          ],
          buyArtwork: mockBuyArtwork,
        }),
      }));
      
      renderComponent();
      
      const buyButton = screen.getAllByText('Buy Now')[0];
      fireEvent.click(buyButton);
      
      const confirmButton = screen.getByText('Confirm Purchase');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('Purchase successful!')).toBeInTheDocument();
      });
    });

    it('should show error message on failed purchase', async () => {
      const mockBuyArtwork = jest.fn().mockRejectedValue(new Error('Insufficient funds'));
      jest.doMock('../../store/museStore', () => ({
        useMuseStore: () => ({
          isConnected: true,
          isLoading: false,
          error: null,
          artworks: [
            {
              id: 1,
              name: 'Cosmic Dreams',
              price: '0.5',
              owner: '0x1234567890123456789012345678901234567890',
            },
          ],
          buyArtwork: mockBuyArtwork,
        }),
      }));
      
      renderComponent();
      
      const buyButton = screen.getAllByText('Buy Now')[0];
      fireEvent.click(buyButton);
      
      const confirmButton = screen.getByText('Confirm Purchase');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('Insufficient funds')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering and Sorting', () => {
    it('should show filter options', () => {
      renderComponent();
      
      expect(screen.getByText('Filter by AI Model')).toBeInTheDocument();
      expect(screen.getByText('Sort by')).toBeInTheDocument();
      expect(screen.getByText('Price Range')).toBeInTheDocument();
    });

    it('should filter by AI model', () => {
      renderComponent();
      
      const filterSelect = screen.getByLabelText('Filter by AI Model');
      fireEvent.change(filterSelect, { target: { value: 'stable-diffusion' } });
      
      expect(screen.getByText('Cosmic Dreams')).toBeInTheDocument();
      expect(screen.queryByText('Digital Sunset')).not.toBeInTheDocument();
      expect(screen.queryByText('Abstract Mind')).not.toBeInTheDocument();
    });

    it('should sort by price low to high', () => {
      renderComponent();
      
      const sortSelect = screen.getByLabelText('Sort by');
      fireEvent.change(sortSelect, { target: { value: 'price-low' } });
      
      const artworks = screen.getAllByTestId('artwork-card');
      expect(artworks[0]).toHaveTextContent('0.3 ETH');
      expect(artworks[1]).toHaveTextContent('0.5 ETH');
      expect(artworks[2]).toHaveTextContent('0.8 ETH');
    });

    it('should sort by price high to low', () => {
      renderComponent();
      
      const sortSelect = screen.getByLabelText('Sort by');
      fireEvent.change(sortSelect, { target: { value: 'price-high' } });
      
      const artworks = screen.getAllByTestId('artwork-card');
      expect(artworks[0]).toHaveTextContent('0.8 ETH');
      expect(artworks[1]).toHaveTextContent('0.5 ETH');
      expect(artworks[2]).toHaveTextContent('0.3 ETH');
    });

    it('should sort by newest first', () => {
      renderComponent();
      
      const sortSelect = screen.getByLabelText('Sort by');
      fireEvent.change(sortSelect, { target: { value: 'newest' } });
      
      const artworks = screen.getAllByTestId('artwork-card');
      expect(artworks[0]).toHaveTextContent('Cosmic Dreams'); // 1 hour ago
      expect(artworks[1]).toHaveTextContent('Digital Sunset'); // 2 hours ago
      expect(artworks[2]).toHaveTextContent('Abstract Mind'); // 3 hours ago
    });

    it('should filter by price range', () => {
      renderComponent();
      
      const minPriceInput = screen.getByLabelText('Min Price');
      const maxPriceInput = screen.getByLabelText('Max Price');
      
      fireEvent.change(minPriceInput, { target: { value: '0.4' } });
      fireEvent.change(maxPriceInput, { target: { value: '0.6' } });
      
      expect(screen.getByText('Cosmic Dreams')).toBeInTheDocument(); // 0.5 ETH
      expect(screen.queryByText('Digital Sunset')).not.toBeInTheDocument(); // 0.3 ETH
      expect(screen.queryByText('Abstract Mind')).not.toBeInTheDocument(); // 0.8 ETH
    });
  });

  describe('Search', () => {
    it('should have search input', () => {
      renderComponent();
      
      expect(screen.getByPlaceholderText('Search artworks...')).toBeInTheDocument();
    });

    it('should filter artworks by name', () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText('Search artworks...');
      fireEvent.change(searchInput, { target: { value: 'Cosmic' } });
      
      expect(screen.getByText('Cosmic Dreams')).toBeInTheDocument();
      expect(screen.queryByText('Digital Sunset')).not.toBeInTheDocument();
      expect(screen.queryByText('Abstract Mind')).not.toBeInTheDocument();
    });

    it('should filter artworks by prompt', () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText('Search artworks...');
      fireEvent.change(searchInput, { target: { value: 'sunset' } });
      
      expect(screen.getByText('Digital Sunset')).toBeInTheDocument();
      expect(screen.queryByText('Cosmic Dreams')).not.toBeInTheDocument();
      expect(screen.queryByText('Abstract Mind')).not.toBeInTheDocument();
    });

    it('should filter artworks by AI model', () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText('Search artworks...');
      fireEvent.change(searchInput, { target: { value: 'stable-diffusion' } });
      
      expect(screen.getByText('Cosmic Dreams')).toBeInTheDocument();
      expect(screen.queryByText('Digital Sunset')).not.toBeInTheDocument();
      expect(screen.queryByText('Abstract Mind')).not.toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should show pagination when there are many artworks', () => {
      // Mock many artworks
      const manyArtworks = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `Artwork ${i + 1}`,
        tokenURI: `https://metadata.example.com/art/${i + 1}`,
        price: '0.1',
      }));
      
      jest.doMock('../../store/museStore', () => ({
        useMuseStore: () => ({
          isConnected: true,
          isLoading: false,
          error: null,
          artworks: manyArtworks,
        }),
      }));
      
      renderComponent();
      
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should navigate to next page', () => {
      const manyArtworks = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `Artwork ${i + 1}`,
        tokenURI: `https://metadata.example.com/art/${i + 1}`,
        price: '0.1',
      }));
      
      jest.doMock('../../store/museStore', () => ({
        useMuseStore: () => ({
          isConnected: true,
          isLoading: false,
          error: null,
          artworks: manyArtworks,
        }),
      }));
      
      renderComponent();
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when error exists', () => {
      jest.doMock('../../store/museStore', () => ({
        useMuseStore: () => ({
          isConnected: true,
          isLoading: false,
          error: 'Failed to load gallery',
          artworks: [],
        }),
      }));
      
      renderComponent();
      
      expect(screen.getByText('Failed to load gallery')).toBeInTheDocument();
    });

    it('should show retry button when error occurs', () => {
      jest.doMock('../../store/museStore', () => ({
        useMuseStore: () => ({
          isConnected: true,
          isLoading: false,
          error: 'Failed to load gallery',
          artworks: [],
          fetchAllArtworks: jest.fn(),
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
      
      const firstArtwork = screen.getByText('Cosmic Dreams');
      firstArtwork.focus();
      
      expect(document.activeElement).toBe(firstArtwork);
      
      fireEvent.tab();
      expect(document.activeElement).toBe(screen.getAllByText('Buy Now')[0]);
    });

    it('should have proper alt text for images', () => {
      renderComponent();
      
      const images = screen.getAllByRole('img');
      images.forEach((img, index) => {
        expect(img).toHaveAttribute('alt');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile view', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      renderComponent();
      
      expect(screen.getByText('Art Gallery')).toBeInTheDocument();
      // Should show single column on mobile
      const artworkGrid = screen.getByTestId('artwork-grid');
      expect(artworkGrid).toHaveClass('grid-cols-1');
    });

    it('should show grid layout on desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      renderComponent();
      
      const artworkGrid = screen.getByTestId('artwork-grid');
      expect(artworkGrid).toHaveClass('grid-cols-3');
    });
  });
});
