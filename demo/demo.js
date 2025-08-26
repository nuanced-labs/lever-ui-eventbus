// Import EventBus from unpkg CDN
import { EventBus } from 'https://unpkg.com/lever-ui-eventbus@latest/dist/index.js';

// Define event classes for the demo
class UserLoggedIn {
  constructor(userId, email, timestamp = Date.now()) {
    this.userId = userId;
    this.email = email;
    this.timestamp = timestamp;
  }
}

class UserLoggedOut {
  constructor(userId, timestamp = Date.now()) {
    this.userId = userId;
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

class ItemRemovedFromCart {
  constructor(itemId, itemName, timestamp = Date.now()) {
    this.itemId = itemId;
    this.itemName = itemName;
    this.timestamp = timestamp;
  }
}

class OrderPlaced {
  constructor(orderId, total, itemCount, timestamp = Date.now()) {
    this.orderId = orderId;
    this.total = total;
    this.itemCount = itemCount;
    this.timestamp = timestamp;
  }
}

class ErrorOccurred {
  constructor(message, type, timestamp = Date.now()) {
    this.message = message;
    this.type = type;
    this.timestamp = timestamp;
  }
}

class CustomMessage {
  constructor(message, timestamp = Date.now()) {
    this.message = message;
    this.timestamp = timestamp;
  }
}

// Initialize EventBus
const bus = new EventBus();

// Demo state
let currentUser = null;
let cartItems = [];
let totalOrders = 0;
let totalLogins = 0;
let totalErrors = 0;
let eventFrequency = new Array(20).fill(0); // Track last 20 time slots

// DOM elements
const elements = {
  // Buttons
  loginBtn: document.getElementById('login-btn'),
  logoutBtn: document.getElementById('logout-btn'),
  addItemBtn: document.getElementById('add-item-btn'),
  removeItemBtn: document.getElementById('remove-item-btn'),
  placeOrderBtn: document.getElementById('place-order-btn'),
  errorBtn: document.getElementById('error-btn'),
  customBtn: document.getElementById('custom-btn'),
  clearLogBtn: document.getElementById('clear-log-btn'),
  
  // Inputs
  customMessage: document.getElementById('custom-message'),
  
  // Display elements
  eventLog: document.getElementById('event-log'),
  userStatus: document.getElementById('user-status'),
  userInfo: document.getElementById('user-info'),
  cartItems: document.getElementById('cart-items'),
  cartTotal: document.getElementById('cart-total'),
  loginCount: document.getElementById('login-count'),
  orderCount: document.getElementById('order-count'),
  errorCount: document.getElementById('error-count'),
  chartBars: document.getElementById('chart-bars'),
  
  // Tab system
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane')
};

// Utility functions
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString();
}

function addLogEntry(eventType, data, level = 'info') {
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry ${level}`;
  
  logEntry.innerHTML = `
    <div class="log-timestamp">${formatTime(Date.now())}</div>
    <div class="log-event-type">${eventType}</div>
    <div class="log-data">${JSON.stringify(data, null, 2)}</div>
  `;
  
  // Remove placeholder if exists
  const placeholder = elements.eventLog.querySelector('.log-placeholder');
  if (placeholder) {
    placeholder.remove();
  }
  
  // Add to top of log
  elements.eventLog.insertBefore(logEntry, elements.eventLog.firstChild);
  
  // Keep only last 50 entries
  const entries = elements.eventLog.querySelectorAll('.log-entry');
  if (entries.length > 50) {
    entries[entries.length - 1].remove();
  }
  
  // Update frequency chart
  updateFrequencyChart();
}

function updateFrequencyChart() {
  // Shift array and add new event
  eventFrequency.shift();
  eventFrequency.push(eventFrequency[eventFrequency.length - 1] + 1);
  
  // Reset periodically to show activity waves
  if (Math.random() < 0.1) {
    eventFrequency = eventFrequency.map(val => Math.max(0, val - 1));
  }
  
  // Update chart bars
  elements.chartBars.innerHTML = '';
  const maxValue = Math.max(...eventFrequency, 1);
  
  eventFrequency.forEach((value, index) => {
    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    bar.style.height = `${(value / maxValue) * 100}%`;
    bar.style.opacity = value > 0 ? 0.8 : 0.2;
    elements.chartBars.appendChild(bar);
  });
}

function updateCartDisplay() {
  elements.cartItems.textContent = cartItems.length;
  const total = cartItems.reduce((sum, item) => sum + item.price, 0);
  elements.cartTotal.textContent = formatCurrency(total);
}

function updateUserDisplay() {
  const statusBadge = elements.userStatus.querySelector('.status-badge');
  
  if (currentUser) {
    statusBadge.textContent = 'Logged In';
    statusBadge.className = 'status-badge status-online';
    elements.userInfo.innerHTML = `
      <div>User ID: ${currentUser.userId}</div>
      <div>Email: ${currentUser.email}</div>
      <div>Login Time: ${formatTime(currentUser.timestamp)}</div>
    `;
  } else {
    statusBadge.textContent = 'Logged Out';
    statusBadge.className = 'status-badge status-offline';
    elements.userInfo.innerHTML = '';
  }
}

// Sample data for demo
const sampleItems = [
  { name: 'MacBook Pro', price: 2499.99 },
  { name: 'iPhone 15', price: 999.99 },
  { name: 'AirPods Pro', price: 249.99 },
  { name: 'iPad Air', price: 599.99 },
  { name: 'Apple Watch', price: 399.99 },
  { name: 'Magic Keyboard', price: 299.99 }
];

const sampleEmails = [
  'alice@example.com',
  'bob@example.com', 
  'charlie@example.com',
  'diana@example.com',
  'eve@example.com'
];

const errorMessages = [
  'Network timeout occurred',
  'Payment processing failed',
  'Invalid user credentials',
  'Database connection lost',
  'Server overload detected'
];

// Event subscribers
bus.subscribe(UserLoggedIn, (event) => {
  currentUser = event;
  totalLogins++;
  elements.loginCount.textContent = totalLogins;
  updateUserDisplay();
  addLogEntry('UserLoggedIn', {
    userId: event.userId,
    email: event.email
  }, 'success');
});

bus.subscribe(UserLoggedOut, (event) => {
  currentUser = null;
  updateUserDisplay();
  addLogEntry('UserLoggedOut', {
    userId: event.userId
  }, 'info');
});

bus.subscribe(ItemAddedToCart, (event) => {
  cartItems.push(event);
  updateCartDisplay();
  addLogEntry('ItemAddedToCart', {
    itemName: event.itemName,
    price: formatCurrency(event.price)
  }, 'success');
});

bus.subscribe(ItemRemovedFromCart, (event) => {
  const index = cartItems.findIndex(item => item.itemId === event.itemId);
  if (index > -1) {
    cartItems.splice(index, 1);
  }
  updateCartDisplay();
  addLogEntry('ItemRemovedFromCart', {
    itemName: event.itemName
  }, 'info');
});

bus.subscribe(OrderPlaced, (event) => {
  cartItems = []; // Clear cart
  totalOrders++;
  elements.orderCount.textContent = totalOrders;
  updateCartDisplay();
  addLogEntry('OrderPlaced', {
    orderId: event.orderId,
    total: formatCurrency(event.total),
    itemCount: event.itemCount
  }, 'success');
});

bus.subscribe(ErrorOccurred, (event) => {
  totalErrors++;
  elements.errorCount.textContent = totalErrors;
  addLogEntry('ErrorOccurred', {
    type: event.type,
    message: event.message
  }, 'error');
});

bus.subscribe(CustomMessage, (event) => {
  addLogEntry('CustomMessage', {
    message: event.message
  }, 'info');
});

// Button event handlers
elements.loginBtn.addEventListener('click', () => {
  if (currentUser) return; // Already logged in
  
  const email = sampleEmails[Math.floor(Math.random() * sampleEmails.length)];
  const userId = generateId();
  
  bus.post(new UserLoggedIn(userId, email));
});

elements.logoutBtn.addEventListener('click', () => {
  if (!currentUser) return; // Already logged out
  
  bus.post(new UserLoggedOut(currentUser.userId));
});

elements.addItemBtn.addEventListener('click', () => {
  const item = sampleItems[Math.floor(Math.random() * sampleItems.length)];
  const itemId = generateId();
  
  bus.post(new ItemAddedToCart(itemId, item.name, item.price));
});

elements.removeItemBtn.addEventListener('click', () => {
  if (cartItems.length === 0) return; // Cart is empty
  
  const item = cartItems[Math.floor(Math.random() * cartItems.length)];
  bus.post(new ItemRemovedFromCart(item.itemId, item.itemName));
});

elements.placeOrderBtn.addEventListener('click', () => {
  if (cartItems.length === 0) return; // Cart is empty
  
  const total = cartItems.reduce((sum, item) => sum + item.price, 0);
  const orderId = `ORDER-${generateId()}`;
  
  bus.post(new OrderPlaced(orderId, total, cartItems.length));
});

elements.errorBtn.addEventListener('click', () => {
  const message = errorMessages[Math.floor(Math.random() * errorMessages.length)];
  const type = Math.random() > 0.5 ? 'CRITICAL' : 'WARNING';
  
  bus.post(new ErrorOccurred(message, type));
});

elements.customBtn.addEventListener('click', () => {
  const message = elements.customMessage.value.trim();
  if (!message) return;
  
  bus.post(new CustomMessage(message));
  elements.customMessage.value = '';
});

elements.customMessage.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    elements.customBtn.click();
  }
});

elements.clearLogBtn.addEventListener('click', () => {
  elements.eventLog.innerHTML = '<div class="log-placeholder">Events will appear here as they\'re published...</div>';
});

// Tab system
elements.tabBtns.forEach((btn, index) => {
  btn.addEventListener('click', () => {
    // Remove active class from all tabs and panes
    elements.tabBtns.forEach(b => b.classList.remove('active'));
    elements.tabPanes.forEach(p => p.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding pane
    btn.classList.add('active');
    elements.tabPanes[index].classList.add('active');
  });
});

// Auto-demo mode (optional - triggers events automatically)
let autoDemoInterval = null;

function startAutoDemo() {
  const actions = [
    () => elements.loginBtn.click(),
    () => elements.addItemBtn.click(),
    () => elements.addItemBtn.click(),
    () => elements.placeOrderBtn.click(),
    () => elements.logoutBtn.click(),
    () => elements.errorBtn.click()
  ];
  
  let actionIndex = 0;
  autoDemoInterval = setInterval(() => {
    if (actionIndex < actions.length) {
      actions[actionIndex]();
      actionIndex++;
    } else {
      clearInterval(autoDemoInterval);
      autoDemoInterval = null;
    }
  }, 2000);
}

// Initialize demo
document.addEventListener('DOMContentLoaded', () => {
  updateUserDisplay();
  updateCartDisplay();
  updateFrequencyChart();
  
  // Add some initial log entries to show the format
  setTimeout(() => {
    bus.post(new CustomMessage('Demo initialized - try the buttons above!'));
  }, 1000);
  
  // Optional: Start auto demo after 5 seconds of inactivity
  // setTimeout(startAutoDemo, 5000);
});

// Make some functions globally available for debugging
window.demoBus = bus;
window.demoState = {
  currentUser,
  cartItems,
  totalOrders,
  totalLogins,
  totalErrors
};
window.startAutoDemo = startAutoDemo;