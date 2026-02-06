
/**
 * Alpha Profin - Inter-Terminal Communication Link
 * Uses LocalStorage to simulate real-time chat between tabs.
 */

const CommLink = {
    CHANNEL_KEY: 'alpha_comm_channel_v1',
    userType: 'GUEST', // 'ADMIN' or 'AGENT'
    userName: 'Unknown',
    onMessage: null,

    /**
     * Initialize the Comm Link
     * @param {string} type - 'ADMIN' or 'AGENT'
     * @param {string} name - Display Name (e.g. "Agent Smith")
     * @param {function} callback - Function to run when a new message arrives
     */
    init(type, name, callback) {
        this.userType = type;
        this.userName = name;
        this.onMessage = callback;

        // Listen for cross-tab updates
        window.addEventListener('storage', (e) => {
            if (e.key === this.CHANNEL_KEY) {
                const packet = JSON.parse(e.newValue);
                // Only notify if it's a new message and not from self
                // (Storage event only fires on OTHER tabs, so self-check is implicit, but good safety)
                if (packet && this.onMessage) {
                    this.onMessage(packet);
                }
            }
        });

        console.log(`CommLink Online: ${name} as ${type}`);
    },

    /**
     * Send a message to the channel
     * @param {string} text 
     */
    send(text) {
        if (!text.trim()) return;

        const packet = {
            id: Date.now(),
            sender: this.userName,
            role: this.userType,
            text: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // 1. Update Persistent History
        const history = this.getHistory();
        history.push(packet);
        localStorage.setItem(this.CHANNEL_KEY + '_history', JSON.stringify(history));

        // 2. Trigger Event (This fires 'storage' event on other tabs)
        // We set a random value or timestamp to ensure the event always fires even if content is same
        localStorage.setItem(this.CHANNEL_KEY, JSON.stringify(packet));

        return packet; // Return so UI can draw immediate self-message
    },

    /**
     * Retrieve full chat history
     */
    getHistory() {
        const raw = localStorage.getItem(this.CHANNEL_KEY + '_history');
        return raw ? JSON.parse(raw) : [];
    }
};
