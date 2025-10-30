/**
 * Event details sidebar display
 */

class EventDetails {
    /**
     * Show event details in the sidebar
     * @param {string} eventId - Event ID
     */
    showEventDetails(eventId) {
        const event = eventManager.events.find(e => e.id === eventId);
        if (!event) return;
        
        const sidebar = document.getElementById('event-sidebar');
        const content = document.getElementById('sidebar-content');
        
        sidebar.dataset.eventId = eventId;
        
        content.innerHTML = '';
        
        // Event name section - inline editable
        const nameSection = this.createEditableNameField(event);
        content.appendChild(nameSection);
        
        // Start time section - inline editable
        const startDate = parseISODate(event.start_time);
        const startTimeSection = this.createEditableDateTimeField('Start Time', startDate, event.id, true);
        content.appendChild(startTimeSection);
        
        // End time section - inline editable
        const endDate = parseISODate(event.end_time);
        const endTimeSection = this.createEditableDateTimeField('End Time', endDate, event.id, false);
        content.appendChild(endTimeSection);
        
        // Duration (read-only)
        const duration = calculateDuration(startDate, endDate);
        const durationSection = this.createSidebarField('Duration', formatDuration(duration));
        content.appendChild(durationSection);
        
        // Category section - dropdown
        const categorySection = this.createEditableCategoryField(event);
        content.appendChild(categorySection);
        
        // Level section - editable number
        const levelSection = this.createEditableLevelField(event);
        content.appendChild(levelSection);
        
        // Notes section - always show
        const regularNotes = (event.notes && event.notes.filter(n => n.type === 'note')) || [];
        const notesSection = document.createElement('div');
        notesSection.className = 'sidebar-section';
        notesSection.id = 'sidebar-notes-section';
        
        const notesTitle = document.createElement('div');
        notesTitle.className = 'sidebar-section-title';
        notesTitle.textContent = 'Notes';
        notesSection.appendChild(notesTitle);
        
        const notesContainer = document.createElement('div');
        notesContainer.id = 'sidebar-notes-container';
        
        regularNotes.forEach(note => {
            const noteEl = this.createSidebarNote(note, event.id, false);
            notesContainer.appendChild(noteEl);
        });
        
        notesSection.appendChild(notesContainer);
        
        // Add Note button and form area
        const addNoteBtn = document.createElement('button');
        addNoteBtn.className = 'btn btn-small';
        addNoteBtn.textContent = '+ Add Note';
        addNoteBtn.style.marginTop = '10px';
        addNoteBtn.addEventListener('click', () => {
            this.showAddNoteForm(event.id, 'note');
        });
        notesSection.appendChild(addNoteBtn);
        
        const noteFormArea = document.createElement('div');
        noteFormArea.id = 'sidebar-note-form-area';
        noteFormArea.style.display = 'none';
        notesSection.appendChild(noteFormArea);
        
        content.appendChild(notesSection);
        
        // To-Do Items section - always show
        const todoNotes = (event.notes && event.notes.filter(n => n.type === 'todo')) || [];
        const todosSection = document.createElement('div');
        todosSection.className = 'sidebar-section';
        todosSection.id = 'sidebar-todos-section';
        
        const todosTitle = document.createElement('div');
        todosTitle.className = 'sidebar-section-title';
        todosTitle.textContent = 'To-Do Items';
        todosSection.appendChild(todosTitle);
        
        const todosContainer = document.createElement('div');
        todosContainer.id = 'sidebar-todos-container';
        
        todoNotes.forEach(note => {
            const noteEl = this.createSidebarNote(note, event.id, true);
            todosContainer.appendChild(noteEl);
        });
        
        todosSection.appendChild(todosContainer);
        
        // Add To-Do button and form area
        const addTodoBtn = document.createElement('button');
        addTodoBtn.className = 'btn btn-small';
        addTodoBtn.textContent = '+ Add To-Do Item';
        addTodoBtn.style.marginTop = '10px';
        addTodoBtn.addEventListener('click', () => {
            this.showAddNoteForm(event.id, 'todo');
        });
        todosSection.appendChild(addTodoBtn);
        
        const todoFormArea = document.createElement('div');
        todoFormArea.id = 'sidebar-todo-form-area';
        todoFormArea.style.display = 'none';
        todosSection.appendChild(todoFormArea);
        
        content.appendChild(todosSection);
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.textContent = 'Delete Event';
        deleteBtn.style.marginTop = '20px';
        deleteBtn.addEventListener('click', () => {
            eventCRUD.deleteEvent(eventId);
        });
        content.appendChild(deleteBtn);
        
        sidebar.classList.add('active');
    }

    /**
     * Create a sidebar field element
     * @param {string} label - Field label
     * @param {string} value - Field value
     * @param {Function} onEdit - Edit callback
     * @returns {Element} Field element
     */
    createSidebarField(label, value, onEdit = null) {
        const section = document.createElement('div');
        section.className = 'sidebar-section';
        
        const field = document.createElement('div');
        field.className = 'sidebar-field';
        
        const labelDiv = document.createElement('div');
        labelDiv.className = 'sidebar-field-label';
        labelDiv.textContent = label;
        
        const valueDiv = document.createElement('div');
        valueDiv.className = 'sidebar-field-value';
        
        const valueText = document.createElement('span');
        valueText.textContent = value;
        valueDiv.appendChild(valueText);
        
        if (onEdit) {
            const editBtn = document.createElement('span');
            editBtn.className = 'sidebar-field-edit';
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', onEdit);
            valueDiv.appendChild(editBtn);
        }
        
        field.appendChild(labelDiv);
        field.appendChild(valueDiv);
        section.appendChild(field);
        
        return section;
    }

    /**
     * Create an editable name field
     * @param {object} event - Event object
     * @returns {Element} Field element
     */
    createEditableNameField(event) {
        const section = document.createElement('div');
        section.className = 'sidebar-section';
        
        const field = document.createElement('div');
        field.className = 'sidebar-field';
        
        const labelDiv = document.createElement('div');
        labelDiv.className = 'sidebar-field-label';
        labelDiv.textContent = 'Event Name';
        
        const valueDiv = document.createElement('div');
        valueDiv.className = 'sidebar-field-value';
        
        // Display mode
        const displaySpan = document.createElement('span');
        displaySpan.textContent = event.name;
        displaySpan.className = 'sidebar-name-display';
        
        const editBtn = document.createElement('span');
        editBtn.className = 'sidebar-field-edit';
        editBtn.textContent = 'Edit';
        
        // Edit mode
        const editContainer = document.createElement('div');
        editContainer.className = 'sidebar-edit-container';
        editContainer.style.display = 'none';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'sidebar-edit-input';
        input.value = event.name;
        
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-primary btn-small';
        saveBtn.textContent = 'Save';
        saveBtn.style.marginTop = '8px';
        
        editContainer.appendChild(input);
        editContainer.appendChild(saveBtn);
        
        valueDiv.appendChild(displaySpan);
        valueDiv.appendChild(editBtn);
        valueDiv.appendChild(editContainer);
        
        // Toggle edit mode
        editBtn.addEventListener('click', () => {
            displaySpan.style.display = 'none';
            editBtn.style.display = 'none';
            editContainer.style.display = 'block';
            input.focus();
        });
        
        // Save changes
        saveBtn.addEventListener('click', async () => {
            const newName = input.value.trim();
            if (newName && newName !== event.name) {
                await this.updateEventField(event.id, 'name', newName);
            }
        });
        
        field.appendChild(labelDiv);
        field.appendChild(valueDiv);
        section.appendChild(field);
        
        return section;
    }

    /**
     * Create an editable category dropdown field
     * @param {object} event - Event object
     * @returns {Element} Field element
     */
    createEditableCategoryField(event) {
        const section = document.createElement('div');
        section.className = 'sidebar-section';
        
        const field = document.createElement('div');
        field.className = 'sidebar-field';
        
        const labelDiv = document.createElement('div');
        labelDiv.className = 'sidebar-field-label';
        labelDiv.textContent = 'Category';
        
        const valueDiv = document.createElement('div');
        valueDiv.className = 'sidebar-field-value';
        
        const select = document.createElement('select');
        select.className = 'sidebar-category-select';
        
        // Add "No Category" option
        const noCatOption = document.createElement('option');
        noCatOption.value = '';
        noCatOption.textContent = 'No Category';
        select.appendChild(noCatOption);
        
        // Add all categories
        categoryManager.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });
        
        // Set current value
        select.value = event.category_id || '';
        
        // Save on change
        select.addEventListener('change', async () => {
            await this.updateEventField(event.id, 'category_id', select.value || null);
        });
        
        valueDiv.appendChild(select);
        field.appendChild(labelDiv);
        field.appendChild(valueDiv);
        section.appendChild(field);
        
        return section;
    }

    /**
     * Create an editable level field
     * @param {object} event - Event object
     * @returns {Element} Field element
     */
    createEditableLevelField(event) {
        const section = document.createElement('div');
        section.className = 'sidebar-section';
        
        const field = document.createElement('div');
        field.className = 'sidebar-field';
        
        const labelDiv = document.createElement('div');
        labelDiv.className = 'sidebar-field-label';
        labelDiv.textContent = 'Level (Layer)';
        
        const valueDiv = document.createElement('div');
        valueDiv.className = 'sidebar-field-value';
        
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '1';
        input.step = '1';
        input.className = 'sidebar-level-input';
        input.value = event.level || 1;
        
        const errorMsg = document.createElement('div');
        errorMsg.className = 'sidebar-field-error';
        errorMsg.style.display = 'none';
        errorMsg.textContent = 'Please enter a valid number (minimum 1)';
        
        valueDiv.appendChild(input);
        valueDiv.appendChild(errorMsg);
        
        // Validate and save on change
        input.addEventListener('change', async () => {
            const value = parseInt(input.value);
            
            if (isNaN(value) || value < 1) {
                errorMsg.style.display = 'block';
                input.value = event.level || 1;
                setTimeout(() => {
                    errorMsg.style.display = 'none';
                }, 3000);
                return;
            }
            
            errorMsg.style.display = 'none';
            
            // Update in memory first
            event.level = value;
            
            // Then save to backend and force re-render
            try {
                const eventData = eventManager.getEventById(event.id);
                if (eventData) {
                    eventData.level = value;
                    console.log('Updating event level to:', value, 'for event:', event.id);
                    
                    await apiRequest(`/events/${event.id}`, 'PUT', eventData);
                    
                    // Force a complete reload and re-render
                    await eventManager.reloadEventsForCurrentView();
                    
                    console.log('Events reloaded after level change');
                }
            } catch (error) {
                console.error('Failed to update level:', error);
                alert('Failed to update level: ' + error.message);
                input.value = event.level || 1;
            }
        });
        
        field.appendChild(labelDiv);
        field.appendChild(valueDiv);
        section.appendChild(field);
        
        return section;
    }

    /**
     * Create an editable date/time field
     * @param {string} label - Field label
     * @param {Date} dateTime - Date/time value
     * @param {string} eventId - Event ID
     * @param {boolean} isStart - Whether this is start time (vs end time)
     * @returns {Element} Field element
     */
    createEditableDateTimeField(label, dateTime, eventId, isStart) {
        const section = document.createElement('div');
        section.className = 'sidebar-section';
        
        const field = document.createElement('div');
        field.className = 'sidebar-field';
        
        const labelDiv = document.createElement('div');
        labelDiv.className = 'sidebar-field-label';
        labelDiv.textContent = label;
        
        const valueDiv = document.createElement('div');
        valueDiv.className = 'sidebar-field-value sidebar-datetime-value';
        
        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.className = 'sidebar-datetime-input';
        dateInput.value = formatDateToInput(dateTime);
        
        const timeInput = document.createElement('input');
        timeInput.type = 'time';
        timeInput.className = 'sidebar-datetime-input';
        timeInput.value = formatTimeToInput(dateTime);
        
        valueDiv.appendChild(dateInput);
        valueDiv.appendChild(timeInput);
        
        // Save on change
        const saveDateTime = async () => {
            const newDateTime = combineDateTimeToISO(dateInput.value, timeInput.value);
            const fieldName = isStart ? 'start_time' : 'end_time';
            await this.updateEventField(eventId, fieldName, newDateTime);
        };
        
        dateInput.addEventListener('change', saveDateTime);
        timeInput.addEventListener('change', saveDateTime);
        
        field.appendChild(labelDiv);
        field.appendChild(valueDiv);
        section.appendChild(field);
        
        return section;
    }

    /**
     * Update a single event field
     * @param {string} eventId - Event ID
     * @param {string} fieldName - Field name to update
     * @param {any} value - New value
     */
    async updateEventField(eventId, fieldName, value) {
        try {
            const event = eventManager.getEventById(eventId);
            if (!event) {
                throw new Error('Event not found');
            }
            
            // Update the event object in memory
            event[fieldName] = value;
            
            // Send update to backend
            await apiRequest(`/events/${eventId}`, 'PUT', event);
            
            // Reload events to refresh the calendar display
            await eventManager.reloadEventsForCurrentView();
            
            // Only refresh sidebar if not updating level (to avoid losing focus)
            // For level changes, we'll update the display manually
            if (fieldName !== 'level') {
                this.showEventDetails(eventId);
            }
            
        } catch (error) {
            console.error('Failed to update event:', error);
            alert('Failed to update event: ' + error.message);
        }
    }

    /**
     * Create a sidebar note element
     * @param {object} note - Note object
     * @param {string} eventId - Event ID
     * @param {boolean} isTodo - Whether this is a todo item
     * @returns {Element} Note element
     */
    createSidebarNote(note, eventId, isTodo = false) {
        const noteEl = document.createElement('div');
        noteEl.className = 'sidebar-note';
        
        // Note header with edit button
        const noteHeader = document.createElement('div');
        noteHeader.className = 'sidebar-note-header';
        
        const preview = document.createElement('div');
        preview.className = 'note-preview';
        preview.style.flex = '1';
        
        if (isTodo) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'note-todo-checkbox';
            checkbox.checked = note.completed || false;
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                eventCRUD.updateNoteStatus(eventId, note.id, e.target.checked);
            });
            preview.appendChild(checkbox);
        }
        
        preview.appendChild(document.createTextNode(truncateText(stripHtml(note.content), 50)));
        
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-small sidebar-note-edit-btn';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showEditNoteForm(eventId, note, isTodo);
        });
        
        noteHeader.appendChild(preview);
        noteHeader.appendChild(editBtn);
        
        const full = document.createElement('div');
        full.className = 'note-full';
        full.style.display = 'none';
        
        if (isTodo) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'note-todo-checkbox';
            checkbox.checked = note.completed || false;
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                eventCRUD.updateNoteStatus(eventId, note.id, e.target.checked);
            });
            full.appendChild(checkbox);
        }
        
        full.appendChild(document.createTextNode(note.content));
        
        noteEl.appendChild(noteHeader);
        noteEl.appendChild(full);
        
        // Toggle expand/collapse on clicking the preview
        preview.addEventListener('click', () => {
            const isExpanded = full.style.display !== 'none';
            full.style.display = isExpanded ? 'none' : 'block';
            noteHeader.style.display = isExpanded ? 'flex' : 'none';
        });
        
        return noteEl;
    }

    /**
     * Show the add note/todo form in the sidebar
     * @param {string} eventId - Event ID
     * @param {string} type - Note type ('note' or 'todo')
     */
    showAddNoteForm(eventId, type) {
        const formAreaId = type === 'note' ? 'sidebar-note-form-area' : 'sidebar-todo-form-area';
        const formArea = document.getElementById(formAreaId);
        
        // Hide both forms first
        document.getElementById('sidebar-note-form-area').style.display = 'none';
        document.getElementById('sidebar-todo-form-area').style.display = 'none';
        
        // Clear and show the appropriate form
        formArea.innerHTML = '';
        formArea.style.display = 'block';
        
        const form = document.createElement('form');
        form.className = 'sidebar-note-form';
        form.style.marginTop = '10px';
        
        const textarea = document.createElement('textarea');
        textarea.className = 'form-control';
        textarea.placeholder = type === 'note' ? 'Enter note text...' : 'Enter to-do item...';
        textarea.rows = 3;
        textarea.required = true;
        form.appendChild(textarea);
        
        const buttonRow = document.createElement('div');
        buttonRow.style.marginTop = '10px';
        buttonRow.style.display = 'flex';
        buttonRow.style.gap = '10px';
        
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'btn btn-primary btn-small';
        submitBtn.textContent = 'Save';
        buttonRow.appendChild(submitBtn);
        
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-secondary btn-small';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => {
            formArea.style.display = 'none';
            formArea.innerHTML = '';
        });
        buttonRow.appendChild(cancelBtn);
        
        form.appendChild(buttonRow);
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveNewNote(eventId, type, textarea.value);
        });
        
        formArea.appendChild(form);
        textarea.focus();
    }

    /**
     * Save a new note/todo to the event
     * @param {string} eventId - Event ID
     * @param {string} type - Note type ('note' or 'todo')
     * @param {string} content - Note content
     */
    async saveNewNote(eventId, type, content) {
        try {
            const event = eventManager.getEventById(eventId);
            if (!event) {
                throw new Error('Event not found');
            }
            
            // Add new note to event
            if (!event.notes) {
                event.notes = [];
            }
            
            const newNote = {
                id: Date.now().toString(),
                type: type,
                content: content,
                completed: false
            };
            
            event.notes.push(newNote);
            
            // Save to backend
            await apiRequest(`/events/${eventId}`, 'PUT', event);
            
            // Reload event display
            await eventManager.reloadEventsForCurrentView();
            
            // Refresh sidebar
            this.showEventDetails(eventId);
            
        } catch (error) {
            console.error('Failed to save note:', error);
            alert('Failed to save note: ' + error.message);
        }
    }

    /**
     * Show the edit note/todo form in the sidebar
     * @param {string} eventId - Event ID
     * @param {object} note - Note object to edit
     * @param {boolean} isTodo - Whether this is a todo item
     */
    showEditNoteForm(eventId, note, isTodo) {
        const formAreaId = isTodo ? 'sidebar-todo-form-area' : 'sidebar-note-form-area';
        const formArea = document.getElementById(formAreaId);
        
        // Hide both add forms
        document.getElementById('sidebar-note-form-area').style.display = 'none';
        document.getElementById('sidebar-todo-form-area').style.display = 'none';
        
        // Clear and show the edit form
        formArea.innerHTML = '';
        formArea.style.display = 'block';
        
        const form = document.createElement('form');
        form.className = 'sidebar-note-form';
        form.style.marginTop = '10px';
        
        const label = document.createElement('div');
        label.style.fontWeight = '600';
        label.style.marginBottom = '8px';
        label.textContent = `Edit ${isTodo ? 'To-Do' : 'Note'}`;
        form.appendChild(label);
        
        const textarea = document.createElement('textarea');
        textarea.className = 'form-control';
        textarea.placeholder = isTodo ? 'Enter to-do item...' : 'Enter note text...';
        textarea.rows = 3;
        textarea.required = true;
        textarea.value = note.content;
        form.appendChild(textarea);
        
        const buttonRow = document.createElement('div');
        buttonRow.style.marginTop = '10px';
        buttonRow.style.display = 'flex';
        buttonRow.style.gap = '10px';
        
        const saveBtn = document.createElement('button');
        saveBtn.type = 'submit';
        saveBtn.className = 'btn btn-primary btn-small';
        saveBtn.textContent = 'Save';
        buttonRow.appendChild(saveBtn);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn btn-danger btn-small';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this ' + (isTodo ? 'to-do' : 'note') + '?')) {
                await this.deleteNote(eventId, note.id);
            }
        });
        buttonRow.appendChild(deleteBtn);
        
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-secondary btn-small';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => {
            formArea.style.display = 'none';
            formArea.innerHTML = '';
        });
        buttonRow.appendChild(cancelBtn);
        
        form.appendChild(buttonRow);
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateNote(eventId, note.id, textarea.value);
        });
        
        formArea.appendChild(form);
        textarea.focus();
    }

    /**
     * Update an existing note/todo
     * @param {string} eventId - Event ID
     * @param {string} noteId - Note ID
     * @param {string} content - New content
     */
    async updateNote(eventId, noteId, content) {
        try {
            const event = eventManager.getEventById(eventId);
            if (!event) {
                throw new Error('Event not found');
            }
            
            // Find and update the note
            const note = event.notes.find(n => n.id === noteId);
            if (!note) {
                throw new Error('Note not found');
            }
            
            note.content = content;
            
            // Save to backend
            await apiRequest(`/events/${eventId}`, 'PUT', event);
            
            // Reload event display
            await eventManager.reloadEventsForCurrentView();
            
            // Refresh sidebar
            this.showEventDetails(eventId);
            
        } catch (error) {
            console.error('Failed to update note:', error);
            alert('Failed to update note: ' + error.message);
        }
    }

    /**
     * Delete a note/todo
     * @param {string} eventId - Event ID
     * @param {string} noteId - Note ID
     */
    async deleteNote(eventId, noteId) {
        try {
            const event = eventManager.getEventById(eventId);
            if (!event) {
                throw new Error('Event not found');
            }
            
            // Remove the note
            event.notes = event.notes.filter(n => n.id !== noteId);
            
            // Save to backend
            await apiRequest(`/events/${eventId}`, 'PUT', event);
            
            // Reload event display
            await eventManager.reloadEventsForCurrentView();
            
            // Refresh sidebar
            this.showEventDetails(eventId);
            
        } catch (error) {
            console.error('Failed to delete note:', error);
            alert('Failed to delete note: ' + error.message);
        }
    }
}

// Global instance (created in events.js)

