/**
 * ============================================================================
 * SmartBank - Main Entry Point
 * ============================================================================
 * 
 * PURPOSE:
 * Application entry point that initializes all modules and starts the app.
 * 
 * INITIALIZATION ORDER:
 * 1. Constants (no dependencies)
 * 2. Utilities (depend on constants)
 * 3. Services (depend on utilities and constants)
 * 4. Store (depends on nothing)
 * 5. Router (depends on services)
 * 6. Components (depend on everything)
 * 7. Mount components and start router
 * 
 * MODULE SYSTEM:
 * We use ES6 modules (import/export) for:
 * - Better tree-shaking (remove unused code)
 * - Clear dependency graph
 * - Browser native support
 * - IDE autocompletion
 * ============================================================================
 */

// Import styles
import './styles/main.css';

// Import constants
import { APP_NAME, APP_VERSION } from './constants/app.js';
import { ROUTES } from './constants/app.js';

// Import services
import AuthService from './services/auth.js';
import AccountService from './services/account.js';
import CardService from './services/card.js';
import TransactionService from './services/transaction.js';
import NotificationService from './services/notification.js';
import BeneficiaryService from './services/beneficiary.js';
import SearchService from './services/search.js';
import UserService from './services/user.js';

// Import store
import store from './store/store.js';

// Import router
import router from './router/router.js';

// Import components
import Header from './components/common/Header.js';
import Sidebar from './components/common/Sidebar.js';
import toast from './components/common/Toast.js';
import { FullPageLoader } from './components/common/Loader.js';
import { addTooltips } from './components/common/Tooltip.js';

/**
 * SmartBank Application Class
 * 
 * CONCEPT: Application Shell
 * - The main container that holds all UI components
 * - Manages component lifecycle
 * - Handles global events
 */
class SmartBankApp {
    constructor() {
        this.header = null;
        this.sidebar = null;
        this.mainContent = null;
        this.isInitialized = false;
        
        // Bind methods
        this.handleRouteChange = this.handleRouteChange.bind(this);
        this.handleAuthEvent = this.handleAuthEvent.bind(this);
    }
    
    /**
     * initialize - Initialize the application
     * 
     * INITIALIZATION SEQUENCE:
     * 1. Show loading screen
     * 2. Check authentication
     * 3. Load user data
     * 4. Set up routes
     * 5. Mount components
     * 6. Hide loading screen
     */
    async initialize() {
        console.log(`🚀 Initializing ${APP_NAME} v${APP_VERSION}`);
        
        // Show loading screen
        this.showLoader();
        
        try {
            // Check if user is authenticated
            if (AuthService.isAuthenticated()) {
                await this.loadUserData();
            }
            
            // Set up routes
            this.setupRoutes();
            
            // Set up components
            this.setupComponents();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize tooltips
            addTooltips();
            
            // Start router
            router.start();
            
            this.isInitialized = true;
            console.log(`✅ ${APP_NAME} initialized successfully`);
            
        } catch (error) {
            console.error('❌ Initialization error:', error);
            toast.error('Error al inicializar la aplicación');
        } finally {
            this.hideLoader();
        }
    }
    
    /**
     * setupRoutes - Configure application routes
     * 
     * ROUTE STRUCTURE:
     * - Public routes: /login, /register
     * - Protected routes: /dashboard, /accounts, etc.
     * - Admin routes: /admin/*
     */
    setupRoutes() {
        // Public routes
        router.register(ROUTES.LOGIN, () => this.renderLogin());
        router.register(ROUTES.REGISTER, () => this.renderRegister());
        
        // Protected routes
        router.register(ROUTES.DASHBOARD, () => this.renderDashboard());
        router.register(ROUTES.ACCOUNTS, () => this.renderAccounts());
        router.register(ROUTES.ACCOUNT_DETAIL, (route) => this.renderAccountDetail(route));
        router.register(ROUTES.CARDS, () => this.renderCards());
        router.register(ROUTES.TRANSACTIONS, () => this.renderTransactions());
        router.register(ROUTES.TRANSFER, () => this.renderTransfer());
        router.register(ROUTES.BENEFICIARIES, () => this.renderBeneficiaries());
        router.register(ROUTES.NOTIFICATIONS, () => this.renderNotifications());
        router.register(ROUTES.PROFILE, () => this.renderProfile());
        router.register(ROUTES.SETTINGS, () => this.renderSettings());
        
        // 404 handler
        router.setNotFound(() => this.renderNotFound());
    }
    
    /**
     * setupComponents - Initialize main UI components
     */
    setupComponents() {
        const app = document.getElementById('app');
        
        if (!app) {
            console.error('App container not found');
            return;
        }
        
        // Create app structure
        app.innerHTML = `
            <div class="app">
                <div class="app__header"></div>
                <div class="app__layout">
                    <div class="app__sidebar"></div>
                    <main class="app__main">
                        <div class="app__content"></div>
                    </main>
                </div>
            </div>
        `;
        
        // Mount header
        this.header = new Header();
        this.header.mount(app.querySelector('.app__header'));
        
        // Mount sidebar (only for authenticated routes)
        if (AuthService.isAuthenticated()) {
            this.sidebar = new Sidebar();
            this.sidebar.mount(app.querySelector('.app__sidebar'));
        }
        
        // Get main content container
        this.mainContent = app.querySelector('.app__content');
    }
    
    /**
     * setupEventListeners - Set up global event listeners
     */
    setupEventListeners() {
        // Auth events
        window.addEventListener('auth:logout', this.handleAuthEvent);
        window.addEventListener('auth:expired', this.handleAuthEvent);
        
        // Route changes
        window.addEventListener('hashchange', this.handleRouteChange);
        
        // Online/offline status
        window.addEventListener('online', () => {
            toast.success('Conexión restaurada');
        });
        
        window.addEventListener('offline', () => {
            toast.warning('Sin conexión a internet');
        });
    }
    
    /**
     * loadUserData - Load user data after authentication
     */
    async loadUserData() {
        try {
            const user = AuthService.getCurrentUser();
            store.dispatch('SET_USER', user);
            
            // Load initial data
            const [accounts, notifications] = await Promise.all([
                AccountService.getAll().catch(() => ({ data: [] })),
                NotificationService.getUnreadCount().catch(() => 0),
            ]);
            
            store.dispatch('SET_ACCOUNTS', accounts.data || []);
            store.dispatch('SET_UNREAD_COUNT', notifications);
            
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }
    
    /**
     * handleRouteChange - Handle route changes
     */
    handleRouteChange() {
        // Update active menu item
        if (this.sidebar) {
            this.sidebar._updateActiveItem();
        }
    }
    
    /**
     * handleAuthEvent - Handle authentication events
     */
    handleAuthEvent(e) {
        const message = e.detail?.message || 'Sesión expirada';
        toast.warning(message);
        
        // Reset store
        store.reset();
        
        // Update UI
        this.setupComponents();
        
        // Navigate to login
        router.navigate(ROUTES.LOGIN);
    }
    
    /**
     * showLoader - Show full page loader
     */
    showLoader() {
        const loader = FullPageLoader({ message: 'Cargando...' });
        document.body.appendChild(loader);
    }
    
    /**
     * hideLoader - Hide full page loader
     */
    hideLoader() {
        const loader = document.querySelector('.full-page-loader');
        if (loader) {
            loader.remove();
        }
    }
    
    /**
     * renderLogin - Render login page
     */
    async renderLogin() {
        // Dynamic import for code splitting
        const { default: LoginPage } = await import('./pages/LoginPage.js');
        const page = new LoginPage();
        this.mainContent.innerHTML = '';
        this.mainContent.appendChild(page.render());
    }
    
    /**
     * renderDashboard - Render dashboard page
     */
    async renderDashboard() {
        const { default: DashboardPage } = await import('./pages/DashboardPage.js');
        const page = new DashboardPage();
        this.mainContent.innerHTML = '';
        this.mainContent.appendChild(page.render());
    }
    
    /**
     * renderAccounts - Render accounts page
     */
    async renderAccounts() {
        const { default: AccountsPage } = await import('./pages/AccountsPage.js');
        const page = new AccountsPage();
        this.mainContent.innerHTML = '';
        this.mainContent.appendChild(page.render());
    }
    
    /**
     * renderAccountDetail - Render account detail page
     */
    async renderAccountDetail(route) {
        const { default: AccountDetailPage } = await import('./pages/AccountDetailPage.js');
        const page = new AccountDetailPage({ accountId: route.params.id });
        this.mainContent.innerHTML = '';
        this.mainContent.appendChild(page.render());
    }
    
    /**
     * renderCards - Render cards page
     */
    async renderCards() {
        const { default: CardsPage } = await import('./pages/CardsPage.js');
        const page = new CardsPage();
        this.mainContent.innerHTML = '';
        this.mainContent.appendChild(page.render());
    }
    
    /**
     * renderTransactions - Render transactions page
     */
    async renderTransactions() {
        const { default: TransactionsPage } = await import('./pages/TransactionsPage.js');
        const page = new TransactionsPage();
        this.mainContent.innerHTML = '';
        this.mainContent.appendChild(page.render());
    }
    
    /**
     * renderTransfer - Render transfer page
     */
    async renderTransfer() {
        const { default: TransferPage } = await import('./pages/TransferPage.js');
        const page = new TransferPage();
        this.mainContent.innerHTML = '';
        this.mainContent.appendChild(page.render());
    }
    
    /**
     * renderBeneficiaries - Render beneficiaries page
     */
    async renderBeneficiaries() {
        const { default: BeneficiariesPage } = await import('./pages/BeneficiariesPage.js');
        const page = new BeneficiariesPage();
        this.mainContent.innerHTML = '';
        this.mainContent.appendChild(page.render());
    }
    
    /**
     * renderNotifications - Render notifications page
     */
    async renderNotifications() {
        const { default: NotificationsPage } = await import('./pages/NotificationsPage.js');
        const page = new NotificationsPage();
        this.mainContent.innerHTML = '';
        this.mainContent.appendChild(page.render());
    }
    
    /**
     * renderProfile - Render profile page
     */
    async renderProfile() {
        const { default: ProfilePage } = await import('./pages/ProfilePage.js');
        const page = new ProfilePage();
        this.mainContent.innerHTML = '';
        this.mainContent.appendChild(page.render());
    }
    
    /**
     * renderSettings - Render settings page
     */
    async renderSettings() {
        const { default: SettingsPage } = await import('./pages/SettingsPage.js');
        const page = new SettingsPage();
        this.mainContent.innerHTML = '';
        this.mainContent.appendChild(page.render());
    }
    
    /**
     * renderNotFound - Render 404 page
     */
    renderNotFound() {
        this.mainContent.innerHTML = `
            <div class="not-found">
                <h1>404</h1>
                <p>Página no encontrada</p>
                <a href="#/dashboard" class="btn btn--primary">Volver al inicio</a>
            </div>
        `;
    }
}

/**
 * Initialize the application when DOM is ready
 * 
 * CONCEPT: DOMContentLoaded
 * - Fires when HTML is parsed (before images/styles load)
 * - Better than window.onload (which waits for everything)
 */
document.addEventListener('DOMContentLoaded', () => {
    const app = new SmartBankApp();
    app.initialize();
});

export default SmartBankApp;