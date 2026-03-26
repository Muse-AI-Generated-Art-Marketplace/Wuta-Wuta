import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ThemeProvider, { useTheme } from '../../contexts/ThemeContext';
import Header from '../Header';

// Test wrapper
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

// Test component to use theme context
const ThemeTestComponent = () => {
  const { isDark, toggleTheme, theme } = useTheme();
  
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <span data-testid="is-dark-value">{isDark.toString()}</span>
      <button onClick={toggleTheme} data-testid="toggle-theme">Toggle Theme</button>
    </div>
  );
};

describe('ThemeProvider and Dark Mode', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset document classes
    document.documentElement.classList.remove('dark');
  });

  it('provides theme context with default light theme', () => {
    render(
      <TestWrapper>
        <ThemeTestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    expect(screen.getByTestId('is-dark-value')).toHaveTextContent('false');
  });

  it('toggles theme correctly', () => {
    render(
      <TestWrapper>
        <ThemeTestComponent />
      </TestWrapper>
    );

    // Initially light
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Toggle to dark
    fireEvent.click(screen.getByTestId('toggle-theme'));
    
    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    expect(screen.getByTestId('is-dark-value')).toHaveTextContent('true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');

    // Toggle back to light
    fireEvent.click(screen.getByTestId('toggle-theme'));
    
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    expect(screen.getByTestId('is-dark-value')).toHaveTextContent('false');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('respects saved theme preference from localStorage', () => {
    // Set dark theme in localStorage before rendering
    localStorage.setItem('theme', 'dark');

    render(
      <TestWrapper>
        <ThemeTestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    expect(screen.getByTestId('is-dark-value')).toHaveTextContent('true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('respects system preference when no saved theme', () => {
    // Mock system dark mode preference
    const mockMatchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    
    window.matchMedia = mockMatchMedia;

    render(
      <TestWrapper>
        <ThemeTestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    expect(screen.getByTestId('is-dark-value')).toHaveTextContent('true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('Header component integrates with theme context', () => {
    render(
      <TestWrapper>
        <Header
          onMenuClick={() => {}}
          onConnectWallet={() => {}}
          onDisconnectWallet={() => {}}
          address={null}
          isConnected={false}
        />
      </TestWrapper>
    );

    const themeToggle = screen.getByLabelText(/Toggle theme/i);
    expect(themeToggle).toBeInTheDocument();

    // Should show moon icon initially (light mode)
    expect(themeToggle.querySelector('svg')).toBeInTheDocument();

    // Click to toggle theme
    fireEvent.click(themeToggle);
    
    // Should still have the toggle button
    expect(themeToggle).toBeInTheDocument();
  });

  it('throws error when useTheme is used outside ThemeProvider', () => {
    const consoleError = jest.fn();
    const originalError = console.error;
    console.error = consoleError;

    const ComponentWithoutProvider = () => {
      useTheme();
      return <div>Test</div>;
    };

    expect(() => {
      render(<ComponentWithoutProvider />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    console.error = originalError;
  });

  it('applies dark mode classes to document element', () => {
    render(
      <TestWrapper>
        <ThemeTestComponent />
      </TestWrapper>
    );

    // Initially no dark class
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Toggle to dark mode
    fireEvent.click(screen.getByTestId('toggle-theme'));
    
    // Should have dark class
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Toggle back to light mode
    fireEvent.click(screen.getByTestId('toggle-theme'));
    
    // Should not have dark class
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persists theme preference across re-renders', () => {
    const { rerender } = render(
      <TestWrapper>
        <ThemeTestComponent />
      </TestWrapper>
    );

    // Toggle to dark mode
    fireEvent.click(screen.getByTestId('toggle-theme'));
    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');

    // Re-render component
    rerender(
      <TestWrapper>
        <ThemeTestComponent />
      </TestWrapper>
    );

    // Should maintain dark theme
    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
