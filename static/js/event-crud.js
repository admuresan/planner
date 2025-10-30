/**
 * Event CRUD operations and form management
 */

class EventCRUD {
    constructor() {
        this.currentNotes = [];
        this.setupEventListeners();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Add event button
        document.getElementById('add-event-btn').addEventListener('click', () => {
            this.openAddModal();
        });

        // Event form submission
        document.getElementById('event-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEvent();
        });

        // Add note buttons
        document.getElementById('add-note-btn').addEventListener('click', () => {
            this.addNoteToForm('note');
        });

        document.getElementById('add-todo-btn').addEventListener('click', () => {
            this.addNoteToForm('todo');
        });
    }

    /**
     * Open the add event modal
     */
    openAddModal() {
        modalManager.resetForm('event-form');
        this.currentNotes = [];
        document.getElementById('notes-list').innerHTML = '';
        document.getElementById('event-modal-title').textContent = 'Add Event';
        
        // Set default times to current time
        const now = new Date();
        document.getElementById('event-start-date').value = formatDateToInput(now);
        document.getElementById('event-start-time').value = formatTimeToInput(now);
        
        const later = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later
        document.getElementById('event-end-date').value = formatDateToInput(later);
        document.getElementById('event-end-time').value = formatTimeToInput(later);
        
        modalManager.openModal('event-modal');
    }

    /**
     * Open the add event modal with pre-filled time
     * @param {Date} startDate - Pre-filled start date/time
     * @param {Date} endDate - Pre-filled end date/time
     */
    openAddModalWithTime(startDate, endDate) {
        modalManager.resetForm('event-form');
        this.currentNotes = [];
        document.getElementById('notes-list').innerHTML = '';
        document.getElementById('event-modal-title').textContent = 'Add Event';
        
        // Set times from parameters
        document.getElementById('event-start-date').value = formatDateToInput(startDate);
        document.getElementById('event-start-time').value = formatTimeToInput(startDate);
        document.getElementById('event-end-date').value = formatDateToInput(endDate);
        document.getElementById('event-end-time').value = formatTimeToInput(endDate);
        
        modalManager.openModal('event-modal');
        
        // Focus on the name field for quick entry
        setTimeout(() => {
            document.getElementById('event-name').focus();
        }, 100);
    }

    /**
     * Open the edit event modal
     * @param {object} event - Event to edit
     */
    openEditModal(event) {
        document.getElementById('event-id').value = event.id;
        document.getElementById('event-name').value = event.name;
        
        const startDate = parseISODate(event.start_time);
        const endDate = parseISODate(event.end_time);
        
        document.getElementById('event-start-date').value = formatDateToInput(startDate);
        document.getElementById('event-start-time').value = formatTimeToInput(startDate);
        document.getElementById('event-end-date').value = formatDateToInput(endDate);
        document.getElementById('event-end-time').value = formatTimeToInput(endDate);
        document.getElementById('event-category').value = event.category_id || '';
        
        this.currentNotes = event.notes || [];
        this.renderNotesInForm();
        
        document.getElementById('event-modal-title').textContent = 'Edit Event';
        modalManager.openModal('event-modal');
        
        // Note: We do NOT close the sidebar anymore - let user keep it open
    }

    /**
     * Add a note to the form
     * @param {string} type - Note type ('note' or 'todo')
     */
    addNoteToForm(type) {
        const note = {
            id: generateId(),
            type: type,
            content: '',
            completed: false
        };
        this.currentNotes.push(note);
        this.renderNotesInForm();
    }

    /**
     * Render notes in the event form
     */
    renderNotesInForm() {
        const container = document.getElementById('notes-list');
        container.innerHTML = '';

        this.currentNotes.forEach((note, index) => {
            const item = document.createElement('div');
            item.className = 'note-item';

            const header = document.createElement('div');
            header.className = 'note-item-header';

            const label = document.createElement('span');
            label.className = 'note-type-label';
            label.textContent = note.type === 'todo' ? 'To-Do Item' : 'Note';

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'btn btn-small btn-danger';
            deleteBtn.textContent = 'Remove';
            deleteBtn.addEventListener('click', () => {
                this.currentNotes.splice(index, 1);
                this.renderNotesInForm();
            });

            header.appendChild(label);
            header.appendChild(deleteBtn);

            const textarea = document.createElement('textarea');
            textarea.className = 'note-item-content';
            textarea.value = note.content;
            textarea.placeholder = note.type === 'todo' ? 'Enter to-do item...' : 'Enter note...';
            textarea.addEventListener('input', (e) => {
                note.content = e.target.value;
            });

            item.appendChild(header);
            item.appendChild(textarea);
            container.appendChild(item);
        });
    }

    /**
     * Save an event (create or update)
     */
    async saveEvent() {
        const id = document.getElementById('event-id').value;
        const name = document.getElementById('event-name').value;
        const startDate = document.getElementById('event-start-date').value;
        const startTime = document.getElementById('event-start-time').value;
        const endDate = document.getElementById('event-end-date').value;
        const endTime = document.getElementById('event-end-time').value;
        const categoryId = document.getElementById('event-category').value || null;

        const startISO = combineDateTimeToISO(startDate, startTime);
        const endISO = combineDateTimeToISO(endDate, endTime);

        // Filter out empty notes
        const notes = this.currentNotes.filter(note => note.content.trim() !== '');

        const eventData = {
            name,
            start_time: startISO,
            end_time: endISO,
            category_id: categoryId,
            notes: notes
        };

        try {
            if (id) {
                // Update existing
                await apiRequest(`/events/${id}`, 'PUT', eventData);
            } else {
                // Create new
                await apiRequest('/events', 'POST', eventData);
            }

            modalManager.closeModal('event-modal');
            await eventManager.reloadEventsForCurrentView();
        } catch (error) {
            console.error('Failed to save event:', error);
            alert('Failed to save event: ' + error.message);
        }
    }

    /**
     * Delete an event
     * @param {string} eventId - Event ID to delete
     */
    async deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event?')) {
            return;
        }

        try {
            await apiRequest(`/events/${eventId}`, 'DELETE');
            await eventManager.reloadEventsForCurrentView();
            
            // Close sidebar if it's showing this event
            const sidebar = document.getElementById('event-sidebar');
            if (sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        } catch (error) {
            console.error('Failed to delete event:', error);
            alert('Failed to delete event: ' + error.message);
        }
    }

    /**
     * Update a note's completion status
     * @param {string} eventId - Event ID
     * @param {string} noteId - Note ID
     * @param {boolean} completed - Completion status
     */
    async updateNoteStatus(eventId, noteId, completed) {
        try {
            await apiRequest(`/events/${eventId}/notes/${noteId}`, 'PATCH', { completed });
            
            // Update local data
            const event = eventManager.events.find(e => e.id === eventId);
            if (event) {
                const note = event.notes.find(n => n.id === noteId);
                if (note) {
                    note.completed = completed;
                }
            }
            
            // Re-render the calendar to update checkbox display on main event
            eventManager.renderAllEvents();
            
            // Re-render if sidebar is open
            const sidebar = document.getElementById('event-sidebar');
            if (sidebar.classList.contains('active') && sidebar.dataset.eventId === eventId) {
                eventDetails.showEventDetails(eventId);
            }
            
            // Refresh left sidebar to update to-dos list
            if (window.leftSidebar) {
                await leftSidebar.refresh();
            }
        } catch (error) {
            console.error('Failed to update note status:', error);
        }
    }
}

// Global instance (created in events.js)

