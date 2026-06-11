// Global type declarations for the Vue project

// Declare Vue component imports (for .vue files)
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// Example: Declare a custom module export (replace 'my-module' with your actual module name)
declare module 'my-module' {
  export function exampleFunction(param: string): number;
  export const exampleConstant: string;
  export interface ExampleInterface {
    id: number;
    name: string;
  }
}

// Add more global types here as your project grows, e.g., for environment variables
declare global {
  interface Window {
    // Example: Add any global window properties
    myAppConfig: {
      apiUrl: string;
    };
  }
}