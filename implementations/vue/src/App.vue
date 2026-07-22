<!--
  SmartBank Vue Root Component
  
  SINGLE FILE COMPONENT (SFC):
  - Combines template, script, and style in one file
  - WHY? Co-located code is easier to maintain
  - Each section has its own purpose:
    - template: HTML-like syntax with Vue directives
    - script: Component logic and state
    - style: Scoped or global CSS
  
  TEMPLATE SYNTAX:
  - {{ }}: Text interpolation (mustaches)
  - v-bind: attribute binding (shorthand :)
  - v-on: event handling (shorthand @)
  - v-if/v-show: conditional rendering
  - v-for: list rendering
  - v-model: two-way form binding
  
  WHY <script setup>?
  - Less boilerplate (no export default, no return)
  - Better TypeScript inference
  - Faster compilation (static analysis)
  - The modern Vue 3 way
-->
<script setup>
import { RouterView } from 'vue-router';
import { useAuthStore } from './store/auth';
import { computed } from 'vue';

const authStore = useAuthStore();

// WHY computed for isAuthenticated?
// - Automatically updates when authStore.user changes
// - Cached: only recalculates when dependencies change
// - Like React's useMemo but built into Vue's reactivity
const isAuthenticated = computed(() => authStore.isAuthenticated);
</script>

<template>
  <div id="app">
    <!--
      WHY router-view?
      - Renders the matched route's component
      - Acts as a placeholder for page content
      - Updates automatically on navigation
    -->
    <RouterView />
  </div>
</template>

<style>
/* Global styles - not scoped */
/* WHY global in App.vue? */
/* - Base styles affect the entire app */
/* - Reset, typography, CSS variables */
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
}
</style>
