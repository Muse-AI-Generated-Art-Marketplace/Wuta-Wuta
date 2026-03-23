import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error for Error Boundary');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  let originalError;
  let originalLog;

  beforeEach(() => {
    // Suppress console.error and console.log for these tests
    originalError = console.error;
    originalLog = console.log;
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    // Restore console methods
    console.error = originalError;
    console.log = originalLog;
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('catches errors and displays fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Check that error fallback UI is displayed
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Go Home')).toBeInTheDocument();
  });

  it('displays error ID in development mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Check that error ID is displayed
    expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
    expect(screen.getByText(/ERR-/)).toBeInTheDocument();

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('shows error details in development mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Expand error details
    const detailsToggle = screen.getByText(/Show Error Details/);
    fireEvent.click(detailsToggle);

    // Check that error details are shown
    expect(screen.getByText('Error Message:')).toBeInTheDocument();
    expect(screen.getByText('Component Stack:')).toBeInTheDocument();

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('resets error state when Try Again button is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error state should be displayed
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

    // Click Try Again button
    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);

    // Rerender with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should now show the normal content
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('logs error to console in development mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Check that error was logged
    expect(console.error).toHaveBeenCalledWith(
      'Error Boundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    );

    process.env.NODE_ENV = originalNodeEnv;
  });
});
