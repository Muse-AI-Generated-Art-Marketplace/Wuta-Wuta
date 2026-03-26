import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CommandPalette from '../CommandPalette';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe.skip('CommandPalette Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onNavigate: jest.fn(),
    activeTab: 'gallery',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByTestId('command-palette')).toBeInTheDocument();
      expect(screen.getByTestId('command-palette-input')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<CommandPalette {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument();
    });

    it('should display all navigation items', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByTestId('command-item-gallery')).toBeInTheDocument();
      expect(screen.getByTestId('command-item-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('command-item-create')).toBeInTheDocument();
      expect(screen.getByTestId('command-item-profile')).toBeInTheDocument();
      expect(screen.getByTestId('command-item-transactions')).toBeInTheDocument();
    });

    it('should show Active badge on the current tab', () => {
      render(<CommandPalette {...defaultProps} activeTab="gallery" />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should show keyboard hints in footer', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByText('navigate')).toBeInTheDocument();
      expect(screen.getByText('select')).toBeInTheDocument();
      expect(screen.getByText('close')).toBeInTheDocument();
    });
  });

  describe('Search Filtering', () => {
    it('should filter items by search query', () => {
      render(<CommandPalette {...defaultProps} />);
      const input = screen.getByTestId('command-palette-input');

      fireEvent.change(input, { target: { value: 'dash' } });

      expect(screen.getByTestId('command-item-dashboard')).toBeInTheDocument();
      expect(screen.queryByTestId('command-item-gallery')).not.toBeInTheDocument();
      expect(screen.queryByTestId('command-item-create')).not.toBeInTheDocument();
    });

    it('should show empty state when no results match', () => {
      render(<CommandPalette {...defaultProps} />);
      const input = screen.getByTestId('command-palette-input');

      fireEvent.change(input, { target: { value: 'xyznonexistent' } });

      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('should filter by keywords', () => {
      render(<CommandPalette {...defaultProps} />);
      const input = screen.getByTestId('command-palette-input');

      fireEvent.change(input, { target: { value: 'analytics' } });

      expect(screen.getByTestId('command-item-dashboard')).toBeInTheDocument();
      expect(screen.queryByTestId('command-item-gallery')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close on Escape key', () => {
      render(<CommandPalette {...defaultProps} />);
      const input = screen.getByTestId('command-palette-input');

      fireEvent.keyDown(input, { key: 'Escape' });

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should navigate with arrow keys and select with Enter', () => {
      render(<CommandPalette {...defaultProps} />);
      const input = screen.getByTestId('command-palette-input');

      // First item is selected by default (gallery). Press down to go to dashboard.
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(defaultProps.onNavigate).toHaveBeenCalledWith('dashboard');
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should wrap around when pressing ArrowDown at last item', () => {
      render(<CommandPalette {...defaultProps} />);
      const input = screen.getByTestId('command-palette-input');

      // Move through items: gallery -> dashboard -> create -> profile -> transactions -> wraps to gallery
      fireEvent.keyDown(input, { key: 'ArrowDown' }); // dashboard
      fireEvent.keyDown(input, { key: 'ArrowDown' }); // create
      fireEvent.keyDown(input, { key: 'ArrowDown' }); // profile
      fireEvent.keyDown(input, { key: 'ArrowDown' }); // transactions
      fireEvent.keyDown(input, { key: 'ArrowDown' }); // wraps to gallery

      fireEvent.keyDown(input, { key: 'Enter' });

      expect(defaultProps.onNavigate).toHaveBeenCalledWith('gallery');
    });

    it('should wrap around when pressing ArrowUp at first item', () => {
      render(<CommandPalette {...defaultProps} />);
      const input = screen.getByTestId('command-palette-input');

      // At first item (gallery), pressing up wraps to last item (transactions)
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      fireEvent.keyDown(input, { key: 'Enter' });

      expect(defaultProps.onNavigate).toHaveBeenCalledWith('transactions');
    });
  });

  describe('Item Selection', () => {
    it('should call onNavigate and onClose when clicking an item', () => {
      render(<CommandPalette {...defaultProps} />);
      const dashboardItem = screen.getByTestId('command-item-dashboard');

      fireEvent.click(dashboardItem);

      expect(defaultProps.onNavigate).toHaveBeenCalledWith('dashboard');
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Backdrop', () => {
    it('should close when backdrop is clicked', () => {
      render(<CommandPalette {...defaultProps} />);
      const backdrop = screen.getByTestId('command-palette-backdrop');

      fireEvent.click(backdrop);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have dialog role with aria-modal', () => {
      render(<CommandPalette {...defaultProps} />);
      const palette = screen.getByTestId('command-palette');

      expect(palette).toHaveAttribute('role', 'dialog');
      expect(palette).toHaveAttribute('aria-modal', 'true');
      expect(palette).toHaveAttribute('aria-label', 'Command Palette');
    });

    it('should have listbox role on results container', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('should have option role on each item', () => {
      render(<CommandPalette {...defaultProps} />);
      const options = screen.getAllByRole('option');
      expect(options.length).toBe(5);
    });
  });
});
