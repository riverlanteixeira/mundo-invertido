// Gerenciador de localização e navegação
class LocationManager {
    constructor() {
        this.currentPosition = null;
        this.targetPosition = null;
        this.watchId = null;
        this.isTracking = false;
        this.eventListeners = new Map();
    }

    async init() {
        Utils.log('Inicializando LocationManager...');
        // Implementação básica para não quebrar o jogo
        Utils.log('LocationManager inicializado (stub)');
    }

    async startTracking() {
        Utils.log('Iniciando rastreamento de localização...');
        this.isTracking = true;
        // Implementação será feita na próxima tarefa
    }

    stopTracking() {
        Utils.log('Parando rastreamento de localização...');
        this.isTracking = false;
    }

    // Sistema de eventos
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const callbacks = this.eventListeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    Utils.log(`Erro no callback de evento ${event}: ${error.message}`, 'error');
                }
            });
        }
    }

    cleanup() {
        this.stopTracking();
        this.eventListeners.clear();
    }
}

window.LocationManager = LocationManager;