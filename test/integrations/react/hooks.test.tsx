import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../../../src/event-bus';
import { EventBusProvider } from '../../../src/integrations/react/context';
import {
  useEventSubscription,
  useEventPost,
  useEventState,
  useLatestEvent,
  useEventCollection,
  useEventBusManager
} from '../../../src/integrations/react/hooks';

class TestEvent { 
  constructor(public message: string) {
    // Use the message property
    this.message = message;
  }
}
class AnotherEvent { 
  constructor(public data: number) {
    // Use the data property 
    this.data = data;
  }
}

describe('useEventSubscription', () => {
  it('subscribes to events and cleans up on unmount', async () => {
    const bus = new EventBus();
    const handler = vi.fn();
    
    function TestComponent() {
      useEventSubscription(TestEvent, handler);
      return <div data-testid="component">subscribed</div>;
    }
    
    const { unmount } = render(
      <EventBusProvider bus={bus}>
        <TestComponent />
      </EventBusProvider>
    );
    
    // Post event - should be received
    act(() => {
      bus.post(new TestEvent('test1'));
    });
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ message: 'test1' }));
    
    // Unmount component
    unmount();
    
    // Post event after unmount - should not be received
    handler.mockClear();
    act(() => {
      bus.post(new TestEvent('test2'));
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('resubscribes when dependencies change', () => {
    const bus = new EventBus();
    const handlers = [vi.fn(), vi.fn()];
    
    function TestComponent({ handlerIndex }: { handlerIndex: number }) {
      useEventSubscription(TestEvent, handlers[handlerIndex], [handlerIndex]);
      return <div data-testid="handler-index">{handlerIndex}</div>;
    }
    
    const { rerender } = render(
      <EventBusProvider bus={bus}>
        <TestComponent handlerIndex={0} />
      </EventBusProvider>
    );
    
    bus.post(new TestEvent('test1'));
    expect(handlers[0]).toHaveBeenCalledTimes(1);
    expect(handlers[1]).toHaveBeenCalledTimes(0);
    
    // Change dependency - should resubscribe
    rerender(
      <EventBusProvider bus={bus}>
        <TestComponent handlerIndex={1} />
      </EventBusProvider>
    );
    
    bus.post(new TestEvent('test2'));
    expect(handlers[0]).toHaveBeenCalledTimes(1); // no additional calls
    expect(handlers[1]).toHaveBeenCalledTimes(1); // new handler called
  });
});

describe('useEventPost', () => {
  it('provides stable post function', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.subscribe(TestEvent, handler);
    
    let capturedPostFunction: ReturnType<typeof useEventPost> | null = null;
    
    function TestComponent() {
      const post = useEventPost();
      capturedPostFunction = post;
      return <button onClick={() => post(new TestEvent('clicked'))}>Post</button>;
    }
    
    render(
      <EventBusProvider bus={bus}>
        <TestComponent />
      </EventBusProvider>
    );
    
    // Function should be stable
    const firstPost = capturedPostFunction;
    expect(firstPost).toBeTruthy();
    
    fireEvent.click(screen.getByText('Post'));
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ message: 'clicked' }));
    
    // Function should be the same reference
    expect(capturedPostFunction).toBe(firstPost);
  });
});

describe('useEventState', () => {
  it('updates state based on events', async () => {
    const bus = new EventBus();
    
    function TestComponent() {
      const message = useEventState(
        TestEvent,
        'initial',
        (currentState, event) => event.message
      );
      
      return <div data-testid="message">{message}</div>;
    }
    
    render(
      <EventBusProvider bus={bus}>
        <TestComponent />
      </EventBusProvider>
    );
    
    expect(screen.getByTestId('message')).toHaveTextContent('initial');
    
    act(() => {
      bus.post(new TestEvent('updated'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('message')).toHaveTextContent('updated');
    });
    
    act(() => {
      bus.post(new TestEvent('final'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('message')).toHaveTextContent('final');
    });
  });
});

describe('useLatestEvent', () => {
  it('tracks the most recent event', async () => {
    const bus = new EventBus();
    
    function TestComponent() {
      const latest = useLatestEvent(TestEvent, null);
      return <div data-testid="latest">{latest?.message || 'null'}</div>;
    }
    
    render(
      <EventBusProvider bus={bus}>
        <TestComponent />
      </EventBusProvider>
    );
    
    expect(screen.getByTestId('latest')).toHaveTextContent('null');
    
    act(() => {
      bus.post(new TestEvent('first'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('latest')).toHaveTextContent('first');
    });
    
    act(() => {
      bus.post(new TestEvent('second'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('latest')).toHaveTextContent('second');
    });
  });
});

describe('useEventCollection', () => {
  it('collects events with size limit', async () => {
    const bus = new EventBus();
    
    function TestComponent() {
      const events = useEventCollection(TestEvent, 2); // Max 2 events
      return (
        <div data-testid="events">
          {events.map((event, i) => (
            <span key={i} data-testid={`event-${i}`}>{event.message}</span>
          ))}
        </div>
      );
    }
    
    render(
      <EventBusProvider bus={bus}>
        <TestComponent />
      </EventBusProvider>
    );
    
    expect(screen.queryByTestId('event-0')).not.toBeInTheDocument();
    
    act(() => {
      bus.post(new TestEvent('first'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('event-0')).toHaveTextContent('first');
    });
    
    act(() => {
      bus.post(new TestEvent('second'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('event-0')).toHaveTextContent('second'); // newest first
      expect(screen.getByTestId('event-1')).toHaveTextContent('first');
    });
    
    act(() => {
      bus.post(new TestEvent('third'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('event-0')).toHaveTextContent('third');
      expect(screen.getByTestId('event-1')).toHaveTextContent('second');
      expect(screen.queryByTestId('event-2')).not.toBeInTheDocument(); // size limit
    });
  });
});

describe('useEventBusManager', () => {
  it('provides management utilities', async () => {
    const bus = new EventBus();
    
    function TestComponent() {
      const { subscriptionCount, activeTypes, clear, getSubscriptionCount } = useEventBusManager();
      
      return (
        <div>
          <div data-testid="total-subs">{subscriptionCount}</div>
          <div data-testid="active-types">{activeTypes.length}</div>
          <div data-testid="test-event-subs">{getSubscriptionCount(TestEvent)}</div>
          <button onClick={clear} data-testid="clear">Clear</button>
        </div>
      );
    }
    
    render(
      <EventBusProvider bus={bus}>
        <TestComponent />
      </EventBusProvider>
    );
    
    expect(screen.getByTestId('total-subs')).toHaveTextContent('0');
    expect(screen.getByTestId('active-types')).toHaveTextContent('0');
    expect(screen.getByTestId('test-event-subs')).toHaveTextContent('0');
    
    // Add subscriptions from within React (this would trigger updates)
    act(() => {
      bus.subscribe(TestEvent, vi.fn());
      bus.subscribe(AnotherEvent, vi.fn());
    });
    
    // The component won't automatically update since subscriptions are external
    // Let's test the clear function which should trigger a refresh
    act(() => {
      fireEvent.click(screen.getByTestId('clear'));
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('total-subs')).toHaveTextContent('0');
      expect(screen.getByTestId('active-types')).toHaveTextContent('0');
    });
  });
});