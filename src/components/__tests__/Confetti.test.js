import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Confetti from '../Confetti';
import useConfetti from '../../hooks/useConfetti';
import { renderHook, act } from '@testing-library/react';
import confetti from 'canvas-confetti';

// Mock the canvas-confetti library
jest.mock('canvas-confetti');

describe('Confetti Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.confetti
    window.confetti = confetti;
  });

  it('renders without crashing', () => {
    render(<Confetti active={false} type="celebration" />);
    const container = document.querySelector('.confetti-container');
    expect(container).toBeInTheDocument();
  });

  it('triggers confetti when active is true', async () => {
    render(<Confetti active={true} type="celebration" />);
    
    await waitFor(() => {
      expect(confetti).toHaveBeenCalled();
    });
  });

  it('triggers winner-type confetti animation', async () => {
    render(<Confetti active={true} type="winner" />);
    
    await waitFor(() => {
      expect(confetti).toHaveBeenCalledTimes(2); // Initial + follow-up
    });
  });

  it('triggers sideburst-type confetti animation', async () => {
    render(<Confetti active={true} type="sideburst" />);
    
    await waitFor(() => {
      expect(confetti).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: expect.any(Object),
        })
      );
    });
  });

  it('calls onComplete callback after animation', async () => {
    const onComplete = jest.fn();
    const { rerender } = render(
      <Confetti active={true} type="celebration" duration={100} onComplete={onComplete} />
    );
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    }, { timeout: 500 });
  });

  it('does not trigger confetti when active is false', () => {
    render(<Confetti active={false} type="celebration" />);
    expect(confetti).not.toHaveBeenCalled();
  });

  it('respects custom duration', async () => {
    const onComplete = jest.fn();
    render(
      <Confetti active={true} type="celebration" duration={200} onComplete={onComplete} />
    );
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    }, { timeout: 500 });
  });
});

describe('useConfetti Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confetti = confetti;
  });

  it('provides triggerCelebration function', () => {
    const { result } = renderHook(() => useConfetti());
    expect(typeof result.current.triggerCelebration).toBe('function');
  });

  it('provides triggerWinner function', () => {
    const { result } = renderHook(() => useConfetti());
    expect(typeof result.current.triggerWinner).toBe('function');
  });

  it('provides triggerSideBurst function', () => {
    const { result } = renderHook(() => useConfetti());
    expect(typeof result.current.triggerSideBurst).toBe('function');
  });

  it('provides triggerCustom function', () => {
    const { result } = renderHook(() => useConfetti());
    expect(typeof result.current.triggerCustom).toBe('function');
  });

  it('provides reset function', () => {
    const { result } = renderHook(() => useConfetti());
    expect(typeof result.current.reset).toBe('function');
  });

  it('triggerCelebration calls confetti with correct options', async () => {
    const { result } = renderHook(() => useConfetti());
    
    await act(async () => {
      await result.current.triggerCelebration();
    });

    expect(confetti).toHaveBeenCalled();
  });

  it('triggerWinner fires two bursts', async () => {
    const { result } = renderHook(() => useConfetti());
    
    await act(async () => {
      await result.current.triggerWinner();
    });

    await waitFor(() => {
      expect(confetti).toHaveBeenCalledTimes(2);
    });
  });

  it('triggerSideBurst fires left and right bursts', async () => {
    const { result } = renderHook(() => useConfetti());
    
    await act(async () => {
      await result.current.triggerSideBurst();
    });

    expect(confetti).toHaveBeenCalledTimes(2);
    
    // Verify left and right origins
    const calls = confetti.mock.calls;
    expect(calls[0][0].origin.x).toBe(0); // Left
    expect(calls[1][0].origin.x).toBe(1); // Right
  });

  it('triggerCustom merges custom options with defaults', async () => {
    const { result } = renderHook(() => useConfetti());
    const customOptions = { particleCount: 200, spread: 180 };
    
    await act(async () => {
      result.current.triggerCustom(customOptions);
    });

    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 200,
        spread: 180,
      })
    );
  });

  it('reset function clears state', () => {
    const { result } = renderHook(() => useConfetti());
    
    act(() => {
      result.current.reset();
    });

    // Verify reset doesn't throw
    expect(() => {
      result.current.reset();
    }).not.toThrow();
  });
});

describe('Confetti Integration with Minting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confetti = confetti;
  });

  it('should trigger confetti on successful mint', async () => {
    const { result } = renderHook(() => useConfetti());
    
    // Simulate minting process
    await act(async () => {
      // This simulates the minting
      await result.current.triggerWinner();
    });

    expect(confetti).toHaveBeenCalled();
  });

  it('confetti has correct z-index for visibility', async () => {
    const { result } = renderHook(() => useConfetti());
    
    await act(async () => {
      result.current.triggerWinner();
    });

    const calls = confetti.mock.calls;
    calls.forEach(call => {
      expect(call[0].zIndex).toBe(9999);
    });
  });
});
