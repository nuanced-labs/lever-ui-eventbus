import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EventBus } from '../../../src/event-bus';
import { EventBusProvider, useEventBus } from '../../../src/integrations/react/context';

describe('EventBusProvider', () => {
  it('provides event bus to children', () => {
    const bus = new EventBus();
    
    function TestComponent() {
      const providedBus = useEventBus();
      return <div data-testid="bus-provided">{providedBus === bus ? 'yes' : 'no'}</div>;
    }
    
    render(
      <EventBusProvider bus={bus}>
        <TestComponent />
      </EventBusProvider>
    );
    
    expect(screen.getByTestId('bus-provided')).toHaveTextContent('yes');
  });
});

describe('useEventBus', () => {
  it('throws error when used outside provider', () => {
    function TestComponent() {
      try {
        useEventBus();
        return <div data-testid="error">no error</div>;
      } catch (error) {
        return <div data-testid="error">{(error as Error).message}</div>;
      }
    }
    
    render(<TestComponent />);
    
    expect(screen.getByTestId('error')).toHaveTextContent(
      'useEventBus must be used within an EventBusProvider'
    );
  });

  it('returns the correct bus instance', () => {
    const bus1 = new EventBus();
    const bus2 = new EventBus();
    
    function TestComponent() {
      const providedBus = useEventBus();
      return (
        <div data-testid="bus-check">
          {providedBus === bus1 ? 'bus1' : providedBus === bus2 ? 'bus2' : 'unknown'}
        </div>
      );
    }
    
    const { rerender } = render(
      <EventBusProvider bus={bus1}>
        <TestComponent />
      </EventBusProvider>
    );
    
    expect(screen.getByTestId('bus-check')).toHaveTextContent('bus1');
    
    rerender(
      <EventBusProvider bus={bus2}>
        <TestComponent />
      </EventBusProvider>
    );
    
    expect(screen.getByTestId('bus-check')).toHaveTextContent('bus2');
  });
});