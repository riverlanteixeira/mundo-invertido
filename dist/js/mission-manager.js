// Gerenciador de missões
class MissionManager {
    constructor() {
        this.missions = [];
        this.currentMissionId = 0;
        this.eventListeners = new Map();
    }

    async init() {
        Utils.log('Inicializando MissionManager...');
        Utils.log('MissionManager inicializado');
    }

    loadMissions(missions) {
        this.missions = missions;
        Utils.log(`${missions.length} missões carregadas`);
    }

    startMission(missionId) {
        this.currentMissionId = missionId;
        const mission = this.getMission(missionId);
        if (mission) {
            Utils.log(`Iniciando missão ${missionId}: ${mission.name}`);
            this.emit('missionStart', missionId);
        }
    }

    completeMission(missionId) {
        const mission = this.getMission(missionId);
        if (mission) {
            Utils.log(`Completando missão ${missionId}: ${mission.name}`);
            this.emit('missionComplete', missionId);
        }
    }

    getCurrentMission() {
        return this.getMission(this.currentMissionId);
    }

    getMission(missionId) {
        return this.missions.find(mission => mission.id === missionId);
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
        this.eventListeners.clear();
    }
}

window.MissionManager = MissionManager;