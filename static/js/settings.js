/**
 * Settings management functionality
 */

class SettingsManager {
    constructor() {
        this.settings = {
            backupEnabled: false,
            backupLocation: ''
        };
        this.syncInterval = null;
        this.setupEventListeners();
        this.loadSettings();
    }

    /**
     * Set up event listeners for settings controls
     */
    setupEventListeners() {
        // Settings button
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.openSettings();
        });

        // Backup/sync checkbox
        const backupCheckbox = document.getElementById('backup-sync-enabled');
        backupCheckbox.addEventListener('change', (e) => {
            this.toggleBackupInputs(e.target.checked);
        });

        // Validate location button
        document.getElementById('validate-location-btn').addEventListener('click', () => {
            this.validateLocation();
        });

        // Save settings button
        document.getElementById('save-settings-btn').addEventListener('click', () => {
            this.saveSettings();
        });

        // Manual sync button
        document.getElementById('manual-sync-btn').addEventListener('click', () => {
            this.triggerManualSync();
        });
    }

    /**
     * Load settings from backend
     */
    async loadSettings() {
        try {
            const response = await fetch('/api/settings');
            if (response.ok) {
                const data = await response.json();
                this.settings = data;
                this.updateSyncButton();
                
                // Set up periodic sync if enabled
                if (this.settings.backupEnabled && this.settings.backupLocation) {
                    this.startPeriodicSync();
                }
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    /**
     * Open settings modal and populate fields
     */
    openSettings() {
        const checkbox = document.getElementById('backup-sync-enabled');
        const locationInput = document.getElementById('backup-location');
        
        checkbox.checked = this.settings.backupEnabled;
        locationInput.value = this.settings.backupLocation;
        
        this.toggleBackupInputs(this.settings.backupEnabled);
        
        modalManager.openModal('settings-modal');
    }

    /**
     * Toggle backup input fields based on checkbox state
     */
    toggleBackupInputs(enabled) {
        const locationInput = document.getElementById('backup-location');
        const validateBtn = document.getElementById('validate-location-btn');
        const statusDiv = document.getElementById('location-status');
        
        locationInput.disabled = !enabled;
        validateBtn.disabled = !enabled;
        
        // Clear status message when toggling
        statusDiv.className = 'location-status';
        statusDiv.textContent = '';
    }

    /**
     * Validate the backup location
     */
    async validateLocation() {
        const locationInput = document.getElementById('backup-location');
        const statusDiv = document.getElementById('location-status');
        const location = locationInput.value.trim();
        
        if (!location) {
            this.showLocationStatus('Please enter a location path', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/settings/validate-location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ location })
            });
            
            const data = await response.json();
            
            if (response.ok && data.valid) {
                this.showLocationStatus('✓ Location is valid and accessible', 'success');
            } else {
                this.showLocationStatus(data.error || 'Location is not accessible', 'error');
            }
        } catch (error) {
            this.showLocationStatus('Failed to validate location', 'error');
            console.error('Validation error:', error);
        }
    }

    /**
     * Show location validation status
     */
    showLocationStatus(message, type) {
        const statusDiv = document.getElementById('location-status');
        statusDiv.textContent = message;
        statusDiv.className = `location-status ${type}`;
    }

    /**
     * Save settings
     */
    async saveSettings() {
        const checkbox = document.getElementById('backup-sync-enabled');
        const locationInput = document.getElementById('backup-location');
        const location = locationInput.value.trim();
        
        // Validate if backup is enabled
        if (checkbox.checked) {
            if (!location) {
                this.showLocationStatus('Please enter a location path', 'error');
                return;
            }
            
            // Validate location before saving
            const validateResponse = await fetch('/api/settings/validate-location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ location })
            });
            
            const validateData = await validateResponse.json();
            
            if (!validateResponse.ok || !validateData.valid) {
                this.showLocationStatus(validateData.error || 'Invalid location. Please validate first.', 'error');
                return;
            }
        }
        
        // Save settings
        this.settings = {
            backupEnabled: checkbox.checked,
            backupLocation: location
        };
        
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.settings)
            });
            
            if (response.ok) {
                // Close modal
                modalManager.closeModal('settings-modal');
                
                // Update sync button
                this.updateSyncButton();
                
                // Set up or stop periodic sync
                if (this.settings.backupEnabled && this.settings.backupLocation) {
                    this.startPeriodicSync();
                    // Trigger initial sync
                    this.triggerBackgroundSync();
                } else {
                    this.stopPeriodicSync();
                }
                
                alert('Settings saved successfully!');
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            alert('Failed to save settings. Please try again.');
            console.error('Save error:', error);
        }
    }

    /**
     * Update manual sync button state
     */
    updateSyncButton() {
        const syncBtn = document.getElementById('manual-sync-btn');
        
        if (this.settings.backupEnabled && this.settings.backupLocation) {
            syncBtn.disabled = false;
            syncBtn.title = 'Manually trigger backup sync';
        } else {
            syncBtn.disabled = true;
            syncBtn.title = 'Enable backup/sync in settings';
        }
    }

    /**
     * Trigger manual sync
     */
    async triggerManualSync() {
        if (!this.settings.backupEnabled || !this.settings.backupLocation) {
            alert('Backup/sync is not enabled. Please configure it in settings.');
            return;
        }
        
        const syncBtn = document.getElementById('manual-sync-btn');
        syncBtn.classList.add('syncing');
        syncBtn.disabled = true;
        
        try {
            const response = await fetch('/api/settings/sync', {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert(`Sync completed successfully!\n\nFiles synced: ${data.files_synced}\nTime: ${new Date().toLocaleTimeString()}`);
            } else {
                throw new Error(data.error || 'Sync failed');
            }
        } catch (error) {
            alert(`Sync failed: ${error.message}`);
            console.error('Sync error:', error);
        } finally {
            syncBtn.classList.remove('syncing');
            syncBtn.disabled = false;
        }
    }

    /**
     * Trigger background sync (silent)
     */
    async triggerBackgroundSync() {
        if (!this.settings.backupEnabled || !this.settings.backupLocation) {
            return;
        }
        
        try {
            const response = await fetch('/api/settings/sync', {
                method: 'POST'
            });
            
            if (response.ok) {
                console.log('Background sync completed');
            } else {
                console.warn('Background sync failed');
            }
        } catch (error) {
            console.error('Background sync error:', error);
        }
    }

    /**
     * Start periodic sync (every 5 minutes)
     */
    startPeriodicSync() {
        // Clear existing interval if any
        this.stopPeriodicSync();
        
        // Set up new interval (5 minutes = 300000 ms)
        this.syncInterval = setInterval(() => {
            console.log('Running periodic sync...');
            this.triggerBackgroundSync();
        }, 300000); // 5 minutes
        
        console.log('Periodic sync started (every 5 minutes)');
    }

    /**
     * Stop periodic sync
     */
    stopPeriodicSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('Periodic sync stopped');
        }
    }

    /**
     * Trigger sync after data save (called by other modules)
     */
    syncAfterSave() {
        if (this.settings.backupEnabled && this.settings.backupLocation) {
            // Delay slightly to ensure file is written
            setTimeout(() => {
                this.triggerBackgroundSync();
            }, 500);
        }
    }
}

// Create global settings manager instance
const settingsManager = new SettingsManager();

