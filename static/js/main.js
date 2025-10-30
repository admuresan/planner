/**
 * Main application initialization and coordination
 */

// Global manager instances
let calendar;
let categoryManager;
let eventManager;
let dragManager;
let quickAdd;
let leftSidebar;

// Event manager sub-components (created by EventManager)
let eventCRUD;
let eventRenderer;
let eventDetails;

/**
 * Initialize the application
 */
async function initializeApp() {
    try {
        console.log('Initializing application...');
        
        // Initialize managers and make them explicitly global
        window.calendar = calendar = new Calendar();
        console.log('Calendar initialized', window.calendar);
        
        window.categoryManager = categoryManager = new CategoryManager();
        console.log('CategoryManager initialized');
        
        window.eventManager = eventManager = new EventManager();
        console.log('EventManager initialized');
        
        window.dragManager = dragManager = new DragManager();
        console.log('DragManager initialized');
        
        // Load data
        await categoryManager.loadCategories();
        await eventManager.reloadEventsForCurrentView();
        
        // Set up additional event listeners
        setupAdditionalListeners();
        
        // Initialize QuickAdd AFTER calendar is ready and rendered
        console.log('Initializing QuickAdd...');
        window.quickAdd = quickAdd = new QuickAdd();
        console.log('QuickAdd initialized');
        
        console.log('Initializing LeftSidebar...');
        window.leftSidebar = leftSidebar = new LeftSidebar();
        await leftSidebar.initialize();
        console.log('LeftSidebar initialized');
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        alert('Failed to initialize application. Please refresh the page.');
    }
}

/**
 * Set up additional event listeners
 */
function setupAdditionalListeners() {
    // Jump to date
    const jumpBtn = document.getElementById('jump-btn');
    const jumpDate = document.getElementById('jump-date');
    
    jumpBtn.addEventListener('click', () => {
        const dateValue = jumpDate.value;
        if (dateValue) {
            const date = new Date(dateValue);
            calendar.jumpToDate(date);
        }
    });
    
    // Also allow Enter key in date input
    jumpDate.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            jumpBtn.click();
        }
    });
    
    // Close sidebar button - ONLY way to close sidebar
    document.getElementById('close-sidebar').addEventListener('click', () => {
        document.getElementById('event-sidebar').classList.remove('active');
    });
    
    // Handle scroll events for preloading
    const daysContainer = document.getElementById('days-container');
    daysContainer.addEventListener('scroll', debounce(() => {
        handleScroll();
    }, 200));
}

/**
 * Handle scroll events (now handled by calendar.js)
 */
function handleScroll() {
    // Scroll handling now managed by Calendar class
    // This function kept for backward compatibility
}

/**
 * Save application state to localStorage
 */
function saveState() {
    // Current calendar position is already saved by calendar.jumpToDate()
    // We could save other preferences here if needed
    console.log('State saved');
}

/**
 * Load application state from localStorage
 */
function loadState() {
    // State is loaded automatically by the Calendar constructor
    console.log('State loaded');
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Save state before page unload
window.addEventListener('beforeunload', saveState);

