# EventBus Interactive Demo

A lightweight, interactive demonstration of the [lever-ui-eventbus](https://github.com/nuanced-labs/lever-ui-eventbus) library showcasing real-time event handling, type-safe subscriptions, and modern UI patterns.

## Features

### Interactive Event Publishers
- **User Authentication**: Login/logout simulation with real user data
- **Shopping Cart**: Add/remove items with dynamic pricing
- **Order Management**: Place orders with automatic cart clearing
- **Error Simulation**: Generate sample errors to test error handling
- **Custom Events**: Send custom messages with user input

### Live Subscribers
- **User Status Widget**: Real-time login state with user information
- **Cart Summary**: Live item count and total calculation
- **Activity Counters**: Track logins, orders, and errors
- **Event Frequency Chart**: Visual representation of event activity over time

### Real-time Event Log
- Live event streaming with timestamps
- Color-coded event types (success, error, info)
- Automatic scrolling and size management
- Clear log functionality

### Code Examples
- **Basic Usage**: Simple subscribe/post patterns
- **Polymorphic Events**: Inheritance-based event handling
- **Async Event Bus**: Non-blocking event delivery
- **Error Handling**: Robust error management and dead events

## Quick Start

### Prerequisites
- Node.js 16+ 
- Built lever-ui-eventbus library (automatically included with build process)

### Running the Demo

#### Option 1: Full Build (Recommended)
```bash
# From project root - builds everything including demo files
npm run build

# Start server
npx http-server demo -p 8000

# Open browser: http://localhost:8000
```

#### Option 2: Quick Demo Update
```bash
# From project root - quick build for demo development
npm run demo

# Start server (as instructed by the command output)
npx http-server demo -p 8000

# Open browser: http://localhost:8000
```

#### Option 3: Live Server (VS Code)
1. Install the "Live Server" extension in VS Code
2. Run `npm run demo` to ensure demo files are current
3. Right-click on `demo/index.html` → "Open with Live Server"

## Demo Interactions

### Try These Workflows:

1. **User Journey**:
   - Click "Login User" → See user status update
   - Add items to cart → Watch cart summary change
   - Place order → See counters update and cart clear
   - Logout → User status resets

2. **Event Exploration**:
   - Try different event types and watch the log
   - Send custom messages with different content
   - Simulate errors and see error handling
   - Clear the log and start fresh

3. **Code Learning**:
   - Switch between code example tabs
   - Compare different EventBus patterns
   - See how polymorphic events work
   - Learn async and error handling patterns

## File Structure

```
demo/
├── README.md          # This file
├── index.html         # Main demo page
├── styles.css         # Glassmorphism styling
└── demo.js           # EventBus integration & interactions
```

## Technical Implementation

### Event Classes
The demo defines realistic event classes that mirror common application patterns:

```javascript
class UserLoggedIn {
  constructor(userId, email, timestamp = Date.now()) {
    this.userId = userId;
    this.email = email;
    this.timestamp = timestamp;
  }
}

class ItemAddedToCart {
  constructor(itemId, itemName, price, timestamp = Date.now()) {
    this.itemId = itemId;
    this.itemName = itemName;
    this.price = price;
    this.timestamp = timestamp;
  }
}
```

### Real EventBus Integration
```javascript
import { EventBus } from '../dist/index.js';

const bus = new EventBus();

// Type-safe subscriptions
bus.subscribe(UserLoggedIn, (event) => {
  updateUserDisplay(event);
  incrementCounter('login');
});

// Event publishing
bus.post(new UserLoggedIn(userId, email));
```

### Live State Management
The demo maintains reactive state that updates across all UI components:
- User authentication status
- Shopping cart contents and totals
- Activity counters and metrics
- Event frequency visualization

## Design System

### Color Palette
- **Primary**: `#667eea` → `#764ba2` (gradient)
- **Success**: `#00f5a0` → `#00d4aa` 
- **Accent**: `#4facfe` → `#00f2fe`
- **Danger**: `#ff5722` → `#ff1744`

### Typography
- **UI Font**: Inter (Google Fonts)
- **Code Font**: JetBrains Mono (Google Fonts)

### Effects
- Glassmorphism with `backdrop-filter: blur()`
- Gradient backgrounds and buttons
- Smooth transitions and hover effects
- Responsive grid layout

## Browser Compatibility

- **Modern Browsers**: Chrome 88+, Firefox 87+, Safari 14+, Edge 88+
- **Features Used**: ES6 modules, backdrop-filter, CSS Grid
- **Fallbacks**: Graceful degradation for older browsers

## What This Demo Is NOT

- Part of the npm package (separate `/demo` directory)
- Production-ready application code
- Comprehensive testing suite
- Mobile-optimized (desktop-first design)

## Learning Resources

### EventBus Concepts Demonstrated:
1. **Type Safety**: TypeScript classes as event types
2. **Pub/Sub Pattern**: Decoupled event publishing and subscription
3. **Real-time Updates**: Immediate UI synchronization
4. **Error Handling**: Graceful failure management
5. **Event Lifecycle**: Creation, publishing, handling, cleanup

### Code Patterns Shown:
- Event-driven architecture
- Reactive state management  
- Observer pattern implementation
- Type-safe event handling
- Async event processing
- Polymorphic event dispatch

## Contributing

This demo is part of the lever-ui-eventbus project. For issues, improvements, or suggestions:

1. **Issues**: [GitHub Issues](https://github.com/nuanced-labs/lever-ui-eventbus/issues)
2. **Discussions**: [GitHub Discussions](https://github.com/nuanced-labs/lever-ui-eventbus/discussions)
3. **Pull Requests**: Follow the main project's contribution guidelines

## License

This demo is part of lever-ui-eventbus and is licensed under the [MIT License](../LICENSE).

---

**Tip**: Use your browser's developer tools to explore the EventBus instance (`window.demoBus`) and demo state (`window.demoState`) for deeper understanding!