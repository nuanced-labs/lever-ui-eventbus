#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Bundle React type definitions into a single react.d.ts file
 * This script processes the generated TypeScript declarations and creates
 * a proper module declaration for the React integration subpath export.
 */

const distDir = path.join(__dirname, '..', 'dist');
const typesDir = path.join(distDir, 'types');
const reactTypesDir = path.join(typesDir, 'integrations', 'react');

// Ensure output directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Read the generated type files
function readTypeFile(filename) {
  const filePath = path.join(reactTypesDir, filename);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }
  return '';
}

// Generate the bundled React types
function generateReactTypes() {
  const contextTypes = readTypeFile('context.d.ts');
  const hooksTypes = readTypeFile('hooks.d.ts');
  const indexTypes = readTypeFile('index.d.ts');
  
  // Extract exports and types from each file
  let bundledTypes = `// Generated React integration types for lever-ui-eventbus
import { ReactNode, DependencyList } from 'react';
import type { EventBus, Constructor } from './index';

`;

  // Process context types
  if (contextTypes) {
    // Extract interfaces and function declarations from context.d.ts
    const contextContent = contextTypes
      .replace(/import[^;]*;/g, '') // Remove imports
      .replace(/export\s*{[^}]*}/g, '') // Remove export statements
      .trim();
    
    if (contextContent) {
      bundledTypes += `// Context types\n${contextContent}\n\n`;
    }
  }

  // Process hooks types  
  if (hooksTypes) {
    const hooksContent = hooksTypes
      .replace(/import[^;]*;/g, '') // Remove imports
      .replace(/export\s*{[^}]*}/g, '') // Remove export statements  
      .trim();
    
    if (hooksContent) {
      bundledTypes += `// Hooks types\n${hooksContent}\n\n`;
    }
  }

  // Add explicit exports
  bundledTypes += `// Explicit exports
export declare function EventBusProvider(props: EventBusProviderProps): JSX.Element;
export declare function useEventBus(): EventBus;
export declare function useEventSubscription<T>(
  type: Constructor<T>,
  handler: (event: T) => void,
  deps?: DependencyList
): void;
export declare function useEventPost(): <T>(event: T) => number;
export declare function useEventState<T, S>(
  type: Constructor<T>,
  initialValue: S,
  reducer: (currentState: S, event: T) => S
): S;
export declare function useLatestEvent<T>(
  type: Constructor<T>,
  initialValue?: T | null
): T | null;
export declare function useEventCollection<T>(
  type: Constructor<T>,
  maxSize?: number
): T[];
export declare function useEventBusManager(): {
  activeTypes: Constructor[];
  subscriptionCount: number;
  clear: () => void;
  refresh: () => void;
  getSubscriptionCount: (type: Constructor) => number;
  unsubscribeAll: (type: Constructor) => number;
};
`;

  return bundledTypes;
}

try {
  // Generate and write the bundled types
  const reactDts = generateReactTypes();
  const outputPath = path.join(distDir, 'react.d.ts');
  
  fs.writeFileSync(outputPath, reactDts);
  console.log('✅ Generated dist/react.d.ts');
  
  // Also create react.d.cts for CommonJS
  fs.writeFileSync(path.join(distDir, 'react.d.cts'), reactDts);
  console.log('✅ Generated dist/react.d.cts');
  
  // Clean up temporary types directory
  if (fs.existsSync(typesDir)) {
    fs.rmSync(typesDir, { recursive: true, force: true });
    console.log('🧹 Cleaned up temporary types directory');
  }
  
} catch (error) {
  console.error('❌ Error generating React types:', error);
  process.exit(1);
}