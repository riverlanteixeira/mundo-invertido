// Sistema de tratamento de erros e fallbacks
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.fallbackModes = {
            location: false,
            ar: false,
            audio: false
        };
        
        // Configurações de retry
        this.retryConfig = {
            maxRetries: 3,
            retryDelay: 1000,
            backoffMultiplier: 2
        };
        
        // Contadores de erro por tipo
        this.errorCounts = new Map();
        
        // Callbacks para diferentes tipos de erro
        this.errorCallbacks = new Map();
        
        // Estado de degradação
        this.degradedMode = {
            active: false,
            reason: null,
            limitations: []
        };
        
        this.setupGlobalErrorHandlers();
    }

    setupGlobalErrorHandlers() {
        // Capturar erros JavaScript não tratados
        window.addEventListener('error', (event) => {
            this.handleGlobalError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                timestamp: Date.now()
            });
        });

        // Capturar promises rejeitadas não tratadas
        window.addEventListener('unhandledrejection', (event) => {
            this.handleGlobalError({
                type: 'promise',
                message: event.reason?.message || 'Promise rejeitada',
                reason: event.reason,
                timestamp: Date.now()
            });
        });

        Utils.log('Handlers globais de erro configurados');
    }

    handleGlobalError(errorInfo) {
        this.logError(errorInfo);
        
        // Determinar se é um erro crítico
        if (this.isCriticalError(errorInfo)) {
            this.handleCriticalError(errorInfo);
        }
    }

    isCriticalError(errorInfo) {
        const criticalPatterns = [
            /camera/i,
            /geolocation/i,
            /webgl/i,
            /ar\.js/i,
            /a-frame/i,
            /permission/i
        ];
        
        const message = errorInfo.message || '';
        return criticalPatterns.some(pattern => pattern.test(message));
    }

    handleCriticalError(errorInfo) {
        Utils.log(`Erro crítico detectado: ${errorInfo.message}`, 'error');
        
        // Ativar modo degradado se não estiver ativo
        if (!this.degradedMode.active) {
            this.activateDegradedMode(errorInfo.message);
        }
        
        // Notificar callbacks registrados
        this.notifyErrorCallbacks('critical', errorInfo);
    }

    // Tratamento específico para erros de geolocalização
    handleLocationError(error, context = {}) {
        const errorInfo = {
            type: 'geolocation',
            code: error.code,
            message: error.message,
            context,
            timestamp: Date.now()
        };
        
        this.logError(errorInfo);
        this.incrementErrorCount('geolocation');
        
        // Determinar estratégia de fallback baseada no tipo de erro
        switch (error.code) {
            case 1: // PERMISSION_DENIED
                return this.handleLocationPermissionDenied(errorInfo);
            case 2: // POSITION_UNAVAILABLE
                return this.handleLocationUnavailable(errorInfo);
            case 3: // TIMEOUT
                return this.handleLocationTimeout(errorInfo);
            default:
                return this.handleGenericLocationError(errorInfo);
        }
    }

    handleLocationPermissionDenied(errorInfo) {
        Utils.log('Permissão de localização negada - ativando fallback', 'warn');
        
        this.fallbackModes.location = true;
        
        // Mostrar modal explicativo
        this.showLocationFallbackModal();
        
        // Ativar modo de localização manual
        return this.activateManualLocationMode();
    }

    handleLocationUnavailable(errorInfo) {
        Utils.log('Localização indisponível - tentando fallbacks', 'warn');
        
        // Tentar métodos alternativos de localização
        return this.tryAlternativeLocationMethods();
    }

    handleLocationTimeout(errorInfo) {
        Utils.log('Timeout de localização - implementando retry', 'warn');
        
        // Implementar retry com backoff
        return this.retryLocationWithBackoff(errorInfo);
    }

    handleGenericLocationError(errorInfo) {
        Utils.log(`Erro genérico de localização: ${errorInfo.message}`, 'error');
        
        // Ativar modo degradado
        this.activateDegradedMode('Erro de localização');
        
        return {
            success: false,
            fallbackActive: true,
            message: 'Localização indisponível. Usando modo degradado.'
        };
    }

    // Tratamento específico para erros de AR
    handleARError(error, context = {}) {
        const errorInfo = {
            type: 'ar',
            message: error.message || 'Erro de AR desconhecido',
            context,
            timestamp: Date.now()
        };
        
        this.logError(errorInfo);
        this.incrementErrorCount('ar');
        
        // Determinar tipo de erro AR
        if (this.isCameraError(error)) {
            return this.handleCameraError(errorInfo);
        } else if (this.isWebGLError(error)) {
            return this.handleWebGLError(errorInfo);
        } else if (this.isARJSError(error)) {
            return this.handleARJSError(errorInfo);
        } else {
            return this.handleGenericARError(errorInfo);
        }
    }

    isCameraError(error) {
        const message = error.message || '';
        return /camera|video|stream|media/i.test(message);
    }

    isWebGLError(error) {
        const message = error.message || '';
        return /webgl|context|gl/i.test(message);
    }

    isARJSError(error) {
        const message = error.message || '';
        return /ar\.js|arjs|marker|tracking/i.test(message);
    }

    handleCameraError(errorInfo) {
        Utils.log('Erro de câmera detectado - ativando fallback', 'error');
        
        this.fallbackModes.ar = true;
        
        // Mostrar modal de erro de câmera
        this.showCameraErrorModal();
        
        // Ativar modo sem AR
        return this.activateNoARMode();
    }

    handleWebGLError(errorInfo) {
        Utils.log('Erro de WebGL detectado - dispositivo incompatível', 'error');
        
        // Ativar modo de compatibilidade
        return this.activateCompatibilityMode();
    }

    handleARJSError(errorInfo) {
        Utils.log('Erro do AR.js detectado - tentando reinicialização', 'warn');
        
        // Tentar reinicializar AR.js
        return this.retryARInitialization();
    }

    handleGenericARError(errorInfo) {
        Utils.log(`Erro genérico de AR: ${errorInfo.message}`, 'error');
        
        this.fallbackModes.ar = true;
        
        // Ativar modo degradado
        this.activateDegradedMode('Erro de realidade aumentada');
        
        return {
            success: false,
            fallbackActive: true,
            message: 'AR indisponível. Usando modo alternativo.'
        };
    }

    // Implementar retry com backoff exponencial
    async retryWithBackoff(operation, context = {}) {
        const { maxRetries, retryDelay, backoffMultiplier } = this.retryConfig;
        let currentDelay = retryDelay;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                Utils.log(`Tentativa ${attempt}/${maxRetries} para: ${context.operation || 'operação'}`);
                
                const result = await operation();
                
                Utils.log(`Operação bem-sucedida na tentativa ${attempt}`);
                return { success: true, result, attempts: attempt };
                
            } catch (error) {
                Utils.log(`Tentativa ${attempt} falhou: ${error.message}`, 'warn');
                
                if (attempt === maxRetries) {
                    Utils.log(`Todas as ${maxRetries} tentativas falharam`, 'error');
                    throw error;
                }
                
                // Aguardar antes da próxima tentativa
                await new Promise(resolve => setTimeout(resolve, currentDelay));
                currentDelay *= backoffMultiplier;
            }
        }
    }

    async retryLocationWithBackoff(errorInfo) {
        try {
            const result = await this.retryWithBackoff(
                () => this.getCurrentLocationPromise(),
                { operation: 'obter localização' }
            );
            
            return {
                success: true,
                position: result.result,
                message: `Localização obtida após ${result.attempts} tentativas`
            };
            
        } catch (error) {
            Utils.log('Falha ao obter localização após múltiplas tentativas', 'error');
            return this.handleLocationUnavailable(errorInfo);
        }
    }

    getCurrentLocationPromise() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 30000
                }
            );
        });
    }

    async retryARInitialization() {
        try {
            const result = await this.retryWithBackoff(
                () => this.reinitializeAR(),
                { operation: 'inicializar AR' }
            );
            
            return {
                success: true,
                message: `AR reinicializado após ${result.attempts} tentativas`
            };
            
        } catch (error) {
            Utils.log('Falha ao reinicializar AR após múltiplas tentativas', 'error');
            return this.activateNoARMode();
        }
    }

    async reinitializeAR() {
        // Limpar scene AR existente
        const scene = document.getElementById('ar-scene');
        if (scene) {
            // Remover todos os elementos filhos exceto câmera
            const camera = scene.querySelector('#ar-camera');
            scene.innerHTML = '';
            if (camera) {
                scene.appendChild(camera);
            }
        }
        
        // Tentar reinicializar
        if (window.arManager) {
            await window.arManager.init();
        }
        
        return true;
    }

    // Modos de fallback específicos
    activateManualLocationMode() {
        Utils.log('Ativando modo de localização manual');
        
        this.showManualLocationInterface();
        
        return {
            success: true,
            fallbackActive: true,
            mode: 'manual_location',
            message: 'Modo de localização manual ativado'
        };
    }

    async tryAlternativeLocationMethods() {
        Utils.log('Tentando métodos alternativos de localização');
        
        // Tentar com configurações menos restritivas
        const fallbackOptions = [
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
            { enableHighAccuracy: false, timeout: 30000, maximumAge: 300000 },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        ];
        
        for (const options of fallbackOptions) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, options);
                });
                
                Utils.log('Localização obtida com configurações alternativas');
                return {
                    success: true,
                    position,
                    message: 'Localização obtida com precisão reduzida'
                };
                
            } catch (error) {
                Utils.log(`Método alternativo falhou: ${error.message}`, 'warn');
            }
        }
        
        // Se todos os métodos falharam, ativar modo manual
        return this.activateManualLocationMode();
    }

    activateNoARMode() {
        Utils.log('Ativando modo sem AR');
        
        this.fallbackModes.ar = true;
        
        // Ocultar elementos AR
        const arScene = document.getElementById('ar-scene');
        if (arScene) {
            arScene.style.display = 'none';
        }
        
        // Mostrar interface alternativa
        this.showNoARInterface();
        
        return {
            success: true,
            fallbackActive: true,
            mode: 'no_ar',
            message: 'Modo sem AR ativado. Usando interface alternativa.'
        };
    }

    activateCompatibilityMode() {
        Utils.log('Ativando modo de compatibilidade');
        
        // Desabilitar recursos avançados
        this.fallbackModes.ar = true;
        
        // Configurar interface simplificada
        this.setupSimplifiedInterface();
        
        return {
            success: true,
            fallbackActive: true,
            mode: 'compatibility',
            message: 'Modo de compatibilidade ativado para dispositivos limitados.'
        };
    }

    activateDegradedMode(reason) {
        if (this.degradedMode.active) {
            return; // Já está em modo degradado
        }
        
        Utils.log(`Ativando modo degradado: ${reason}`, 'warn');
        
        this.degradedMode.active = true;
        this.degradedMode.reason = reason;
        this.degradedMode.limitations = this.getDegradedModeLimitations();
        
        // Mostrar notificação ao usuário
        this.showDegradedModeNotification();
        
        // Configurar interface degradada
        this.setupDegradedInterface();
        
        // Notificar outros sistemas
        this.notifyErrorCallbacks('degraded_mode', {
            reason,
            limitations: this.degradedMode.limitations
        });
    }

    getDegradedModeLimitations() {
        const limitations = [];
        
        if (this.fallbackModes.location) {
            limitations.push('Navegação GPS limitada');
        }
        
        if (this.fallbackModes.ar) {
            limitations.push('Realidade aumentada indisponível');
        }
        
        if (this.fallbackModes.audio) {
            limitations.push('Áudio limitado');
        }
        
        return limitations;
    }

    // Interfaces de fallback
    showLocationFallbackModal() {
        const modal = this.createErrorModal({
            title: '📍 Localização Indisponível',
            message: 'Não foi possível acessar sua localização automaticamente.',
            type: 'location_fallback',
            actions: [
                {
                    text: 'Inserir Localização Manual',
                    action: () => this.showManualLocationInterface(),
                    primary: true
                },
                {
                    text: 'Tentar Novamente',
                    action: () => location.reload()
                }
            ]
        });
        
        document.body.appendChild(modal);
    }

    showCameraErrorModal() {
        const modal = this.createErrorModal({
            title: '📷 Câmera Indisponível',
            message: 'Não foi possível acessar a câmera. O jogo continuará sem realidade aumentada.',
            type: 'camera_error',
            actions: [
                {
                    text: 'Continuar sem AR',
                    action: () => this.activateNoARMode(),
                    primary: true
                },
                {
                    text: 'Verificar Permissões',
                    action: () => this.showPermissionInstructions()
                }
            ]
        });
        
        document.body.appendChild(modal);
    }

    showManualLocationInterface() {
        // Remover modal existente
        const existingModal = document.getElementById('error-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const interface = document.createElement('div');
        interface.id = 'manual-location-interface';
        interface.className = 'manual-location-interface';
        interface.innerHTML = `
            <div class="manual-location-content">
                <h3>📍 Localização Manual</h3>
                <p>Selecione sua localização atual no bairro Pedra Branca:</p>
                
                <div class="location-options">
                    <button class="location-option" data-lat="-27.63054776462635" data-lng="-48.681133649550205">
                        🌲 Floresta das Trevas
                    </button>
                    <button class="location-option" data-lat="-27.630903061716687" data-lng="-48.67974685847095">
                        🏠 Casa do Will
                    </button>
                    <button class="location-option" data-lat="-27.62568754766323" data-lng="-48.679824079211336">
                        🏪 Loja Melvald's
                    </button>
                    <button class="location-option" data-lat="-27.624056768580015" data-lng="-48.68124296486716">
                        🏢 Laboratório Hawkins
                    </button>
                </div>
                
                <div class="manual-location-buttons">
                    <button class="manual-location-button close-button">Fechar</button>
                </div>
            </div>
        `;
        
        // Adicionar estilos
        this.addManualLocationStyles();
        
        // Event listeners
        interface.querySelectorAll('.location-option').forEach(button => {
            button.addEventListener('click', (e) => {
                const lat = parseFloat(e.target.dataset.lat);
                const lng = parseFloat(e.target.dataset.lng);
                this.setManualLocation(lat, lng);
                interface.remove();
            });
        });
        
        interface.querySelector('.close-button').addEventListener('click', () => {
            interface.remove();
        });
        
        document.body.appendChild(interface);
    }

    setManualLocation(lat, lng) {
        Utils.log(`Localização manual definida: ${lat}, ${lng}`);
        
        // Simular posição GPS
        const manualPosition = {
            lat,
            lng,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
            timestamp: Date.now(),
            manual: true
        };
        
        // Notificar sistema de localização
        if (window.locationManager) {
            window.locationManager.updateCurrentPosition(manualPosition);
        }
        
        // Mostrar confirmação
        this.showSuccessMessage('Localização manual definida com sucesso!');
    }

    showNoARInterface() {
        // Criar interface alternativa sem AR
        const noARInterface = document.createElement('div');
        noARInterface.id = 'no-ar-interface';
        noARInterface.className = 'no-ar-interface';
        noARInterface.innerHTML = `
            <div class="no-ar-content">
                <div class="no-ar-header">
                    <h3>🎮 Modo Alternativo</h3>
                    <p>Realidade aumentada indisponível. Usando interface simplificada.</p>
                </div>
                
                <div class="mission-info">
                    <div class="current-mission">
                        <h4 id="no-ar-mission-title">Carregando missão...</h4>
                        <p id="no-ar-mission-description">Aguarde...</p>
                    </div>
                    
                    <div class="mission-actions">
                        <button id="no-ar-complete-mission" class="mission-button">
                            Completar Missão
                        </button>
                        <button id="no-ar-skip-mission" class="mission-button secondary">
                            Pular Missão
                        </button>
                    </div>
                </div>
                
                <div class="no-ar-status">
                    <div class="status-item">
                        <span class="status-label">Localização:</span>
                        <span id="no-ar-location-status">Verificando...</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Distância:</span>
                        <span id="no-ar-distance-status">Calculando...</span>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar estilos
        this.addNoARStyles();
        
        // Event listeners
        noARInterface.querySelector('#no-ar-complete-mission').addEventListener('click', () => {
            this.completeCurrentMissionNoAR();
        });
        
        noARInterface.querySelector('#no-ar-skip-mission').addEventListener('click', () => {
            this.skipCurrentMission();
        });
        
        // Inserir na interface principal
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.appendChild(noARInterface);
        }
    }

    setupSimplifiedInterface() {
        Utils.log('Configurando interface simplificada');
        
        // Desabilitar animações CSS
        const style = document.createElement('style');
        style.textContent = `
            * {
                animation: none !important;
                transition: none !important;
            }
            
            .simplified-mode {
                font-size: 16px;
                line-height: 1.4;
            }
            
            .simplified-button {
                padding: 15px 30px;
                font-size: 18px;
                border: 2px solid #fff;
                background: #333;
                color: #fff;
                margin: 10px;
            }
        `;
        
        document.head.appendChild(style);
        document.body.classList.add('simplified-mode');
    }

    setupDegradedInterface() {
        Utils.log('Configurando interface degradada');
        
        // Adicionar indicador de modo degradado
        const indicator = document.createElement('div');
        indicator.id = 'degraded-mode-indicator';
        indicator.className = 'degraded-mode-indicator';
        indicator.innerHTML = `
            <div class="degraded-indicator-content">
                <span class="degraded-icon">⚠️</span>
                <span class="degraded-text">Modo Limitado</span>
                <button class="degraded-info-button" onclick="this.parentElement.parentElement.classList.toggle('expanded')">
                    ℹ️
                </button>
            </div>
            <div class="degraded-details">
                <p><strong>Limitações ativas:</strong></p>
                <ul>
                    ${this.degradedMode.limitations.map(limitation => `<li>${limitation}</li>`).join('')}
                </ul>
                <p><strong>Motivo:</strong> ${this.degradedMode.reason}</p>
            </div>
        `;
        
        // Adicionar estilos
        this.addDegradedModeStyles();
        
        document.body.appendChild(indicator);
    }

    // Utilitários para criação de modais
    createErrorModal({ title, message, type, actions = [] }) {
        const modal = document.createElement('div');
        modal.id = 'error-modal';
        modal.className = `error-modal ${type}`;
        
        const actionsHTML = actions.map(action => 
            `<button class="error-modal-button ${action.primary ? 'primary' : ''}" 
                     data-action="${actions.indexOf(action)}">
                ${action.text}
            </button>`
        ).join('');
        
        modal.innerHTML = `
            <div class="error-modal-content">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="error-modal-actions">
                    ${actionsHTML}
                </div>
            </div>
        `;
        
        // Event listeners para ações
        actions.forEach((action, index) => {
            const button = modal.querySelector(`[data-action="${index}"]`);
            button.addEventListener('click', () => {
                modal.remove();
                if (action.action) {
                    action.action();
                }
            });
        });
        
        // Adicionar estilos se não existirem
        this.addErrorModalStyles();
        
        return modal;
    }

    // Métodos de utilidade
    logError(errorInfo) {
        this.errorLog.push(errorInfo);
        
        // Manter tamanho do log
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }
        
        // Log no console
        Utils.log(`[${errorInfo.type}] ${errorInfo.message}`, 'error');
    }

    incrementErrorCount(type) {
        const current = this.errorCounts.get(type) || 0;
        this.errorCounts.set(type, current + 1);
    }

    getErrorCount(type) {
        return this.errorCounts.get(type) || 0;
    }

    onError(type, callback) {
        if (!this.errorCallbacks.has(type)) {
            this.errorCallbacks.set(type, []);
        }
        this.errorCallbacks.get(type).push(callback);
    }

    notifyErrorCallbacks(type, data) {
        if (this.errorCallbacks.has(type)) {
            this.errorCallbacks.get(type).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    Utils.log(`Erro no callback de erro: ${error.message}`, 'error');
                }
            });
        }
    }

    showSuccessMessage(message) {
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.textContent = message;
        
        const style = document.createElement('style');
        style.textContent = `
            .success-notification {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #4CAF50;
                color: white;
                padding: 15px 25px;
                border-radius: 5px;
                z-index: 10000;
                animation: slideDown 0.3s ease;
            }
            
            @keyframes slideDown {
                from { transform: translateX(-50%) translateY(-100%); }
                to { transform: translateX(-50%) translateY(0); }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 3000);
    }

    showDegradedModeNotification() {
        const notification = document.createElement('div');
        notification.className = 'degraded-notification';
        notification.innerHTML = `
            <div class="degraded-notification-content">
                <h4>⚠️ Modo Limitado Ativado</h4>
                <p>${this.degradedMode.reason}</p>
                <p>Algumas funcionalidades podem estar indisponíveis.</p>
                <button class="degraded-notification-close">Entendi</button>
            </div>
        `;
        
        notification.querySelector('.degraded-notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        this.addDegradedNotificationStyles();
        document.body.appendChild(notification);
        
        // Auto-remover após 10 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }

    // Métodos específicos para modo sem AR
    completeCurrentMissionNoAR() {
        Utils.log('Completando missão em modo sem AR');
        
        if (window.missionManager) {
            const currentMission = window.missionManager.getCurrentMission();
            if (currentMission) {
                window.missionManager.completeMission(currentMission.id);
                this.showSuccessMessage(`Missão "${currentMission.name}" completada!`);
            }
        }
    }

    skipCurrentMission() {
        Utils.log('Pulando missão atual');
        
        if (window.missionManager) {
            const currentMission = window.missionManager.getCurrentMission();
            if (currentMission) {
                window.missionManager.skipMission(currentMission.id);
                this.showSuccessMessage(`Missão "${currentMission.name}" pulada!`);
            }
        }
    }

    // Obter estatísticas de erro
    getErrorStats() {
        return {
            totalErrors: this.errorLog.length,
            errorsByType: Object.fromEntries(this.errorCounts),
            recentErrors: this.errorLog.slice(-10),
            fallbackModes: { ...this.fallbackModes },
            degradedMode: { ...this.degradedMode }
        };
    }

    // Limpar recursos
    cleanup() {
        this.errorLog = [];
        this.errorCounts.clear();
        this.errorCallbacks.clear();
        
        // Remover elementos de interface
        const elements = [
            '#error-modal',
            '#manual-location-interface',
            '#no-ar-interface',
            '#degraded-mode-indicator',
            '.degraded-notification'
        ];
        
        elements.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.remove();
            }
        });
        
        Utils.log('ErrorHandler limpo');
    }
}   
 // Estilos CSS para interfaces de erro
    addErrorModalStyles() {
        if (document.getElementById('error-modal-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'error-modal-styles';
        style.textContent = `
            .error-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }
            
            .error-modal-content {
                background: #1a1a1a;
                border: 2px solid #ff6b6b;
                border-radius: 15px;
                padding: 2rem;
                max-width: 90%;
                width: 400px;
                text-align: center;
                animation: slideUp 0.3s ease;
            }
            
            .error-modal-content h3 {
                color: #ff6b6b;
                margin-bottom: 1rem;
                font-size: 1.5rem;
            }
            
            .error-modal-content p {
                color: #ccc;
                margin-bottom: 1.5rem;
                line-height: 1.5;
            }
            
            .error-modal-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
                flex-wrap: wrap;
            }
            
            .error-modal-button {
                background: #666;
                border: none;
                color: white;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1rem;
                transition: background 0.3s ease;
                min-width: 120px;
            }
            
            .error-modal-button:hover {
                background: #555;
            }
            
            .error-modal-button.primary {
                background: #ff6b6b;
            }
            
            .error-modal-button.primary:hover {
                background: #ff5252;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        
        document.head.appendChild(style);
    }

    addManualLocationStyles() {
        if (document.getElementById('manual-location-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'manual-location-styles';
        style.textContent = `
            .manual-location-interface {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }
            
            .manual-location-content {
                background: #1a1a1a;
                border: 2px solid #4CAF50;
                border-radius: 15px;
                padding: 2rem;
                max-width: 90%;
                width: 500px;
                text-align: center;
            }
            
            .manual-location-content h3 {
                color: #4CAF50;
                margin-bottom: 1rem;
                font-size: 1.5rem;
            }
            
            .manual-location-content p {
                color: #ccc;
                margin-bottom: 2rem;
                line-height: 1.5;
            }
            
            .location-options {
                display: grid;
                grid-template-columns: 1fr;
                gap: 1rem;
                margin-bottom: 2rem;
            }
            
            .location-option {
                background: #333;
                border: 2px solid #4CAF50;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1rem;
                transition: all 0.3s ease;
                text-align: left;
            }
            
            .location-option:hover {
                background: #4CAF50;
                transform: translateY(-2px);
            }
            
            .manual-location-buttons {
                display: flex;
                justify-content: center;
            }
            
            .manual-location-button {
                background: #666;
                border: none;
                color: white;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1rem;
                transition: background 0.3s ease;
            }
            
            .manual-location-button:hover {
                background: #555;
            }
        `;
        
        document.head.appendChild(style);
    }

    addNoARStyles() {
        if (document.getElementById('no-ar-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'no-ar-styles';
        style.textContent = `
            .no-ar-interface {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            
            .no-ar-content {
                background: rgba(0, 0, 0, 0.8);
                border: 2px solid #ff6b6b;
                border-radius: 15px;
                padding: 2rem;
                max-width: 90%;
                width: 400px;
                text-align: center;
            }
            
            .no-ar-header h3 {
                color: #ff6b6b;
                margin-bottom: 0.5rem;
                font-size: 1.5rem;
            }
            
            .no-ar-header p {
                color: #ccc;
                margin-bottom: 2rem;
                font-size: 0.9rem;
            }
            
            .mission-info {
                margin-bottom: 2rem;
            }
            
            .current-mission {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
            }
            
            .current-mission h4 {
                color: #fff;
                margin-bottom: 0.5rem;
                font-size: 1.2rem;
            }
            
            .current-mission p {
                color: #ccc;
                font-size: 0.9rem;
                line-height: 1.4;
            }
            
            .mission-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
                flex-wrap: wrap;
            }
            
            .mission-button {
                background: #ff6b6b;
                border: none;
                color: white;
                padding: 12px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1rem;
                transition: all 0.3s ease;
                min-width: 120px;
            }
            
            .mission-button:hover {
                background: #ff5252;
                transform: translateY(-2px);
            }
            
            .mission-button.secondary {
                background: #666;
            }
            
            .mission-button.secondary:hover {
                background: #555;
            }
            
            .no-ar-status {
                border-top: 1px solid #333;
                padding-top: 1.5rem;
            }
            
            .status-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.5rem;
                font-size: 0.9rem;
            }
            
            .status-label {
                color: #ccc;
            }
            
            .status-item span:last-child {
                color: #fff;
                font-weight: bold;
            }
        `;
        
        document.head.appendChild(style);
    }

    addDegradedModeStyles() {
        if (document.getElementById('degraded-mode-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'degraded-mode-styles';
        style.textContent = `
            .degraded-mode-indicator {
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(255, 193, 7, 0.9);
                color: #000;
                border-radius: 8px;
                padding: 8px 12px;
                z-index: 9999;
                font-size: 0.9rem;
                cursor: pointer;
                transition: all 0.3s ease;
                max-width: 200px;
            }
            
            .degraded-mode-indicator:hover {
                background: rgba(255, 193, 7, 1);
            }
            
            .degraded-indicator-content {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .degraded-icon {
                font-size: 1.2rem;
            }
            
            .degraded-text {
                font-weight: bold;
                flex: 1;
            }
            
            .degraded-info-button {
                background: none;
                border: none;
                font-size: 1rem;
                cursor: pointer;
                padding: 0;
                color: #000;
            }
            
            .degraded-details {
                display: none;
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid rgba(0, 0, 0, 0.2);
                font-size: 0.8rem;
                line-height: 1.4;
            }
            
            .degraded-mode-indicator.expanded .degraded-details {
                display: block;
            }
            
            .degraded-details ul {
                margin: 5px 0;
                padding-left: 15px;
            }
            
            .degraded-details li {
                margin-bottom: 3px;
            }
        `;
        
        document.head.appendChild(style);
    }

    addDegradedNotificationStyles() {
        if (document.getElementById('degraded-notification-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'degraded-notification-styles';
        style.textContent = `
            .degraded-notification {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 193, 7, 0.95);
                color: #000;
                border-radius: 10px;
                padding: 0;
                z-index: 10001;
                max-width: 90%;
                width: 350px;
                animation: bounceIn 0.5s ease;
            }
            
            .degraded-notification-content {
                padding: 1.5rem;
                text-align: center;
            }
            
            .degraded-notification-content h4 {
                margin: 0 0 1rem 0;
                font-size: 1.2rem;
            }
            
            .degraded-notification-content p {
                margin: 0.5rem 0;
                line-height: 1.4;
            }
            
            .degraded-notification-close {
                background: #000;
                color: #fff;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1rem;
                margin-top: 1rem;
                transition: background 0.3s ease;
            }
            
            .degraded-notification-close:hover {
                background: #333;
            }
            
            @keyframes bounceIn {
                0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.05); }
                70% { transform: translate(-50%, -50%) scale(0.9); }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
        `;
        
        document.head.appendChild(style);
    }

    showPermissionInstructions() {
        const modal = this.createErrorModal({
            title: '🔧 Verificar Permissões',
            message: 'Siga estas instruções para verificar as permissões do navegador:',
            type: 'permission_instructions',
            actions: [
                {
                    text: 'Entendi',
                    action: () => {},
                    primary: true
                }
            ]
        });
        
        // Adicionar instruções detalhadas
        const instructions = document.createElement('div');
        instructions.className = 'permission-instructions-detailed';
        instructions.innerHTML = `
            <div class="instruction-section">
                <h4>📷 Para Câmera:</h4>
                <ol>
                    <li>Clique no ícone de câmera na barra de endereços</li>
                    <li>Selecione "Permitir"</li>
                    <li>Recarregue a página</li>
                </ol>
            </div>
            
            <div class="instruction-section">
                <h4>📍 Para Localização:</h4>
                <ol>
                    <li>Clique no ícone de localização na barra de endereços</li>
                    <li>Selecione "Permitir"</li>
                    <li>Certifique-se que o GPS está ativado</li>
                </ol>
            </div>
            
            <div class="instruction-section">
                <h4>⚙️ Configurações do Navegador:</h4>
                <ol>
                    <li>Acesse as configurações do site</li>
                    <li>Procure por "Permissões"</li>
                    <li>Ative câmera e localização</li>
                </ol>
            </div>
        `;
        
        // Adicionar estilos para instruções
        const instructionStyles = document.createElement('style');
        instructionStyles.textContent = `
            .permission-instructions-detailed {
                text-align: left;
                margin: 1rem 0;
            }
            
            .instruction-section {
                margin-bottom: 1.5rem;
            }
            
            .instruction-section h4 {
                color: #4CAF50;
                margin-bottom: 0.5rem;
                font-size: 1rem;
            }
            
            .instruction-section ol {
                color: #ccc;
                padding-left: 1.2rem;
                line-height: 1.6;
            }
            
            .instruction-section li {
                margin-bottom: 0.3rem;
            }
        `;
        
        document.head.appendChild(instructionStyles);
        
        // Inserir instruções no modal
        const modalContent = modal.querySelector('.error-modal-content');
        const actions = modalContent.querySelector('.error-modal-actions');
        modalContent.insertBefore(instructions, actions);
        
        document.body.appendChild(modal);
    }
}

// Exportar para uso global
window.ErrorHandler = ErrorHandler;    // 
Limpar recursos
    cleanup() {
        this.errorLog = [];
        this.errorCounts.clear();
        this.errorCallbacks.clear();
        
        // Remover elementos de interface
        const elements = [
            '#error-modal',
            '#manual-location-interface',
            '#no-ar-interface',
            '#degraded-mode-indicator'
        ];
        
        elements.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.remove();
            }
        });
        
        Utils.log('ErrorHandler limpo');
    }

    // Métodos de estilo (implementação simplificada)
    addErrorModalStyles() {
        if (document.getElementById('error-modal-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'error-modal-styles';
        style.textContent = `
            .error-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            .error-modal-content {
                background: #fff;
                padding: 2rem;
                border-radius: 10px;
                max-width: 400px;
                text-align: center;
            }
            .error-modal-button {
                padding: 10px 20px;
                margin: 5px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            }
            .error-modal-button.primary {
                background: #007bff;
                color: white;
            }
        `;
        document.head.appendChild(style);
    }

    addManualLocationStyles() {
        if (document.getElementById('manual-location-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'manual-location-styles';
        style.textContent = `
            .manual-location-interface {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
            }
            .manual-location-content {
                background: #fff;
                padding: 2rem;
                border-radius: 10px;
                max-width: 500px;
                text-align: center;
            }
            .location-option {
                display: block;
                width: 100%;
                padding: 15px;
                margin: 10px 0;
                border: 2px solid #007bff;
                background: white;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            }
            .location-option:hover {
                background: #007bff;
                color: white;
            }
        `;
        document.head.appendChild(style);
    }

    addNoARStyles() {
        if (document.getElementById('no-ar-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'no-ar-styles';
        style.textContent = `
            .no-ar-interface {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 2rem;
                z-index: 1000;
            }
            .mission-button {
                padding: 15px 30px;
                margin: 10px;
                border: 2px solid #fff;
                background: transparent;
                color: white;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            }
            .mission-button:hover {
                background: white;
                color: black;
            }
        `;
        document.head.appendChild(style);
    }

    addDegradedModeStyles() {
        if (document.getElementById('degraded-mode-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'degraded-mode-styles';
        style.textContent = `
            .degraded-mode-indicator {
                position: fixed;
                top: 10px;
                right: 10px;
                background: #ffc107;
                color: black;
                padding: 10px;
                border-radius: 5px;
                z-index: 9999;
                cursor: pointer;
            }
            .degraded-details {
                display: none;
                margin-top: 10px;
                padding: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                border-radius: 5px;
            }
            .degraded-mode-indicator.expanded .degraded-details {
                display: block;
            }
        `;
        document.head.appendChild(style);
    }

    addDegradedNotificationStyles() {
        if (document.getElementById('degraded-notification-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'degraded-notification-styles';
        style.textContent = `
            .degraded-notification {
                position: fixed;
                top: 20px;
                left: 20px;
                right: 20px;
                background: #ffc107;
                color: black;
                padding: 1rem;
                border-radius: 10px;
                z-index: 10000;
                text-align: center;
            }
            .degraded-notification-close {
                background: black;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 10px;
            }
        `;
        document.head.appendChild(style);
    }

    showPermissionInstructions() {
        const modal = this.createErrorModal({
            title: '🔧 Verificar Permissões',
            message: 'Verifique se as permissões de câmera e localização estão habilitadas nas configurações do navegador.',
            type: 'permission_instructions',
            actions: [
                {
                    text: 'Entendi',
                    action: () => {},
                    primary: true
                }
            ]
        });
        
        document.body.appendChild(modal);
    }
}