// ═══════════════════════════════════════════════════════════════════════════
// ALPHA PROFIN - SMART NOTIFICATION ENGINE v2.0
// Industry-Leading Notification System with Priority Intelligence
// ═══════════════════════════════════════════════════════════════════════════

const NotificationEngine = {
    // Configuration
    config: {
        maxNotifications: 100,
        autoMarkReadDelay: 5000,
        soundEnabled: true,
        vibrationEnabled: true,
        groupingEnabled: true,
        smartPriorityEnabled: true
    },

    // State
    queue: [],
    preferences: {},
    sounds: {},
    isInitialized: false,

    // Priority Levels
    PRIORITY: {
        CRITICAL: { level: 4, color: '#ef4444', icon: 'fa-exclamation-circle', sound: 'critical' },
        HIGH: { level: 3, color: '#f59e0b', icon: 'fa-exclamation-triangle', sound: 'high' },
        MEDIUM: { level: 2, color: '#3b82f6', icon: 'fa-info-circle', sound: 'medium' },
        LOW: { level: 1, color: '#6b7280', icon: 'fa-bell', sound: 'low' }
    },

    // Notification Types
    TYPES: {
        LEAD_URGENT: { priority: 'CRITICAL', category: 'leads', title: 'Urgent Lead Action Required' },
        LEAD_HIGH_VALUE: { priority: 'HIGH', category: 'leads', title: 'High-Value Lead' },
        TASK_OVERDUE: { priority: 'HIGH', category: 'tasks', title: 'Task Overdue' },
        TASK_DUE_SOON: { priority: 'MEDIUM', category: 'tasks', title: 'Task Due Soon' },
        LEAD_UPDATE: { priority: 'MEDIUM', category: 'leads', title: 'Lead Status Update' },
        COMMISSION_EARNED: { priority: 'MEDIUM', category: 'finance', title: 'Commission Earned' },
        DOCUMENT_REQUIRED: { priority: 'HIGH', category: 'documents', title: 'Document Required' },
        APPROVAL_RECEIVED: { priority: 'HIGH', category: 'approvals', title: 'Approval Received' },
        CHAT_MESSAGE: { priority: 'LOW', category: 'communication', title: 'New Message' },
        SYSTEM_UPDATE: { priority: 'LOW', category: 'system', title: 'System Update' }
    },

    /**
     * Initialize the notification engine
     */
    init() {
        if (this.isInitialized) return;

        console.log('🔔 Initializing Smart Notification Engine v2.0...');

        // Load saved data
        this.loadPreferences();
        this.loadQueue();

        // Setup UI
        this.createNotificationPanel();
        this.createNotificationBell();

        // Setup event listeners
        this.attachEventListeners();

        // Start background tasks
        this.startBackgroundTasks();

        // Initialize sounds
        this.initializeSounds();

        this.isInitialized = true;
        console.log('✅ Notification Engine Ready!');

        // Show welcome notification
        this.add({
            type: 'SYSTEM_UPDATE',
            message: 'Smart Notification Engine is now active! You\'ll receive intelligent, priority-based alerts.',
            actions: [
                { label: 'Got it', action: 'dismiss' }
            ]
        });
    },

    /**
     * Add a new notification
     */
    add(notification) {
        const notif = this.createNotification(notification);

        // Add to queue
        this.queue.unshift(notif);

        // Trim queue if too large
        if (this.queue.length > this.config.maxNotifications) {
            this.queue = this.queue.slice(0, this.config.maxNotifications);
        }

        // Save to storage
        this.saveQueue();

        // Update UI
        this.updateBadge();
        this.renderNotifications();

        // Show toast
        this.showToast(notif);

        // Play sound
        this.playSound(notif);

        // Send browser notification
        this.sendBrowserNotification(notif);

        // Trigger callbacks
        this.triggerCallbacks('onNotificationAdded', notif);

        return notif.id;
    },

    /**
     * Create notification object
     */
    createNotification(data) {
        const type = this.TYPES[data.type] || this.TYPES.SYSTEM_UPDATE;
        const priority = this.PRIORITY[type.priority];

        return {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: data.type,
            category: type.category,
            priority: type.priority,
            title: data.title || type.title,
            message: data.message,
            icon: data.icon || priority.icon,
            color: priority.color,
            timestamp: new Date().toISOString(),
            read: false,
            dismissed: false,
            snoozedUntil: null,
            actions: data.actions || [],
            metadata: data.metadata || {},
            relatedId: data.relatedId,
            relatedType: data.relatedType,
            actionUrl: data.actionUrl
        };
    },

    /**
     * Mark notification as read
     */
    markAsRead(id) {
        const notif = this.queue.find(n => n.id === id);
        if (notif && !notif.read) {
            notif.read = true;
            notif.readAt = new Date().toISOString();
            this.saveQueue();
            this.updateBadge();
            this.renderNotifications();
            this.triggerCallbacks('onNotificationRead', notif);
        }
    },

    /**
     * Mark all as read
     */
    markAllAsRead() {
        let count = 0;
        this.queue.forEach(notif => {
            if (!notif.read) {
                notif.read = true;
                notif.readAt = new Date().toISOString();
                count++;
            }
        });

        if (count > 0) {
            this.saveQueue();
            this.updateBadge();
            this.renderNotifications();
            this.showToast({
                title: 'All notifications marked as read',
                priority: 'LOW',
                icon: 'fa-check'
            });
        }
    },

    /**
     * Dismiss notification
     */
    dismiss(id) {
        const notif = this.queue.find(n => n.id === id);
        if (notif) {
            notif.dismissed = true;
            notif.dismissedAt = new Date().toISOString();
            this.saveQueue();
            this.renderNotifications();
            this.updateBadge();
        }
    },

    /**
     * Snooze notification
     */
    snooze(id, minutes) {
        const notif = this.queue.find(n => n.id === id);
        if (notif) {
            const snoozeUntil = new Date(Date.now() + minutes * 60000);
            notif.snoozedUntil = snoozeUntil.toISOString();
            notif.read = true;
            this.saveQueue();
            this.renderNotifications();
            this.updateBadge();

            this.showToast({
                title: 'Notification snoozed',
                message: `Will remind you in ${minutes} minutes`,
                priority: 'LOW',
                icon: 'fa-clock'
            });
        }
    },

    /**
     * Get unread count
     */
    getUnreadCount() {
        return this.queue.filter(n => !n.read && !n.dismissed && !this.isSnoozed(n)).length;
    },

    /**
     * Check if notification is snoozed
     */
    isSnoozed(notif) {
        if (!notif.snoozedUntil) return false;
        return new Date(notif.snoozedUntil) > new Date();
    },

    /**
     * Get notifications by priority
     */
    getByPriority(priority) {
        return this.queue.filter(n => n.priority === priority && !n.dismissed);
    },

    /**
     * Get notifications by category
     */
    getByCategory(category) {
        return this.queue.filter(n => n.category === category && !n.dismissed);
    },

    /**
     * Group notifications
     */
    groupNotifications() {
        const grouped = {};

        this.queue.forEach(notif => {
            if (notif.dismissed || this.isSnoozed(notif)) return;

            const key = `${notif.category}_${notif.priority}`;
            if (!grouped[key]) {
                grouped[key] = {
                    category: notif.category,
                    priority: notif.priority,
                    notifications: []
                };
            }
            grouped[key].notifications.push(notif);
        });

        return Object.values(grouped);
    },

    /**
     * Create notification panel UI
     */
    createNotificationPanel() {
        if (document.getElementById('alphaNotificationPanel')) return;

        const panel = document.createElement('div');
        panel.id = 'alphaNotificationPanel';
        panel.className = 'alpha-notification-panel';
        panel.style.display = 'none';

        panel.innerHTML = `
            <div class="notif-panel-header">
                <div class="notif-panel-title">
                    <i class="fas fa-bell"></i>
                    <span>Notifications</span>
                    <span class="notif-unread-badge" id="notifPanelBadge">0</span>
                </div>
                <div class="notif-panel-actions">
                    <button class="notif-action-btn" onclick="NotificationEngine.markAllAsRead()" title="Mark all as read">
                        <i class="fas fa-check-double"></i>
                    </button>
                    <button class="notif-action-btn" onclick="NotificationEngine.clearAll()" title="Clear all">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="notif-action-btn" onclick="NotificationEngine.togglePanel()" title="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <div class="notif-panel-filters">
                <button class="notif-filter-btn active" data-filter="all">All</button>
                <button class="notif-filter-btn" data-filter="unread">Unread</button>
                <button class="notif-filter-btn" data-filter="CRITICAL">Critical</button>
                <button class="notif-filter-btn" data-filter="HIGH">High</button>
            </div>

            <div class="notif-panel-list" id="notifPanelList">
                <!-- Notifications rendered here -->
            </div>

            <div class="notif-panel-footer">
                <button class="notif-settings-btn" onclick="NotificationEngine.openSettings()">
                    <i class="fas fa-cog"></i> Settings
                </button>
            </div>
        `;

        document.body.appendChild(panel);

        // Add filter event listeners
        panel.querySelectorAll('.notif-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                panel.querySelectorAll('.notif-filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.renderNotifications(e.target.dataset.filter);
            });
        });
    },

    /**
     * Create notification bell icon
     */
    createNotificationBell() {
        if (document.getElementById('alphaNotificationBell')) return;

        const bell = document.createElement('div');
        bell.id = 'alphaNotificationBell';
        bell.className = 'alpha-notification-bell';
        bell.innerHTML = `
            <i class="fas fa-bell"></i>
            <span class="notif-badge" id="notifBellBadge">0</span>
        `;

        bell.addEventListener('click', () => this.togglePanel());

        // Add to top nav
        const topNav = document.querySelector('.top-nav');
        if (topNav) {
            topNav.appendChild(bell);
        }
    },

    /**
     * Toggle notification panel
     */
    togglePanel() {
        const panel = document.getElementById('alphaNotificationPanel');
        if (panel) {
            const isVisible = panel.style.display !== 'none';
            panel.style.display = isVisible ? 'none' : 'block';

            if (!isVisible) {
                this.renderNotifications();
            }
        }
    },

    /**
     * Update badge count
     */
    updateBadge() {
        const count = this.getUnreadCount();

        // Update bell badge
        const bellBadge = document.getElementById('notifBellBadge');
        if (bellBadge) {
            bellBadge.textContent = count;
            bellBadge.style.display = count > 0 ? 'flex' : 'none';
        }

        // Update panel badge
        const panelBadge = document.getElementById('notifPanelBadge');
        if (panelBadge) {
            panelBadge.textContent = count;
        }

        // Animate bell if new notifications
        if (count > 0) {
            const bell = document.getElementById('alphaNotificationBell');
            if (bell) {
                bell.classList.add('has-notifications');
            }
        }
    },

    /**
     * Render notifications in panel
     */
    renderNotifications(filter = 'all') {
        const list = document.getElementById('notifPanelList');
        if (!list) return;

        let notifications = this.queue.filter(n => !n.dismissed && !this.isSnoozed(n));

        // Apply filter
        if (filter === 'unread') {
            notifications = notifications.filter(n => !n.read);
        } else if (filter !== 'all') {
            notifications = notifications.filter(n => n.priority === filter);
        }

        // Sort by priority and timestamp
        notifications.sort((a, b) => {
            const priorityDiff = this.PRIORITY[b.priority].level - this.PRIORITY[a.priority].level;
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        if (notifications.length === 0) {
            list.innerHTML = `
                <div class="notif-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications</p>
                </div>
            `;
            return;
        }

        list.innerHTML = notifications.map(notif => this.renderNotificationItem(notif)).join('');
    },

    /**
     * Render single notification item
     */
    renderNotificationItem(notif) {
        const priority = this.PRIORITY[notif.priority];
        const timeAgo = this.getTimeAgo(notif.timestamp);
        const isUnread = !notif.read;

        return `
            <div class="notif-item ${isUnread ? 'unread' : ''}" 
                 data-id="${notif.id}"
                 onclick="NotificationEngine.handleNotificationClick('${notif.id}')">
                
                <div class="notif-item-indicator" style="background: ${priority.color}"></div>
                
                <div class="notif-item-icon" style="color: ${priority.color}">
                    <i class="fas ${notif.icon}"></i>
                </div>
                
                <div class="notif-item-content">
                    <div class="notif-item-header">
                        <span class="notif-item-title">${notif.title}</span>
                        <span class="notif-item-time">${timeAgo}</span>
                    </div>
                    <div class="notif-item-message">${notif.message}</div>
                    
                    ${notif.actions.length > 0 ? `
                        <div class="notif-item-actions">
                            ${notif.actions.map(action => `
                                <button class="notif-action-btn-small" 
                                        onclick="event.stopPropagation(); NotificationEngine.handleAction('${notif.id}', '${action.action}')">
                                    ${action.label}
                                </button>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="notif-item-menu">
                    <button class="notif-menu-btn" onclick="event.stopPropagation(); NotificationEngine.showContextMenu('${notif.id}', event)">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Handle notification click
     */
    handleNotificationClick(id) {
        const notif = this.queue.find(n => n.id === id);
        if (!notif) return;

        // Mark as read
        this.markAsRead(id);

        // Navigate to action URL if exists
        if (notif.actionUrl) {
            window.location.href = notif.actionUrl;
        }

        // Trigger callback
        this.triggerCallbacks('onNotificationClicked', notif);
    },

    /**
     * Handle notification action
     */
    handleAction(id, action) {
        const notif = this.queue.find(n => n.id === id);
        if (!notif) return;

        if (action === 'dismiss') {
            this.dismiss(id);
        } else {
            this.triggerCallbacks('onNotificationAction', { notification: notif, action });
        }
    },

    /**
     * Show context menu
     */
    showContextMenu(id, event) {
        // TODO: Implement context menu
        console.log('Context menu for:', id);
    },

    /**
     * Show toast notification
     */
    showToast(notif) {
        const toast = document.createElement('div');
        toast.className = 'alpha-notification-toast';
        toast.style.borderLeft = `4px solid ${this.PRIORITY[notif.priority].color}`;

        toast.innerHTML = `
            <div class="toast-icon" style="color: ${this.PRIORITY[notif.priority].color}">
                <i class="fas ${notif.icon}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${notif.title}</div>
                <div class="toast-message">${notif.message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    },

    /**
     * Play notification sound
     */
    playSound(notif) {
        if (!this.config.soundEnabled) return;

        // TODO: Implement sound playback
        // For now, use browser beep
        if (notif.priority === 'CRITICAL' || notif.priority === 'HIGH') {
            // Browser beep for important notifications
        }
    },

    /**
     * Send browser notification
     */
    async sendBrowserNotification(notif) {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            new Notification(notif.title, {
                body: notif.message,
                icon: '/assets/images/logo.png',
                badge: '/assets/images/badge.png',
                tag: notif.id
            });
        } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this.sendBrowserNotification(notif);
            }
        }
    },

    /**
     * Get time ago string
     */
    getTimeAgo(timestamp) {
        const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return new Date(timestamp).toLocaleDateString();
    },

    /**
     * Clear all notifications
     */
    clearAll() {
        if (confirm('Are you sure you want to clear all notifications?')) {
            this.queue = [];
            this.saveQueue();
            this.updateBadge();
            this.renderNotifications();
        }
    },

    /**
     * Initialize sounds
     */
    initializeSounds() {
        // TODO: Load sound files
    },

    /**
     * Start background tasks
     */
    startBackgroundTasks() {
        // Check for snoozed notifications every minute
        setInterval(() => {
            this.checkSnoozedNotifications();
        }, 60000);

        // Auto-save every 30 seconds
        setInterval(() => {
            this.saveQueue();
        }, 30000);
    },

    /**
     * Check snoozed notifications
     */
    checkSnoozedNotifications() {
        const now = new Date();
        this.queue.forEach(notif => {
            if (notif.snoozedUntil && new Date(notif.snoozedUntil) <= now) {
                notif.snoozedUntil = null;
                notif.read = false;
                this.showToast(notif);
            }
        });
        this.saveQueue();
        this.updateBadge();
        this.renderNotifications();
    },

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('alphaNotificationPanel');
            const bell = document.getElementById('alphaNotificationBell');

            if (panel && bell &&
                !panel.contains(e.target) &&
                !bell.contains(e.target) &&
                panel.style.display !== 'none') {
                panel.style.display = 'none';
            }
        });
    },

    /**
     * Open settings
     */
    openSettings() {
        // TODO: Implement settings modal
        alert('Notification settings coming soon!');
    },

    /**
     * Save queue to storage
     */
    saveQueue() {
        try {
            localStorage.setItem('alpha_notifications', JSON.stringify(this.queue));
        } catch (error) {
            console.error('Failed to save notifications:', error);
        }
    },

    /**
     * Load queue from storage
     */
    loadQueue() {
        try {
            const saved = localStorage.getItem('alpha_notifications');
            this.queue = saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Failed to load notifications:', error);
            this.queue = [];
        }
    },

    /**
     * Save preferences
     */
    savePreferences() {
        try {
            localStorage.setItem('alpha_notif_prefs', JSON.stringify(this.preferences));
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    },

    /**
     * Load preferences
     */
    loadPreferences() {
        try {
            const saved = localStorage.getItem('alpha_notif_prefs');
            this.preferences = saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Failed to load preferences:', error);
            this.preferences = {};
        }
    },

    /**
     * Trigger callbacks
     */
    triggerCallbacks(event, data) {
        if (this.preferences[event]) {
            this.preferences[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Callback error for ${event}:`, error);
                }
            });
        }
    },

    /**
     * Register callback
     */
    on(event, callback) {
        if (!this.preferences[event]) {
            this.preferences[event] = [];
        }
        this.preferences[event].push(callback);
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NotificationEngine.init());
} else {
    NotificationEngine.init();
}

// Make globally available
window.NotificationEngine = NotificationEngine;

console.log('✅ Smart Notification Engine v2.0 Loaded');
