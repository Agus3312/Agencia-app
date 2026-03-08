/**
 * EventBus
 * Simple pub/sub for decoupled component communication.
 * 
 * ┌─────────────────────────────────────────────────────┐
 * │ NOTA BACKEND: Cuando agreguemos WebSockets o        │
 * │ Supabase Realtime, los eventos del servidor se      │
 * │ inyectan acá. Los componentes no saben si el        │
 * │ evento viene de otro tab, del server, o de la UI.   │
 * │                                                     │
 * │ Recomendado: Socket.io para chat en tiempo real     │
 * │ Alternativa: Supabase Realtime (zero config)        │
 * └─────────────────────────────────────────────────────┘
 * 
 * Usage:
 *   EventBus.on('project:updated', (data) => { ... });
 *   EventBus.emit('project:updated', { id: 'p1' });
 *   EventBus.off('project:updated', handler);
 */
const EventBus = {
    _listeners: {},

    /**
     * Subscribe to an event
     */
    on(event, callback) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(callback);
        return () => this.off(event, callback); // Return unsubscribe function
    },

    /**
     * Unsubscribe from an event
     */
    off(event, callback) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    },

    /**
     * Emit an event with optional data
     */
    emit(event, data = null) {
        if (!this._listeners[event]) return;
        this._listeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (e) {
                console.error(`[EventBus] Error in listener for "${event}":`, e);
            }
        });
    },

    /**
     * Subscribe to an event, but only fire once
     */
    once(event, callback) {
        const wrapper = (data) => {
            callback(data);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    },

    /**
     * Remove all listeners (useful for cleanup/testing)
     */
    clear() {
        this._listeners = {};
    }
};

window.EventBus = EventBus;
