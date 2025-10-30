/**
 * Calendar rendering and date management with infinite scrolling
 */

class Calendar {
    constructor() {
        this.currentStartDate = null;
        this.visibleDays = 7;
        this.preloadWeeks = 2;
        this.allDates = [];
        this.isLoadingMore = false;
        this.loadedDateRange = { start: null, end: null };
        
        this.timeSlots = document.getElementById('time-slots');
        this.daysHeader = document.getElementById('days-header');
        this.daysGrid = document.getElementById('days-grid');
        this.daysContainer = document.getElementById('days-container');
        
        this.initialize();
    }

    /**
     * Initialize the calendar
     */
    initialize() {
        this.renderTimeSlots();
        this.determineStartDate();
        this.generateDates();
        this.renderDays();
        this.scrollToToday();
        this.setupScrollDetection();
    }

    /**
     * Render the time slots on the left side
     */
    renderTimeSlots() {
        this.timeSlots.innerHTML = '';
        
        for (let hour = 0; hour < 24; hour++) {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            
            const displayHour = hour === 0 ? '12 AM' :
                               hour === 12 ? '12 PM' :
                               hour < 12 ? `${hour} AM` :
                               `${hour - 12} PM`;
            
            slot.textContent = displayHour;
            this.timeSlots.appendChild(slot);
        }
    }

    /**
     * Determine the start date for the calendar
     */
    determineStartDate() {
        // Check if there's a saved position in localStorage
        const savedDate = localStorage.getItem('calendarStartDate');
        
        if (savedDate) {
            const date = new Date(savedDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // If saved date is in the past (before today), use today instead
            if (date < today) {
                console.log('Saved date is in the past, using today instead');
                const offsetDays = Math.floor(this.visibleDays / 2);
                this.currentStartDate = new Date(today);
                this.currentStartDate.setDate(this.currentStartDate.getDate() - offsetDays);
                // Save the new position
                localStorage.setItem('calendarStartDate', this.currentStartDate.toISOString());
                return;
            }
            
            // Use saved date if it's today or in the future
            this.currentStartDate = date;
            console.log('Loaded saved calendar position:', date);
            return;
        }
        
        // Default to today, but offset to center it in the view
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const offsetDays = Math.floor(this.visibleDays / 2);
        this.currentStartDate = new Date(today);
        this.currentStartDate.setDate(this.currentStartDate.getDate() - offsetDays);
    }

    /**
     * Generate array of dates to display (includes preload buffer)
     */
    generateDates() {
        this.allDates = [];
        
        // Calculate total days to generate
        const preloadDays = this.preloadWeeks * 7;
        const totalDays = preloadDays + this.visibleDays + preloadDays;
        
        // Start from preloadDays before currentStartDate
        const firstDate = new Date(this.currentStartDate);
        firstDate.setDate(firstDate.getDate() - preloadDays);
        
        // Generate all dates
        for (let i = 0; i < totalDays; i++) {
            const date = new Date(firstDate);
            date.setDate(date.getDate() + i);
            this.allDates.push(date);
        }
        
        // Update loaded date range
        this.loadedDateRange.start = new Date(this.allDates[0]);
        this.loadedDateRange.end = new Date(this.allDates[this.allDates.length - 1]);
    }

    /**
     * Render day headers and columns
     */
    renderDays() {
        this.daysHeader.innerHTML = '';
        this.daysGrid.innerHTML = '';
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        this.allDates.forEach((date, index) => {
            // Render header
            const header = document.createElement('div');
            header.className = 'day-header';
            header.dataset.date = formatDateToInput(date);
            
            if (isSameDay(date, today)) {
                header.classList.add('today');
            }
            
            const dayName = document.createElement('div');
            dayName.className = 'day-name';
            dayName.textContent = getDayName(date);
            
            const dayDate = document.createElement('div');
            dayDate.className = 'day-date';
            dayDate.textContent = getFormattedDate(date);
            
            header.appendChild(dayName);
            header.appendChild(dayDate);
            this.daysHeader.appendChild(header);
            
            // Render column
            const column = document.createElement('div');
            column.className = 'day-column';
            column.dataset.date = formatDateToInput(date);
            
            const inner = document.createElement('div');
            inner.className = 'day-column-inner';
            
            // Add hour lines
            for (let hour = 0; hour < 24; hour++) {
                const line = document.createElement('div');
                line.className = 'hour-line';
                line.style.top = `${hour * 60}px`;
                inner.appendChild(line);
            }
            
            column.appendChild(inner);
            this.daysGrid.appendChild(column);
        });
    }

    /**
     * Scroll to today's date (centered)
     */
    scrollToToday() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = formatDateToInput(today);
        
        const todayHeader = this.daysHeader.querySelector(`[data-date="${todayStr}"]`);
        if (todayHeader) {
            this.scrollToDate(todayHeader, true);
        }
    }

    /**
     * Set up scroll detection for infinite scrolling
     */
    setupScrollDetection() {
        this.daysContainer.addEventListener('scroll', debounce(() => {
            this.handleScroll();
            this.saveCurrentVisibleDate();
        }, 150));
    }

    /**
     * Handle scroll events to load more dates/events as needed
     */
    async handleScroll() {
        if (this.isLoadingMore) return;
        
        const container = this.daysContainer;
        const scrollLeft = container.scrollLeft;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        
        // Calculate scroll position
        const scrolledRight = scrollLeft + clientWidth;
        const distanceFromEnd = scrollWidth - scrolledRight;
        const distanceFromStart = scrollLeft;
        
        // Threshold: trigger when within 2 days worth of scrolling
        const dayWidth = 150; // Approximate day column width
        const scrollThreshold = dayWidth * 7; // 7 days worth
        
        // Check if we need to load more dates on the right
        if (distanceFromEnd < scrollThreshold) {
            await this.loadMoreDates('forward');
        }
        
        // Check if we need to load more dates on the left
        if (distanceFromStart < scrollThreshold) {
            await this.loadMoreDates('backward');
        }
    }

    /**
     * Load more dates in the specified direction
     * @param {string} direction - 'forward' or 'backward'
     */
    async loadMoreDates(direction) {
        if (this.isLoadingMore) return;
        
        this.isLoadingMore = true;
        
        try {
            const daysToAdd = 14; // Add 2 weeks at a time
            const currentScrollLeft = this.daysContainer.scrollLeft;
            const firstColumn = this.daysGrid.querySelector('.day-column');
            const columnWidth = firstColumn ? firstColumn.offsetWidth : 150;
            
            if (direction === 'forward') {
                // Add dates to the end
                const lastDate = this.allDates[this.allDates.length - 1];
                const newDates = [];
                
                for (let i = 1; i <= daysToAdd; i++) {
                    const newDate = new Date(lastDate);
                    newDate.setDate(newDate.getDate() + i);
                    newDates.push(newDate);
                    this.allDates.push(newDate);
                }
                
                // Render new dates
                this.renderNewDays(newDates, 'append');
                
                // Update loaded range
                this.loadedDateRange.end = new Date(this.allDates[this.allDates.length - 1]);
                
                // Load events for new dates
                if (window.eventManager) {
                    const centerDate = new Date(newDates[Math.floor(newDates.length / 2)]);
                    await window.eventManager.loadEventsForDateRange(centerDate, 1, 1);
                    window.eventManager.renderAllEvents();
                }
                
            } else {
                // Add dates to the beginning
                const firstDate = this.allDates[0];
                const newDates = [];
                
                for (let i = daysToAdd; i >= 1; i--) {
                    const newDate = new Date(firstDate);
                    newDate.setDate(newDate.getDate() - i);
                    newDates.push(newDate);
                }
                
                // Add to beginning of array
                this.allDates.unshift(...newDates);
                
                // Render new dates at the beginning
                this.renderNewDays(newDates, 'prepend');
                
                // Update loaded range
                this.loadedDateRange.start = new Date(this.allDates[0]);
                
                // Load events for new dates
                if (window.eventManager) {
                    const centerDate = new Date(newDates[Math.floor(newDates.length / 2)]);
                    await window.eventManager.loadEventsForDateRange(centerDate, 1, 1);
                    window.eventManager.renderAllEvents();
                }
                
                // Adjust scroll position to maintain view (prevent jumping)
                const scrollAdjustment = columnWidth * daysToAdd;
                this.daysContainer.scrollLeft = currentScrollLeft + scrollAdjustment;
            }
            
        } catch (error) {
            console.error('Error loading more dates:', error);
        } finally {
            this.isLoadingMore = false;
        }
    }

    /**
     * Render new days (append or prepend)
     * @param {Array} dates - Array of Date objects
     * @param {string} method - 'append' or 'prepend'
     */
    renderNewDays(dates, method) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const headerFragment = document.createDocumentFragment();
        const gridFragment = document.createDocumentFragment();
        
        dates.forEach(date => {
            // Create header
            const header = document.createElement('div');
            header.className = 'day-header';
            header.dataset.date = formatDateToInput(date);
            
            if (isSameDay(date, today)) {
                header.classList.add('today');
            }
            
            const dayName = document.createElement('div');
            dayName.className = 'day-name';
            dayName.textContent = getDayName(date);
            
            const dayDate = document.createElement('div');
            dayDate.className = 'day-date';
            dayDate.textContent = getFormattedDate(date);
            
            header.appendChild(dayName);
            header.appendChild(dayDate);
            headerFragment.appendChild(header);
            
            // Create column
            const column = document.createElement('div');
            column.className = 'day-column';
            column.dataset.date = formatDateToInput(date);
            
            const inner = document.createElement('div');
            inner.className = 'day-column-inner';
            
            // Add hour lines
            for (let hour = 0; hour < 24; hour++) {
                const line = document.createElement('div');
                line.className = 'hour-line';
                line.style.top = `${hour * 60}px`;
                inner.appendChild(line);
            }
            
            column.appendChild(inner);
            gridFragment.appendChild(column);
        });
        
        // Append or prepend
        if (method === 'append') {
            this.daysHeader.appendChild(headerFragment);
            this.daysGrid.appendChild(gridFragment);
        } else {
            this.daysHeader.insertBefore(headerFragment, this.daysHeader.firstChild);
            this.daysGrid.insertBefore(gridFragment, this.daysGrid.firstChild);
        }
    }

    /**
     * Jump to a specific date
     * @param {Date} date - Date to jump to
     * @param {boolean} center - Whether to center the date (default true)
     */
    async jumpToDate(date, center = true) {
        date.setHours(0, 0, 0, 0);
        
        if (center) {
            // Position target date in the middle of visible days
            const offsetDays = Math.floor(this.visibleDays / 2);
            this.currentStartDate = new Date(date);
            this.currentStartDate.setDate(this.currentStartDate.getDate() - offsetDays);
        } else {
            this.currentStartDate = date;
        }
        
        // Save to localStorage
        localStorage.setItem('calendarStartDate', this.currentStartDate.toISOString());
        
        // Regenerate and render
        this.generateDates();
        this.renderDays();
        
        // Reload events for new date range
        if (window.eventManager) {
            await window.eventManager.reloadEventsForCurrentView();
        }
        
        // Scroll to the selected date
        const dateStr = formatDateToInput(date);
        const dateHeader = this.daysHeader.querySelector(`[data-date="${dateStr}"]`);
        if (dateHeader) {
            this.scrollToDate(dateHeader, center);
        }
    }
    
    /**
     * Scroll to a specific date header
     * @param {Element} headerElement - The date header element
     * @param {boolean} center - Whether to center the date (default true)
     */
    scrollToDate(headerElement, center = true) {
        const containerWidth = this.daysContainer.clientWidth;
        const headerLeft = headerElement.offsetLeft;
        const headerWidth = headerElement.offsetWidth;
        
        let scrollLeft;
        if (center) {
            // Center the date in the viewport
            scrollLeft = headerLeft - (containerWidth / 2) + (headerWidth / 2);
        } else {
            // Position at the left edge with small padding
            scrollLeft = headerLeft - 10;
        }
        
        this.daysContainer.scrollLeft = Math.max(0, scrollLeft);
    }

    /**
     * Get all visible date columns
     * @returns {Array} Array of column elements
     */
    getVisibleColumns() {
        return Array.from(this.daysGrid.querySelectorAll('.day-column'));
    }

    /**
     * Get column for a specific date
     * @param {Date} date - Date to find
     * @returns {Element} Column element or null
     */
    getColumnForDate(date) {
        const dateStr = formatDateToInput(date);
        return this.daysGrid.querySelector(`[data-date="${dateStr}"]`);
    }

    /**
     * Get visible date columns (those in viewport)
     * @returns {Array} Array of visible column elements
     */
    getVisibleDateColumns() {
        const container = this.daysContainer;
        const columns = Array.from(this.daysGrid.querySelectorAll('.day-column'));
        
        return columns.filter(col => {
            const rect = col.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            return rect.right > containerRect.left && rect.left < containerRect.right;
        });
    }

    /**
     * Save the current visible date to localStorage
     */
    saveCurrentVisibleDate() {
        try {
            const visibleColumns = this.getVisibleDateColumns();
            if (visibleColumns.length > 0) {
                // Get the center-most visible column
                const centerColumn = visibleColumns[Math.floor(visibleColumns.length / 2)];
                const dateStr = centerColumn.dataset.date;
                
                if (dateStr) {
                    // Parse the date string in local time
                    const parts = dateStr.split('-');
                    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    
                    // Offset to get the start date (accounting for visible days)
                    const offsetDays = Math.floor(this.visibleDays / 2);
                    const startDate = new Date(date);
                    startDate.setDate(startDate.getDate() - offsetDays);
                    
                    this.currentStartDate = startDate;
                    localStorage.setItem('calendarStartDate', startDate.toISOString());
                }
            }
        } catch (error) {
            console.error('Error saving current visible date:', error);
        }
    }

    /**
     * Calculate position for a time on a given day
     * @param {Date} datetime - Date and time
     * @returns {number} Y position in pixels
     */
    calculateYPosition(datetime) {
        const hours = datetime.getHours();
        const minutes = datetime.getMinutes();
        const totalMinutes = hours * 60 + minutes;
        
        // 60px per hour
        return totalMinutes;
    }

    /**
     * Calculate datetime from Y position
     * @param {string} dateStr - Date string (YYYY-MM-DD)
     * @param {number} yPos - Y position in pixels
     * @returns {Date} Calculated datetime
     */
    calculateDateTimeFromPosition(dateStr, yPos) {
        const totalMinutes = Math.round(yPos);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        // Parse date in LOCAL time, not UTC
        const parts = dateStr.split('-');
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        date.setHours(hours, minutes, 0, 0);
        
        return date;
    }

    /**
     * Get the date string for a column element
     * @param {Element} column - Column element
     * @returns {string} Date string
     */
    getDateFromColumn(column) {
        return column.dataset.date;
    }

    /**
     * Get the currently loaded date range
     * @returns {Object} Object with start and end dates
     */
    getLoadedDateRange() {
        return {
            start: new Date(this.loadedDateRange.start),
            end: new Date(this.loadedDateRange.end)
        };
    }
}

// Global calendar instance (declared in main.js)
