// Gerenciador de localização e navegação
class LocationManager {
    constructor() {
        this.currentPosition = null;
        this.targetPosition = null;
        this.watchId = null;
        this.isTracking = false;
        this.eventListeners = new Map();
        
        // Configurações de geolocalização
        this.geoOptions = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 5000
        };
        
        // Histórico de posições para cálculo de velocidade
        this.positionHistory = [];
        this.maxHistorySize = 10;
        
        // Configurações de proximidade
        this.proximityThreshold = 20; // metros
        this.lastProximityCheck = 0;
        this.proximityCheckInterval = 2000; // 2 segundos
        
        // Estado de navegação
        this.navigationState = {
            isNavigating: false,
            currentTarget: null,
            lastBearing: 0,
            lastDistance: 0,
            arrivedTargets: new Set()
        };
        
        // Filtro de posições para reduzir ruído GPS
        this.positionFilter = {
            enabled: true,
            minAccuracy: 50, // metros
            minMovement: 2, // metros mínimos para considerar movimento
            maxSpeed: 50 // m/s (180 km/h) - velocidade máxima realística
        };
    }

    async init() {
        Utils.log('Inicializando LocationManager...');
        
        try {
            // Verificar suporte à geolocalização
            if (!navigator.geolocation) {
                throw new Error('Geolocalização não suportada neste dispositivo');
            }
            
            // Testar acesso inicial à localização
            await this.getCurrentPosition();
            
            Utils.log('LocationManager inicializado com sucesso');
            
        } catch (error) {
            Utils.log(`Erro ao inicializar LocationManager: ${error.message}`, 'error');
            throw error;
        }
    }

    async getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const locationData = this.processPosition(position);
                    resolve(locationData);
                },
                (error) => {
                    const errorMessage = this.getLocationErrorMessage(error);
                    Utils.log(`Erro de geolocalização: ${errorMessage}`, 'error');
                    reject(new Error(errorMessage));
                },
                this.geoOptions
            );
        });
    }

    async startTracking() {
        if (this.isTracking) {
            Utils.log('Rastreamento já está ativo');
            return;
        }

        Utils.log('Iniciando rastreamento de localização...');
        
        try {
            // Obter posição inicial
            const initialPosition = await this.getCurrentPosition();
            this.updateCurrentPosition(initialPosition);
            
            // Iniciar rastreamento contínuo
            this.watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const locationData = this.processPosition(position);
                    this.updateCurrentPosition(locationData);
                },
                (error) => {
                    const errorMessage = this.getLocationErrorMessage(error);
                    Utils.log(`Erro no rastreamento: ${errorMessage}`, 'error');
                    this.emit('locationError', { error, message: errorMessage });
                },
                this.geoOptions
            );
            
            this.isTracking = true;
            Utils.log('Rastreamento de localização iniciado');
            this.emit('trackingStarted', { position: this.currentPosition });
            
        } catch (error) {
            Utils.log(`Erro ao iniciar rastreamento: ${error.message}`, 'error');
            throw error;
        }
    }

    stopTracking() {
        if (!this.isTracking) {
            return;
        }

        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        
        this.isTracking = false;
        this.navigationState.isNavigating = false;
        
        Utils.log('Rastreamento de localização parado');
        this.emit('trackingStopped');
    }

    processPosition(position) {
        const coords = position.coords;
        
        return {
            lat: coords.latitude,
            lng: coords.longitude,
            accuracy: coords.accuracy,
            altitude: coords.altitude,
            altitudeAccuracy: coords.altitudeAccuracy,
            heading: coords.heading,
            speed: coords.speed,
            timestamp: position.timestamp
        };
    }

    updateCurrentPosition(newPosition) {
        const previousPosition = this.currentPosition;
        
        // Aplicar filtro de posição se habilitado
        if (this.positionFilter.enabled && !this.isPositionValid(newPosition, previousPosition)) {
            Utils.log('Posição filtrada por não atender critérios de qualidade', 'warn');
            return;
        }
        
        // Atualizar posição atual
        this.currentPosition = newPosition;
        
        // Adicionar ao histórico
        this.addToPositionHistory(newPosition);
        
        // Calcular velocidade se possível
        if (previousPosition) {
            const velocity = this.calculateVelocity(previousPosition, newPosition);
            this.currentPosition.velocity = velocity;
        }
        
        // Emitir evento de atualização
        this.emit('positionUpdate', this.currentPosition);
        
        // Verificar proximidade com alvos se navegando
        if (this.navigationState.isNavigating) {
            this.checkProximity();
        }
        
        Utils.log(`Posição atualizada: ${newPosition.lat.toFixed(6)}, ${newPosition.lng.toFixed(6)} (±${Math.round(newPosition.accuracy)}m)`);
    }

    isPositionValid(newPosition, previousPosition) {
        // Verificar precisão mínima
        if (newPosition.accuracy > this.positionFilter.minAccuracy) {
            return false;
        }
        
        if (!previousPosition) {
            return true; // Primeira posição sempre válida
        }
        
        // Calcular distância desde última posição
        const distance = Utils.calculateDistance(
            previousPosition.lat, previousPosition.lng,
            newPosition.lat, newPosition.lng
        );
        
        // Verificar movimento mínimo
        if (distance < this.positionFilter.minMovement) {
            return false;
        }
        
        // Verificar velocidade máxima realística
        const timeDiff = (newPosition.timestamp - previousPosition.timestamp) / 1000; // segundos
        if (timeDiff > 0) {
            const speed = distance / timeDiff; // m/s
            if (speed > this.positionFilter.maxSpeed) {
                return false;
            }
        }
        
        return true;
    }

    addToPositionHistory(position) {
        this.positionHistory.push({
            ...position,
            timestamp: Date.now()
        });
        
        // Manter apenas as últimas posições
        if (this.positionHistory.length > this.maxHistorySize) {
            this.positionHistory.shift();
        }
    }

    calculateVelocity(prevPos, currPos) {
        const distance = Utils.calculateDistance(
            prevPos.lat, prevPos.lng,
            currPos.lat, currPos.lng
        );
        
        const timeDiff = (currPos.timestamp - prevPos.timestamp) / 1000; // segundos
        
        if (timeDiff <= 0) return 0;
        
        return {
            speed: distance / timeDiff, // m/s
            speedKmh: (distance / timeDiff) * 3.6, // km/h
            bearing: Utils.calculateBearing(prevPos.lat, prevPos.lng, currPos.lat, currPos.lng)
        };
    }

    setTarget(lat, lng, radius = 20) {
        if (!Utils.isValidCoordinate(lat, lng)) {
            throw new Error('Coordenadas de destino inválidas');
        }
        
        this.targetPosition = { lat, lng, radius };
        this.navigationState.currentTarget = this.targetPosition;
        this.navigationState.isNavigating = true;
        
        Utils.log(`Destino definido: ${lat.toFixed(6)}, ${lng.toFixed(6)} (raio: ${radius}m)`);
        this.emit('targetSet', this.targetPosition);
        
        // Verificar proximidade imediatamente
        if (this.currentPosition) {
            this.checkProximity();
        }
    }

    clearTarget() {
        this.targetPosition = null;
        this.navigationState.currentTarget = null;
        this.navigationState.isNavigating = false;
        
        Utils.log('Destino removido');
        this.emit('targetCleared');
    }

    checkProximity() {
        if (!this.currentPosition || !this.targetPosition) {
            return;
        }
        
        // Throttle de verificação de proximidade
        const now = Date.now();
        if (now - this.lastProximityCheck < this.proximityCheckInterval) {
            return;
        }
        this.lastProximityCheck = now;
        
        const distance = this.getDistanceToTarget();
        const bearing = this.getBearingToTarget();
        
        // Atualizar estado de navegação
        this.navigationState.lastDistance = distance;
        this.navigationState.lastBearing = bearing;
        
        // Emitir evento de navegação
        this.emit('navigationUpdate', {
            distance,
            bearing,
            target: this.targetPosition,
            position: this.currentPosition
        });
        
        // Verificar se chegou ao destino
        if (distance <= this.targetPosition.radius) {
            this.handleTargetReached();
        }
    }

    handleTargetReached() {
        const targetKey = `${this.targetPosition.lat},${this.targetPosition.lng}`;
        
        // Evitar múltiplas notificações para o mesmo alvo
        if (this.navigationState.arrivedTargets.has(targetKey)) {
            return;
        }
        
        this.navigationState.arrivedTargets.add(targetKey);
        
        Utils.log('Destino alcançado!');
        
        // Vibrar dispositivo
        Utils.vibrate([200, 100, 200]);
        
        // Emitir evento
        this.emit('targetReached', {
            target: this.targetPosition,
            position: this.currentPosition,
            distance: this.getDistanceToTarget()
        });
    }

    getDistanceToTarget() {
        if (!this.currentPosition || !this.targetPosition) {
            return null;
        }
        
        return Utils.calculateDistance(
            this.currentPosition.lat, this.currentPosition.lng,
            this.targetPosition.lat, this.targetPosition.lng
        );
    }

    getBearingToTarget() {
        if (!this.currentPosition || !this.targetPosition) {
            return null;
        }
        
        return Utils.calculateBearing(
            this.currentPosition.lat, this.currentPosition.lng,
            this.targetPosition.lat, this.targetPosition.lng
        );
    }

    getLocationErrorMessage(error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                return 'Permissão de localização negada pelo usuário';
            case error.POSITION_UNAVAILABLE:
                return 'Localização indisponível. Verifique se o GPS está ativado';
            case error.TIMEOUT:
                return 'Timeout ao obter localização. Tente novamente';
            default:
                return `Erro de localização desconhecido: ${error.message}`;
        }
    }

    // Obter estatísticas de navegação
    getNavigationStats() {
        if (!this.currentPosition) {
            return null;
        }
        
        const stats = {
            currentPosition: this.currentPosition,
            targetPosition: this.targetPosition,
            isTracking: this.isTracking,
            isNavigating: this.navigationState.isNavigating,
            positionHistory: this.positionHistory.length,
            accuracy: this.currentPosition.accuracy
        };
        
        if (this.targetPosition) {
            stats.distanceToTarget = this.getDistanceToTarget();
            stats.bearingToTarget = this.getBearingToTarget();
            stats.formattedDistance = Utils.formatDistance(stats.distanceToTarget);
        }
        
        return stats;
    }

    // Obter histórico de velocidades
    getVelocityHistory() {
        return this.positionHistory
            .filter(pos => pos.velocity)
            .map(pos => ({
                timestamp: pos.timestamp,
                speed: pos.velocity.speed,
                speedKmh: pos.velocity.speedKmh,
                bearing: pos.velocity.bearing
            }));
    }

    // Calcular velocidade média
    getAverageSpeed() {
        const velocities = this.getVelocityHistory();
        if (velocities.length === 0) return 0;
        
        const totalSpeed = velocities.reduce((sum, v) => sum + v.speed, 0);
        return totalSpeed / velocities.length;
    }

    // Verificar se está em movimento
    isMoving(threshold = 0.5) { // m/s
        const avgSpeed = this.getAverageSpeed();
        return avgSpeed > threshold;
    }

    // Configurar filtro de posições
    setPositionFilter(options) {
        this.positionFilter = { ...this.positionFilter, ...options };
        Utils.log('Filtro de posições atualizado', this.positionFilter);
    }

    // Configurar opções de geolocalização
    setGeoOptions(options) {
        this.geoOptions = { ...this.geoOptions, ...options };
        Utils.log('Opções de geolocalização atualizadas', this.geoOptions);
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
        this.positionHistory = [];
        this.navigationState.arrivedTargets.clear();
        Utils.log('LocationManager limpo');
    }
}

window.LocationManager = LocationManager;