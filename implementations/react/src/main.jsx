/**
 * SmartBank React Entry Point
 * 
 * WHY React 18's createRoot instead of ReactDOM.render?
 * - createRoot enables concurrent features (automatic batching, suspense, transitions)
 * - It's the new API for React 18+ and provides better performance
 * - StrictMode double-renders in development to catch side-effect bugs early
 * 
 * WHY Provider wrapping?
 * - React-Redux Provider makes the store available to all components via Context
 * - Without it, components can't access the Redux store
 * - This is the "dependency injection" pattern in React
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { store } from './store';
import './styles/App.css';

const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

/**
 * WHY StrictMode?
 * - Identifies unsafe lifecycle methods (deprecated in React 16.3+)
 * - Warns about legacy string ref usage
 * - Detects unexpected side effects (runs effects twice in dev)
 * - Warns about deprecated findDOMNode usage
 * - Helps prepare for future React features
 */
