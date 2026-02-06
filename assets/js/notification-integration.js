// ═══════════════════════════════════════════════════════════════════════════
// ALPHA PROFIN - NOTIFICATION DEMO & INTEGRATION
// This file demonstrates the Smart Notification Engine in action
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialize demo notifications for testing
 * Call this function to see the notification system in action
 */
function initDemoNotifications() {
    console.log('🎯 Initializing Demo Notifications...');

    // Wait for notification engine to be ready
    setTimeout(() => {
        if (typeof NotificationEngine === 'undefined') {
            console.error('Notification Engine not loaded!');
            return;
        }

        // Demo 1: High-value lead notification (after 2 seconds)
        setTimeout(() => {
            NotificationEngine.add({
                type: 'LEAD_HIGH_VALUE',
                message: 'New lead "Rajesh Kumar" with ₹50L loan requirement. CIBIL: 780',
                actions: [
                    { label: 'View Lead', action: 'view_lead' },
                    { label: 'Call Now', action: 'call_lead' }
                ],
                relatedId: 'L001',
                relatedType: 'lead',
                actionUrl: '#'
            });
        }, 2000);

        // Demo 2: Task overdue notification (after 5 seconds)
        setTimeout(() => {
            NotificationEngine.add({
                type: 'TASK_OVERDUE',
                message: 'Follow-up with "Priya Sharma" is overdue by 2 hours',
                actions: [
                    { label: 'Complete', action: 'complete_task' },
                    { label: 'Snooze 1h', action: 'snooze_1h' }
                ],
                relatedId: 'T001',
                relatedType: 'task'
            });
        }, 5000);

        // Demo 3: Document required (after 8 seconds)
        setTimeout(() => {
            NotificationEngine.add({
                type: 'DOCUMENT_REQUIRED',
                message: 'Bank statement missing for lead "Amit Patel"',
                actions: [
                    { label: 'Upload', action: 'upload_doc' },
                    { label: 'Request', action: 'request_doc' }
                ],
                relatedId: 'L002',
                relatedType: 'lead'
            });
        }, 8000);

        // Demo 4: Approval received (after 12 seconds)
        setTimeout(() => {
            NotificationEngine.add({
                type: 'APPROVAL_RECEIVED',
                message: 'HDFC approved ₹25L for "Sunita Verma". Commission: ₹12,500',
                actions: [
                    { label: 'View Details', action: 'view_approval' },
                    { label: 'Notify Customer', action: 'notify_customer' }
                ],
                relatedId: 'L003',
                relatedType: 'lead'
            });
        }, 12000);

        // Demo 5: Commission earned (after 15 seconds)
        setTimeout(() => {
            NotificationEngine.add({
                type: 'COMMISSION_EARNED',
                message: 'You earned ₹18,750 from 3 disbursed loans this week!',
                actions: [
                    { label: 'View Report', action: 'view_report' }
                ]
            });
        }, 15000);

        console.log('✅ Demo notifications scheduled!');
    }, 1000);
}

/**
 * Handle notification actions
 */
NotificationEngine.on('onNotificationAction', (data) => {
    const { notification, action } = data;

    console.log('Notification action:', action, notification);

    switch (action) {
        case 'view_lead':
            alert(`Viewing lead: ${notification.relatedId}`);
            break;

        case 'call_lead':
            alert(`Calling lead: ${notification.relatedId}`);
            break;

        case 'complete_task':
            NotificationEngine.dismiss(notification.id);
            NotificationEngine.add({
                type: 'SYSTEM_UPDATE',
                message: 'Task marked as complete!',
                priority: 'LOW'
            });
            break;

        case 'snooze_1h':
            NotificationEngine.snooze(notification.id, 60);
            break;

        case 'upload_doc':
            alert('Opening document upload...');
            break;

        case 'request_doc':
            alert('Sending document request to customer...');
            break;

        case 'view_approval':
            alert(`Viewing approval details for: ${notification.relatedId}`);
            break;

        case 'notify_customer':
            alert('Sending approval notification to customer...');
            break;

        case 'view_report':
            alert('Opening commission report...');
            break;

        default:
            console.log('Unknown action:', action);
    }
});

/**
 * Trigger notification when lead is saved
 */
function notifyLeadSaved(leadData) {
    NotificationEngine.add({
        type: 'LEAD_UPDATE',
        message: `Lead "${leadData.name}" saved successfully`,
        actions: [
            { label: 'View', action: 'view_lead' }
        ],
        relatedId: leadData.id,
        relatedType: 'lead'
    });
}

/**
 * Trigger notification when document is uploaded
 */
function notifyDocumentUploaded(docName) {
    NotificationEngine.add({
        type: 'SYSTEM_UPDATE',
        message: `Document "${docName}" uploaded successfully`,
        icon: 'fa-file-upload'
    });
}

/**
 * Trigger notification for urgent leads
 */
function notifyUrgentLead(leadData) {
    NotificationEngine.add({
        type: 'LEAD_URGENT',
        message: `URGENT: High-priority lead "${leadData.name}" requires immediate attention!`,
        actions: [
            { label: 'Call Now', action: 'call_lead' },
            { label: 'View Details', action: 'view_lead' }
        ],
        relatedId: leadData.id,
        relatedType: 'lead'
    });
}

/**
 * Trigger notification for task reminders
 */
function notifyTaskDueSoon(taskData) {
    NotificationEngine.add({
        type: 'TASK_DUE_SOON',
        message: `Task "${taskData.title}" is due in ${taskData.dueIn}`,
        actions: [
            { label: 'Complete', action: 'complete_task' },
            { label: 'Snooze', action: 'snooze_1h' }
        ],
        relatedId: taskData.id,
        relatedType: 'task'
    });
}

/**
 * Trigger notification for chat messages
 */
function notifyChatMessage(from, message) {
    NotificationEngine.add({
        type: 'CHAT_MESSAGE',
        title: `Message from ${from}`,
        message: message,
        actions: [
            { label: 'Reply', action: 'open_chat' }
        ]
    });
}

// Export functions for use in agent.js
window.AlphaNotifications = {
    initDemo: initDemoNotifications,
    leadSaved: notifyLeadSaved,
    documentUploaded: notifyDocumentUploaded,
    urgentLead: notifyUrgentLead,
    taskDueSoon: notifyTaskDueSoon,
    chatMessage: notifyChatMessage
};

console.log('✅ Notification Integration Ready');

// Auto-start demo notifications (comment out in production)
// Uncomment the line below to see demo notifications
// setTimeout(() => initDemoNotifications(), 3000);
