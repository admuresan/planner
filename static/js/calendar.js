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
        this.restoreScrollPosition();
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
            // Use saved date regardless of whether it's in the past
            // This allows users to view historical events
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
            // Check if this is the start of a new month
            const isMonthStart = index > 0 && this.allDates[index - 1].getMonth() !== date.getMonth();
            
            // Render header
            const header = document.createElement('div');
            header.className = 'day-header';
            header.dataset.date = formatDateToInput(date);
            
            // Add weekend class for Saturday (6) and Sunday (0)
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                header.classList.add('weekend');
            }
            // Add tuesday/thursday classes for specific highlighting
            if (dayOfWeek === 2 || dayOfWeek === 4) {
                header.classList.add('tue-thu');
            }
            
            if (isSameDay(date, today)) {
                header.classList.add('today');
            }
            
            // Add month-start class if this is the first day of a new month
            if (isMonthStart) {
                header.classList.add('month-start');
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
            
            // Add weekend class for Saturday (6) and Sunday (0)
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                column.classList.add('weekend');
            }
            // Add tuesday/thursday classes for specific highlighting
            if (dayOfWeek === 2 || dayOfWeek === 4) {
                column.classList.add('tue-thu');
            }
            
            // Add month-start class if this is the first day of a new month
            if (isMonthStart) {
                column.classList.add('month-start');
            }
            
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
     * Scroll to today's date (centered horizontally, starting at 8 AM vertically)
     */
    scrollToToday() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = formatDateToInput(today);
        
        const todayHeader = this.daysHeader.querySelector(`[data-date="${todayStr}"]`);
        if (todayHeader) {
            this.scrollToDate(todayHeader, true);
            // Scroll to 8 AM (8 hours * 60 pixels per hour = 480px)
            setTimeout(() => {
                this.daysContainer.scrollTop = 480;
                this.timeSlots.scrollTop = 480;
            }, 100);
        }
    }

    /**
     * Restore scroll position from localStorage or scroll to today at 8 AM
     */
    restoreScrollPosition() {
        const savedCenterDate = localStorage.getItem('calendarCenterDate');
        const savedScrollTop = localStorage.getItem('calendarScrollTop');
        
        if (savedCenterDate && savedScrollTop !== null) {
            // Parse the saved center date
            const parts = savedCenterDate.split('-');
            const centerDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            
            // Use setTimeout to ensure DOM is fully rendered
            setTimeout(() => {
                // Find the column for the center date
                const dateHeader = this.daysHeader.querySelector(`[data-date="${savedCenterDate}"]`);
                if (dateHeader) {
                    // Calculate scroll position to center this date
                    const containerWidth = this.daysContainer.clientWidth;
                    const headerLeft = dateHeader.offsetLeft;
                    const headerWidth = dateHeader.offsetWidth;
                    const scrollLeft = headerLeft - (containerWidth / 2) + (headerWidth / 2);
                    
                    // Restore both horizontal and vertical scroll
                    this.daysContainer.scrollLeft = Math.max(0, scrollLeft);
                    this.daysContainer.scrollTop = parseFloat(savedScrollTop);
                    this.timeSlots.scrollTop = parseFloat(savedScrollTop);
                    
                    console.log('Restored to center date:', savedCenterDate, { 
                        scrollLeft: scrollLeft, 
                        scrollTop: savedScrollTop 
                    });
                } else {
                    // Date not found, fall back to pixel position with default 8 AM start
                    const savedScrollLeft = localStorage.getItem('calendarScrollLeft');
                    if (savedScrollLeft !== null) {
                        this.daysContainer.scrollLeft = parseFloat(savedScrollLeft);
                        this.daysContainer.scrollTop = parseFloat(savedScrollTop);
                        this.timeSlots.scrollTop = parseFloat(savedScrollTop);
                    } else {
                        // Default to 8 AM if no saved position
                        this.scrollToToday();
                    }
                }
            }, 0);
        } else {
            // No saved position, scroll to today at 8 AM
            this.scrollToToday();
        }
    }

    /**
     * Save current scroll position to localStorage
     */
    saveScrollPosition() {
        // Save pixel positions as fallback
        localStorage.setItem('calendarScrollLeft', this.daysContainer.scrollLeft.toString());
        localStorage.setItem('calendarScrollTop', this.daysContainer.scrollTop.toString());
        
        // Save the center date for more accurate restoration
        const visibleColumns = this.getVisibleDateColumns();
        if (visibleColumns.length > 0) {
            const centerColumn = visibleColumns[Math.floor(visibleColumns.length / 2)];
            const centerDateStr = centerColumn.dataset.date;
            if (centerDateStr) {
                localStorage.setItem('calendarCenterDate', centerDateStr);
                console.log('Saved center date:', centerDateStr);
            }
        }
    }

    /**
     * Set up scroll detection for infinite scrolling
     */
    setupScrollDetection() {
        // Sync vertical scroll between days container and time slots
        this.daysContainer.addEventListener('scroll', () => {
            this.timeSlots.scrollTop = this.daysContainer.scrollTop;
        });
        
        // Handle horizontal scroll and date loading (debounced)
        this.daysContainer.addEventListener('scroll', debounce(() => {
            this.handleScroll();
            this.saveCurrentVisibleDate();
            this.saveScrollPosition();
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
        
        dates.forEach((date, index) => {
            // Check if this is the start of a new month
            let isMonthStart = false;
            if (method === 'append') {
                // For append, check against the last date in allDates before these new ones
                if (index === 0 && this.allDates.length > dates.length) {
                    const lastExistingDate = this.allDates[this.allDates.length - dates.length - 1];
                    isMonthStart = lastExistingDate.getMonth() !== date.getMonth();
                } else if (index > 0) {
                    isMonthStart = dates[index - 1].getMonth() !== date.getMonth();
                }
            } else {
                // For prepend, check against the first date in allDates after these new ones
                if (index === dates.length - 1 && this.allDates.length > dates.length) {
                    const firstExistingDate = this.allDates[dates.length];
                    isMonthStart = date.getMonth() !== firstExistingDate.getMonth();
                } else if (index < dates.length - 1) {
                    isMonthStart = date.getMonth() !== dates[index + 1].getMonth();
                }
            }
            
            // Create header
            const header = document.createElement('div');
            header.className = 'day-header';
            header.dataset.date = formatDateToInput(date);
            
            // Add weekend class for Saturday (6) and Sunday (0)
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                header.classList.add('weekend');
            }
            // Add tuesday/thursday classes for specific highlighting
            if (dayOfWeek === 2 || dayOfWeek === 4) {
                header.classList.add('tue-thu');
            }
            
            if (isSameDay(date, today)) {
                header.classList.add('today');
            }
            
            // Add month-start class if this is the first day of a new month
            if (isMonthStart) {
                header.classList.add('month-start');
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
            
            // Add weekend class for Saturday (6) and Sunday (0)
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                column.classList.add('weekend');
            }
            // Add tuesday/thursday classes for specific highlighting
            if (dayOfWeek === 2 || dayOfWeek === 4) {
                column.classList.add('tue-thu');
            }
            
            // Add month-start class if this is the first day of a new month
            if (isMonthStart) {
                column.classList.add('month-start');
            }
            
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
            // Scroll to 8 AM by default (8 hours * 60 pixels per hour = 480px)
            setTimeout(() => {
                this.daysContainer.scrollTop = 480;
                this.timeSlots.scrollTop = 480;
                this.saveScrollPosition();
            }, 100);
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
        // Save scroll position after programmatic scrolling
        setTimeout(() => {
            this.saveScrollPosition();
        }, 100);
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

    /**
     * Scroll to center an event both horizontally (date) and vertically (time)
     * @param {Object|string} eventOrId - Event object or event ID
     */
    async scrollToEvent(eventOrId) {
        // Get the event object if only ID provided
        let event;
        if (typeof eventOrId === 'string') {
            // Find event in event manager
            if (window.eventManager && window.eventManager.events) {
                event = window.eventManager.events.find(e => e.id === eventOrId);
            }
        } else {
            event = eventOrId;
        }

        if (!event) {
            console.warn('Event not found for scrolling');
            return;
        }

        const startDate = parseISODate(event.start_time);
        const endDate = parseISODate(event.end_time);
        
        // Calculate the start and end positions of the event
        const startYPos = this.calculateYPosition(startDate);
        const endYPos = this.calculateYPosition(endDate);

        // First, ensure the date is loaded and in view
        const dateStr = formatDateToInput(startDate);
        let dateColumn = this.getColumnForDate(startDate);

        // If the date isn't loaded yet, jump to it first
        if (!dateColumn) {
            await this.jumpToDate(startDate, true);
            dateColumn = this.getColumnForDate(startDate);
        }

        if (!dateColumn) {
            console.warn('Could not find column for date:', dateStr);
            return;
        }

        // Check if event is already visible in viewport
        const containerRect = this.daysContainer.getBoundingClientRect();
        const columnRect = dateColumn.getBoundingClientRect();
        
        // Get current scroll positions
        const currentScrollLeft = this.daysContainer.scrollLeft;
        const currentScrollTop = this.daysContainer.scrollTop;
        
        // Calculate event's position relative to viewport
        const eventLeftInViewport = columnRect.left - containerRect.left;
        const eventRightInViewport = columnRect.right - containerRect.left;
        const eventTopInViewport = startYPos - currentScrollTop;
        const eventBottomInViewport = endYPos - currentScrollTop;
        
        // Check if event is fully visible (with some margin for comfort)
        const margin = 50; // 50px margin on all sides
        const isHorizontallyVisible = eventLeftInViewport >= margin && 
                                       eventRightInViewport <= (containerRect.width - margin);
        const isVerticallyVisible = eventTopInViewport >= margin && 
                                     eventBottomInViewport <= (containerRect.height - margin);
        
        // If event is already fully visible, don't scroll
        if (isHorizontallyVisible && isVerticallyVisible) {
            console.log('Event already visible, not scrolling');
            return;
        }

        // Event is not fully visible, scroll to center it
        const middleTime = new Date((startDate.getTime() + endDate.getTime()) / 2);
        const middleYPos = this.calculateYPosition(middleTime);
        
        // Calculate horizontal position (date-based)
        const containerWidth = this.daysContainer.clientWidth;
        const columnLeft = dateColumn.offsetLeft;
        const columnWidth = dateColumn.offsetWidth;
        
        // Center the date horizontally
        const scrollLeft = columnLeft - (containerWidth / 2) + (columnWidth / 2);
        
        // Center the event time vertically
        const containerHeight = this.daysContainer.clientHeight;
        const scrollTop = middleYPos - (containerHeight / 2);

        // Smooth scroll to the position
        this.daysContainer.scrollTo({
            left: Math.max(0, scrollLeft),
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
        });

        // The scroll event listener will automatically sync time slots,
        // but we also set it directly for immediate feedback
        this.timeSlots.scrollTop = Math.max(0, scrollTop);

        // Save the new position after scrolling completes
        setTimeout(() => {
            this.saveScrollPosition();
        }, 500); // Wait for smooth scroll animation
    }
}

// Global calendar instance (declared in main.js)
