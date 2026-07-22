/**
 * SmartBank Vue Entry Point
 * 
 * VUE 3 COMPOSITION API vs OPTIONS API:
 * 
 * Options API (Vue 2 style):
 * - Organizes code by option type (data, methods, computed, watch)
 * - Good for simple components
 * - Hard to extract and reuse logic across components
 * 
 * Composition API (Vue 3):
 * - Organizes code by logical concern
 * - Reusable logic via composables (like React hooks)
 * - Better TypeScript support
 * - Smaller bundle size (tree-shaking)
 * - Better code organization in large components
 * 
 * APP CREATION:
 * - createApp() returns app instance
 * - Chain .use() to install plugins (router, pinia)
 * - .mount() attaches to DOM
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './styles/App.css';

// WHY createApp is a function, not a global?
// - Enables multiple Vue apps on same page
// - Better isolation and testing
// - Avoids global state pollution

const app = createApp(App);

// WHY .use() for plugins?
// - Plugin system makes Vue extensible
// - Router and Pinia need to be installed globally
// - They provide inject/provide for all components

app.use(createPinia());
app.use(router);

app.mount('#app');

/**
 * WHY Pinia over Vuex?
 * - Simpler API (no mutations, no modules)
 * - Better TypeScript support
 * - Composition API friendly
 * - Official Vue state management (replaces Vuex)
 * - Devtools support
 * - Hot module replacement
 */
