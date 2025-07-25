// Gerenciamento de estado do jogo
class GameState {
    constructor() {
        this.state = {
            // Progresso do jogo
            currentMission: 0,
            completedMissions: [],
            gameStarted: false,
            gameCompleted: false,
            
            // Posição do jogador
            playerPosition: {
                lat: null,
                lng: null,
                accuracy: null,
                timestamp: null
            },
            
            // Inventário
            inventory: [],
            
            // Modo mundo invertido
            upsideDownMode: false,
            
            // Permissões
            permissions: {
                camera: false,
                location: false,
                vibration: false
            },
            
            // Assets
            assets: {
                loaded: false,
                progress: 0
            },
            
            // Configurações
            settings: {
                soundEnabled: true,
                vibrationEnabled: true,
                debugMode: false
            },
            
            // Estatísticas
            stats: {
                startTime: null,
                totalDistance: 0,
                missionsCompleted: 0,
                timeSpent: 0
            }
        };
        
        // Carregar estado salvo
        this.loadState();
    }

    // Salvar estado no localStorage
    saveState() {
        try {
            const stateToSave = {
                ...this.state,
                stats: {
                    ...this.state.stats,
                    timeSpent: this.getTotalTimeSpent()
                }
            };
            
            Utils.saveToStorage('stranger-things-ar-state', stateToSave);
            Utils.log('Estado do jogo salvo');
        } catch (error) {
            Utils.log(`Erro ao salvar estado: ${error.message}`, 'error');
        }
    }

    // Carregar estado do localStorage
    loadState() {
        try {
            const savedState = Utils.loadFromStorage('stranger-things-ar-state');
            if (savedState) {
                this.state = { ...this.state, ...savedState };
                Utils.log('Estado do jogo carregado');
            }
        } catch (error) {
            Utils.log(`Erro ao carregar estado: ${error.message}`, 'error');
        }
    }

    // Resetar estado do jogo
    resetState() {
        const defaultState = {
            currentMission: 0,
            completedMissions: [],
            gameStarted: false,
            gameCompleted: false,
            playerPosition: {
                lat: null,
                lng: null,
                accuracy: null,
                timestamp: null
            },
            inventory: [],
            upsideDownMode: false,
            stats: {
                startTime: Date.now(),
                totalDistance: 0,
                missionsCompleted: 0,
                timeSpent: 0
            }
        };
        
        this.state = { ...this.state, ...defaultState };
        this.saveState();
        Utils.log('Estado do jogo resetado');
    }

    // Getters
    getCurrentMission() {
        return this.state.currentMission;
    }

    getPlayerPosition() {
        return this.state.playerPosition;
    }

    getInventory() {
        return this.state.inventory;
    }

    isUpsideDownMode() {
        return this.state.upsideDownMode;
    }

    getPermissions() {
        return this.state.permissions;
    }

    getSettings() {
        return this.state.settings;
    }

    getStats() {
        return {
            ...this.state.stats,
            timeSpent: this.getTotalTimeSpent()
        };
    }

    // Setters
    setCurrentMission(missionId) {
        this.state.currentMission = missionId;
        this.saveState();
        Utils.log(`Missão atual definida para: ${missionId}`);
    }

    setPlayerPosition(lat, lng, accuracy = null) {
        if (!Utils.isValidCoordinate(lat, lng)) {
            Utils.log('Coordenadas inválidas fornecidas', 'warn');
            return false;
        }

        const oldPosition = this.state.playerPosition;
        
        this.state.playerPosition = {
            lat,
            lng,
            accuracy,
            timestamp: Date.now()
        };

        // Calcular distância percorrida
        if (oldPosition.lat && oldPosition.lng) {
            const distance = Utils.calculateDistance(
                oldPosition.lat, oldPosition.lng,
                lat, lng
            );
            this.state.stats.totalDistance += distance;
        }

        this.saveState();
        return true;
    }

    setPermission(type, granted) {
        if (this.state.permissions.hasOwnProperty(type)) {
            this.state.permissions[type] = granted;
            this.saveState();
            Utils.log(`Permissão ${type}: ${granted ? 'concedida' : 'negada'}`);
        }
    }

    setSetting(key, value) {
        if (this.state.settings.hasOwnProperty(key)) {
            this.state.settings[key] = value;
            this.saveState();
            Utils.log(`Configuração ${key} definida para: ${value}`);
        }
    }

    // Inventário
    addToInventory(item) {
        if (!this.state.inventory.includes(item)) {
            this.state.inventory.push(item);
            this.saveState();
            Utils.log(`Item adicionado ao inventário: ${item}`);
            return true;
        }
        return false;
    }

    removeFromInventory(item) {
        const index = this.state.inventory.indexOf(item);
        if (index > -1) {
            this.state.inventory.splice(index, 1);
            this.saveState();
            Utils.log(`Item removido do inventário: ${item}`);
            return true;
        }
        return false;
    }

    hasInInventory(item) {
        return this.state.inventory.includes(item);
    }

    clearInventory() {
        this.state.inventory = [];
        this.saveState();
        Utils.log('Inventário limpo');
    }

    // Missões
    completeMission(missionId) {
        if (!this.state.completedMissions.includes(missionId)) {
            this.state.completedMissions.push(missionId);
            this.state.stats.missionsCompleted++;
            this.saveState();
            Utils.log(`Missão ${missionId} completada`);
            return true;
        }
        return false;
    }

    isMissionCompleted(missionId) {
        return this.state.completedMissions.includes(missionId);
    }

    getCompletedMissions() {
        return [...this.state.completedMissions];
    }

    // Mundo invertido
    enableUpsideDownMode() {
        this.state.upsideDownMode = true;
        this.saveState();
        Utils.log('Modo mundo invertido ativado');
    }

    disableUpsideDownMode() {
        this.state.upsideDownMode = false;
        this.saveState();
        Utils.log('Modo mundo invertido desativado');
    }

    // Jogo
    startGame() {
        this.state.gameStarted = true;
        this.state.stats.startTime = Date.now();
        this.saveState();
        Utils.log('Jogo iniciado');
    }

    completeGame() {
        this.state.gameCompleted = true;
        this.saveState();
        Utils.log('Jogo completado!');
    }

    isGameStarted() {
        return this.state.gameStarted;
    }

    isGameCompleted() {
        return this.state.gameCompleted;
    }

    // Tempo
    getTotalTimeSpent() {
        if (!this.state.stats.startTime) return 0;
        return Date.now() - this.state.stats.startTime;
    }

    getFormattedTimeSpent() {
        const totalMs = this.getTotalTimeSpent();
        const minutes = Math.floor(totalMs / 60000);
        const seconds = Math.floor((totalMs % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Debug
    enableDebugMode() {
        this.state.settings.debugMode = true;
        this.saveState();
        Utils.log('Modo debug ativado');
    }

    disableDebugMode() {
        this.state.settings.debugMode = false;
        this.saveState();
        Utils.log('Modo debug desativado');
    }

    isDebugMode() {
        return this.state.settings.debugMode;
    }

    // Exportar estado para debug
    exportState() {
        return JSON.stringify(this.state, null, 2);
    }

    // Importar estado para debug
    importState(stateJson) {
        try {
            const newState = JSON.parse(stateJson);
            this.state = { ...this.state, ...newState };
            this.saveState();
            Utils.log('Estado importado com sucesso');
            return true;
        } catch (error) {
            Utils.log(`Erro ao importar estado: ${error.message}`, 'error');
            return false;
        }
    }

    // Reset completo do jogo
    reset() {
        this.resetState();
        Utils.log('Jogo resetado completamente');
    }
}

// Exportar para uso global
window.GameState = GameState;