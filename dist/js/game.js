// Classe principal do jogo Stranger Things AR
class StrangerThingsGame {
    constructor() {
        this.state = new GameState();
        this.audioManager = null;
        this.locationManager = null;
        this.arManager = null;
        this.missionManager = null;
        this.permissionHandler = null;
        this.inventoryManager = null;
        this.upsideDownManager = null;
        this.performanceManager = null;
        this.errorHandler = null;
        
        this.initialized = false;
        this.currentScreen = 'loading-screen';
        
        // Elementos DOM
        this.elements = {
            loadingProgress: document.getElementById('loading-progress'),
            loadingText: document.getElementById('loading-text'),
            callInterface: document.getElementById('call-interface'),
            dustinImage: document.getElementById('dustin-image'),
            answerCall: document.getElementById('answer-call'),
            navigationArrow: document.getElementById('navigation-arrow'),
            arScene: document.getElementById('ar-scene'),
            missionTitle: document.getElementById('mission-title'),
            missionDescription: document.getElementById('mission-description'),
            distanceText: document.getElementById('distance-text'),
            upsideDownFilter: document.getElementById('upside-down-filter'),
            inventoryItems: document.querySelector('.inventory-items')
        };
    }

    async init() {
        Utils.log('Inicializando Stranger Things Game...');
        
        try {
            // Verificar suporte do dispositivo
            const support = Utils.checkSupport();
            this.validateDeviceSupport(support);
            
            // Inicializar gerenciadores
            await this.initializeManagers();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Carregar configurações de missões
            this.loadMissionConfigurations();
            
            this.initialized = true;
            Utils.log('Jogo inicializado com sucesso');
            
        } catch (error) {
            Utils.log(`Erro ao inicializar jogo: ${error.message}`, 'error');
            throw error;
        }
    }

    validateDeviceSupport(support) {
        const required = ['geolocation', 'camera', 'webgl'];
        const missing = required.filter(feature => !support[feature]);
        
        if (missing.length > 0) {
            throw new Error(`Recursos não suportados: ${missing.join(', ')}`);
        }
        
        Utils.log('Suporte do dispositivo validado');
    }

    async initializeManagers() {
        // Inicializar gerenciadores na ordem correta
        this.errorHandler = new ErrorHandler();
        this.permissionHandler = new PermissionHandler();
        this.performanceManager = new PerformanceManager();
        this.audioManager = new AudioManager();
        this.locationManager = new LocationManager();
        this.arManager = new ARManager();
        this.missionManager = new MissionManager();
        this.inventoryManager = new InventoryManager(this.state);
        this.upsideDownManager = new UpsideDownManager();
        
        // Configurar callbacks de erro
        this.setupErrorHandling();
        
        // Inicializar cada gerenciador com tratamento de erro
        try {
            await this.performanceManager.init();
            await this.audioManager.init();
            await this.locationManager.init();
            await this.arManager.init();
            await this.missionManager.init();
            await this.inventoryManager.init();
            // UpsideDownManager já é inicializado no construtor
            
            // Integrar performance manager com outros sistemas
            this.arManager.setPerformanceManager(this.performanceManager);
            
            Utils.log('Todos os gerenciadores inicializados');
        } catch (error) {
            Utils.log(`Erro ao inicializar gerenciadores: ${error.message}`, 'error');
            this.errorHandler.handleGlobalError({
                type: 'initialization',
                message: error.message,
                timestamp: Date.now()
            });
            throw error;
        }
    }

    setupEventListeners() {
        // Botão atender ligação
        this.elements.answerCall.addEventListener('click', () => {
            this.handleCallAnswer();
        });
        
        // Clique na imagem do Dustin
        this.elements.dustinImage.addEventListener('click', () => {
            this.handleCallAnswer();
        });

        // Controles de áudio
        const muteButton = document.getElementById('mute-button');
        const volumeSlider = document.getElementById('volume-slider');
        
        muteButton.addEventListener('click', () => {
            this.toggleMute();
        });
        
        volumeSlider.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });
        
        // Eventos de localização
        this.locationManager.on('positionUpdate', (position) => {
            this.handlePositionUpdate(position);
        });
        
        this.locationManager.on('targetReached', (data) => {
            this.handleTargetReached(data);
        });
        
        this.locationManager.on('navigationUpdate', (navData) => {
            this.handleNavigationUpdate(navData);
        });
        
        this.locationManager.on('locationError', (error) => {
            this.handleLocationError(error);
        });
        
        // Eventos de missão
        this.missionManager.on('missionComplete', (missionId) => {
            this.handleMissionComplete(missionId);
        });
        
        this.missionManager.on('missionStart', (missionId) => {
            this.handleMissionStart(missionId);
        });
        
        // Eventos de AR
        this.arManager.on('objectClicked', (objectId) => {
            this.handleARObjectClick(objectId);
        });
        
        this.arManager.on('markerDetected', (arContent) => {
            this.handleMarkerDetected(arContent);
        });
        
        this.arManager.on('imageTrackingStarted', (data) => {
            this.handleImageTrackingStarted(data);
        });
        
        this.arManager.on('imageTrackingLost', (data) => {
            this.handleImageTrackingLost(data);
        });
        
        this.arManager.on('combatStarted', (enemy) => {
            this.handleCombatStarted(enemy);
        });
        
        this.arManager.on('attackPerformed', (data) => {
            this.handleAttackPerformed(data);
        });
        
        this.arManager.on('combatCompleted', (data) => {
            this.handleCombatCompleted(data);
        });
        
        this.arManager.on('portalClicked', () => {
            this.handlePortalClick();
        });
        
        this.arManager.on('cameraStarted', () => {
            Utils.log('Câmera AR iniciada');
        });
        
        this.arManager.on('cameraStopped', () => {
            Utils.log('Câmera AR parada');
        });
        
        // Eventos de áudio
        this.audioManager.on('audioEnded', (audioId) => {
            this.handleAudioEnded(audioId);
        });
        
        // Eventos de inventário
        this.inventoryManager.on('itemAdded', (data) => {
            this.handleItemAdded(data);
        });
        
        this.inventoryManager.on('itemUsed', (data) => {
            this.handleItemUsed(data);
        });
        
        this.inventoryManager.on('itemClicked', (data) => {
            this.handleItemClicked(data);
        });
        
        Utils.log('Event listeners configurados');
    }

    setupErrorHandling() {
        if (!this.errorHandler) return;
        
        // Configurar callbacks para diferentes tipos de erro
        this.errorHandler.onError('critical', (errorInfo) => {
            Utils.log(`Erro crítico detectado: ${errorInfo.message}`, 'error');
            this.handleCriticalError(errorInfo);
        });
        
        this.errorHandler.onError('degraded_mode', (data) => {
            Utils.log(`Modo degradado ativado: ${data.reason}`, 'warn');
            this.handleDegradedMode(data);
        });
        
        // Integrar error handler com location manager
        if (this.locationManager) {
            this.locationManager.on('locationError', (error) => {
                const result = this.errorHandler.handleLocationError(error, {
                    currentMission: this.missionManager?.getCurrentMission()?.id,
                    playerPosition: this.state.getPlayerPosition()
                });
                
                if (result && result.fallbackActive) {
                    this.handleLocationFallback(result);
                }
            });
        }
        
        // Integrar error handler com AR manager
        if (this.arManager) {
            this.arManager.on('arError', (error) => {
                const result = this.errorHandler.handleARError(error, {
                    currentMission: this.missionManager?.getCurrentMission()?.id,
                    arMode: this.arManager.arState?.currentMode
                });
                
                if (result && result.fallbackActive) {
                    this.handleARFallback(result);
                }
            });
        }
        
        Utils.log('Sistema de tratamento de erros configurado');
    }

    handleCriticalError(errorInfo) {
        // Pausar o jogo se necessário
        if (this.arManager) {
            this.arManager.stopCamera();
        }
        
        if (this.locationManager) {
            this.locationManager.stopTracking();
        }
        
        // Mostrar interface de erro crítico
        this.showCriticalErrorInterface(errorInfo);
    }

    handleDegradedMode(data) {
        // Ajustar interface para modo degradado
        this.adjustInterfaceForDegradedMode(data.limitations);
        
        // Notificar outros sistemas
        if (data.limitations.includes('Navegação GPS limitada')) {
            this.enableManualNavigation();
        }
        
        if (data.limitations.includes('Realidade aumentada indisponível')) {
            this.enableAlternativeARInterface();
        }
    }

    handleLocationFallback(result) {
        Utils.log(`Fallback de localização ativado: ${result.mode}`, 'warn');
        
        switch (result.mode) {
            case 'manual_location':
                this.showManualLocationNotification();
                break;
            case 'reduced_accuracy':
                this.showReducedAccuracyNotification();
                break;
        }
    }

    handleARFallback(result) {
        Utils.log(`Fallback de AR ativado: ${result.mode}`, 'warn');
        
        switch (result.mode) {
            case 'no_ar':
                this.enableNoARMode();
                break;
            case 'compatibility':
                this.enableCompatibilityMode();
                break;
        }
    }

    loadMissionConfigurations() {
        // Configurações das missões baseadas nos requisitos
        const missions = [
            {
                id: 1,
                name: "Floresta das Trevas",
                description: "Encontre a bicicleta do Will",
                type: "ar_model",
                location: {
                    lat: -27.63054776462635,
                    lng: -48.681133649550205
                },
                radius: 20,
                arContent: {
                    type: "model",
                    path: "assets/models/bicicleta-will.glb",
                    scale: [1, 1, 1],
                    position: [0, 0, -2]
                },
                audio: {
                    completion: "sounds/call/dustin-missao-1-completa.wav"
                }
            },
            {
                id: 2,
                name: "Casa do Will",
                description: "Procure pistas nas paredes",
                type: "image_tracking",
                location: {
                    lat: -27.630903061716687,
                    lng: -48.67974685847095
                },
                radius: 20,
                arContent: {
                    type: "image_tracking",
                    markerImage: "assets/img/the-big-bang-theory.jpg",
                    overlayGif: "assets/gif/luzes-piscando.gif",
                    audioDelay: 10000
                },
                audio: {
                    completion: "sounds/call/dustin-missao-2-completa.wav"
                }
            },
            {
                id: 3,
                name: "Fuga do Demogorgon",
                description: "Fuja para local seguro",
                type: "navigation",
                location: {
                    lat: -27.630111492213196,
                    lng: -48.67959126452254
                },
                radius: 20,
                audio: {
                    completion: "sounds/call/dustin-missao-3-completa.wav"
                }
            },
            {
                id: 4,
                name: "Loja Melvald's",
                description: "Colete suprimentos",
                type: "ar_collection",
                location: {
                    lat: -27.62568754766323,
                    lng: -48.679824079211336
                },
                radius: 20,
                arContent: {
                    type: "collection",
                    items: [
                        {
                            id: "taco",
                            image: "assets/img/taco.png",
                            position: [1, 0, -2]
                        },
                        {
                            id: "gasolina",
                            image: "assets/img/gasolina.png",
                            position: [-1, 0, -2]
                        }
                    ]
                },
                audio: {
                    completion: "sounds/call/dustin-missao-4-completa.wav"
                }
            },
            {
                id: 5,
                name: "Laboratório Nacional de Hawkins",
                description: "Encontre a entrada para o mundo invertido",
                type: "image_tracking",
                location: {
                    lat: -27.624056768580015,
                    lng: -48.68124296486716
                },
                radius: 20,
                arContent: {
                    type: "image_tracking",
                    markerImage: "assets/img/bloco-h.jpg",
                    overlayGif: "assets/gif/portal.gif"
                },
                audio: {
                    completion: "sounds/call/dustin-missao-5-completa.wav"
                },
                special: "enable_upside_down"
            },
            {
                id: 6,
                name: "Encontro com Demogorgon",
                description: "Use os itens para derrotar o Demogorgon",
                type: "combat",
                location: {
                    lat: -27.630116851676945,
                    lng: -48.67954178126999
                },
                radius: 20,
                arContent: {
                    type: "combat",
                    enemy: "demogorgon",
                    model: "src/models/demogorgon.glb"
                },
                audio: {
                    approach: "sounds/call/dustin-missao-6-completa.wav",
                    victory: "sounds/call/dustin-missao-7-completa.wav"
                }
            },
            {
                id: 8,
                name: "Resgate do Will",
                description: "Encontre Will no Castelo Byers",
                type: "image_tracking",
                location: {
                    lat: -27.630903061716687,
                    lng: -48.67974685847095
                },
                radius: 20,
                arContent: {
                    type: "image_tracking",
                    markerImage: "assets/img/the-big-bang-theory.jpg", // Usar mesma imagem da casa
                    overlayModel: "src/models/castle_byers.glb"
                },
                audio: {
                    completion: "sounds/call/dustin-missao-8-completa.wav"
                },
                special: "game_complete"
            }
        ];
        
        this.missionManager.loadMissions(missions);
        Utils.log(`${missions.length} missões carregadas`);
    }

    // Iniciar sequência de introdução
    async startIntroSequence() {
        Utils.log('Iniciando sequência de introdução...');
        
        try {
            // Gerar relatório de compatibilidade
            const compatibilityReport = this.permissionHandler.generateCompatibilityReport();
            Utils.log(`Relatório de compatibilidade: Score ${compatibilityReport.score}/100`);
            
            // Salvar relatório no estado para debug
            if (this.state.isDebugMode()) {
                Utils.saveToStorage('compatibility-report', compatibilityReport);
            }
            
            // Marcar jogo como iniciado
            this.state.startGame();
            
            // Solicitar permissões necessárias
            await this.requestInitialPermissions();
            
            // Mostrar ligação do Dustin
            this.showDustinCall();
            
            Utils.log('Sequência de introdução iniciada');
            
        } catch (error) {
            Utils.log(`Erro na sequência de introdução: ${error.message}`, 'error');
            this.showError('Erro ao iniciar o jogo. Verifique as permissões.');
        }
    }

    async requestInitialPermissions() {
        // Verificar suporte do dispositivo primeiro
        const isSupported = await this.permissionHandler.checkDeviceSupport();
        if (!isSupported) {
            throw new Error('Dispositivo não compatível');
        }

        // Verificar permissões existentes
        await this.permissionHandler.checkExistingPermissions();

        // Iniciar monitoramento de mudanças
        await this.permissionHandler.monitorPermissionChanges();

        // Registrar callbacks para mudanças de permissão
        this.permissionHandler.onPermissionChanged('camera', (granted) => {
            this.state.setPermission('camera', granted);
            if (!granted) {
                this.handlePermissionLost('camera');
            }
        });

        this.permissionHandler.onPermissionChanged('location', (granted) => {
            this.state.setPermission('location', granted);
            if (!granted) {
                this.handlePermissionLost('location');
            }
        });

        // Solicitar todas as permissões necessárias
        const permissions = await this.permissionHandler.requestAllPermissions();
        
        // Atualizar estado do jogo
        Object.keys(permissions).forEach(type => {
            this.state.setPermission(type, permissions[type]);
        });

        // Verificar se permissões críticas foram concedidas
        if (!permissions.camera || !permissions.location) {
            throw new Error('Permissões necessárias não foram concedidas');
        }
        
        Utils.log('Permissões iniciais obtidas com sucesso');
    }

    handlePermissionLost(type) {
        Utils.log(`Permissão perdida: ${type}`, 'warn');
        
        // Pausar funcionalidades relacionadas
        if (type === 'camera') {
            this.arManager?.stopCamera();
        }
        
        if (type === 'location') {
            this.locationManager?.stopTracking();
        }
    }

    showDustinCall() {
        this.elements.callInterface.classList.remove('hidden');
        this.elements.callInterface.classList.add('fade-in');
        
        // Atualizar status da ligação
        const callStatus = document.querySelector('.call-status');
        callStatus.textContent = 'Ligando...';
        
        // Reproduzir som de chamada se disponível
        this.currentCallAudio = this.audioManager.playAudio('sounds/effects/radio-static.wav', { 
            loop: true, 
            volume: 0.3 
        });
        
        // Mostrar controles de áudio
        this.showAudioControls();
        
        // Simular tempo de ligação
        setTimeout(() => {
            if (callStatus) {
                callStatus.textContent = 'Chamada recebida';
            }
        }, 2000);
        
        Utils.log('Ligação do Dustin exibida');
    }

    async handleCallAnswer() {
        Utils.log('Ligação atendida');
        
        // Parar som de chamada
        if (this.currentCallAudio) {
            this.audioManager.stopAudio(this.currentCallAudio);
        }
        
        // Atualizar status da ligação
        const callStatus = document.querySelector('.call-status');
        if (callStatus) {
            callStatus.textContent = 'Conectado';
        }
        
        // Desabilitar botão de atender
        this.elements.answerCall.disabled = true;
        this.elements.answerCall.textContent = 'Conectando...';
        
        try {
            // Reproduzir áudio de introdução
            const introAudioId = await this.audioManager.playAudio('sounds/call/dustin-intro.wav');
            
            // Aguardar o áudio terminar
            await new Promise((resolve) => {
                const onAudioEnd = (audioId) => {
                    if (audioId === introAudioId) {
                        this.audioManager.off('audioEnded', onAudioEnd);
                        resolve();
                    }
                };
                this.audioManager.on('audioEnded', onAudioEnd);
            });
            
            // Ocultar interface de ligação com animação
            this.elements.callInterface.classList.add('fade-out');
            setTimeout(() => {
                this.elements.callInterface.classList.add('hidden');
                this.elements.callInterface.classList.remove('fade-out');
            }, 500);
            
            // Aguardar um pouco antes de iniciar a primeira missão
            await Utils.wait(1000);
            
            // Iniciar primeira missão
            this.startFirstMission();
            
        } catch (error) {
            Utils.log(`Erro durante ligação: ${error.message}`, 'error');
            this.showError('Erro durante a ligação com Dustin');
        }
    }

    async startFirstMission() {
        Utils.log('Iniciando primeira missão...');
        
        try {
            // Ativar câmera AR
            await this.arManager.startCamera();
            this.elements.arScene.classList.remove('hidden');
            
            // Iniciar rastreamento de localização
            await this.locationManager.startTracking();
            
            // Restaurar estado do mundo invertido se necessário
            this.restoreUpsideDownState();
            
            // Definir primeira missão
            const firstMission = this.missionManager.getMission(1);
            this.missionManager.startMission(1);
            
            // Definir destino no LocationManager
            this.locationManager.setTarget(
                firstMission.location.lat,
                firstMission.location.lng,
                firstMission.radius
            );
            
            // Atualizar UI
            this.updateMissionUI(1);
            
            Utils.log('Primeira missão iniciada');
            
        } catch (error) {
            Utils.log(`Erro ao iniciar primeira missão: ${error.message}`, 'error');
            this.showError('Erro ao acessar câmera ou localização');
        }
    }

    handlePositionUpdate(position) {
        // Atualizar estado
        this.state.setPlayerPosition(position.lat, position.lng, position.accuracy);
        
        // Verificar se está no bairro Pedra Branca
        if (!Utils.isInPedraBranca(position.lat, position.lng)) {
            Utils.log('Jogador fora do bairro Pedra Branca', 'warn');
        }
        
        // Atualizar navegação
        this.updateNavigation(position);
        
        // Atualizar UI de distância
        this.updateDistanceUI(position);
    }

    updateNavigation(position) {
        const currentMission = this.missionManager.getCurrentMission();
        if (!currentMission) return;
        
        const target = currentMission.location;
        const distance = Utils.calculateDistance(
            position.lat, position.lng,
            target.lat, target.lng
        );
        
        if (distance > currentMission.radius) {
            // Mostrar seta de navegação
            this.showNavigationArrow(position, target);
        } else {
            // Ocultar seta e vibrar
            this.hideNavigationArrow();
            Utils.vibrate([200, 100, 200]);
            
            // Notificar chegada ao destino
            this.locationManager.emit('targetReached', currentMission);
        }
    }

    showNavigationArrow(from, to) {
        const bearing = Utils.calculateBearing(from.lat, from.lng, to.lat, to.lng);
        const distance = Utils.calculateDistance(from.lat, from.lng, to.lat, to.lng);
        
        this.updateNavigationArrow(bearing, distance, true);
    }

    hideNavigationArrow() {
        const arrow = this.elements.navigationArrow;
        
        // Adicionar animação de saída
        arrow.classList.add('hide');
        arrow.classList.remove('show', 'near', 'far', 'moving');
        
        setTimeout(() => {
            arrow.classList.add('hidden');
            arrow.classList.remove('hide');
        }, 400);
    }

    updateNavigationArrow(bearing, distance, show = false) {
        const arrow = this.elements.navigationArrow;
        const arrowSvg = arrow.querySelector('.arrow-svg');
        const distanceIndicator = document.getElementById('arrow-distance');
        const accuracyBars = arrow.querySelector('.accuracy-bars');
        
        if (show && arrow.classList.contains('hidden')) {
            // Mostrar seta com animação de entrada
            arrow.classList.remove('hidden');
            arrow.classList.add('show');
            
            setTimeout(() => {
                arrow.classList.remove('show');
            }, 600);
        }
        
        // Atualizar rotação da seta
        if (bearing !== null) {
            arrowSvg.style.transform = `rotate(${bearing}deg)`;
        }
        
        // Atualizar indicador de distância
        if (distance !== null) {
            distanceIndicator.textContent = Utils.formatDistance(distance);
            
            // Aplicar classes baseadas na distância
            arrow.classList.remove('near', 'far');
            
            if (distance <= 50) {
                arrow.classList.add('near');
            } else if (distance >= 200) {
                arrow.classList.add('far');
            }
        }
        
        // Atualizar indicador de precisão baseado na precisão do GPS
        if (this.locationManager.currentPosition && accuracyBars) {
            const accuracy = this.locationManager.currentPosition.accuracy;
            accuracyBars.classList.remove('low', 'medium', 'high');
            
            if (accuracy <= 10) {
                accuracyBars.classList.add('high');
            } else if (accuracy <= 30) {
                accuracyBars.classList.add('medium');
            } else {
                accuracyBars.classList.add('low');
            }
        }
        
        // Adicionar classe de movimento se o jogador estiver se movendo
        const isMoving = this.locationManager.isMoving && this.locationManager.isMoving();
        if (isMoving) {
            arrow.classList.add('moving');
        } else {
            arrow.classList.remove('moving');
        }
    }

    // Animação especial quando destino é alcançado
    showDestinationReached() {
        const arrow = this.elements.navigationArrow;
        
        // Adicionar animação de destino alcançado
        arrow.classList.add('destination-reached');
        
        setTimeout(() => {
            arrow.classList.add('hidden');
            arrow.classList.remove('destination-reached', 'near', 'far', 'moving');
        }, 1000);
    }

    // Animação de erro na navegação
    showNavigationError() {
        const arrow = this.elements.navigationArrow;
        
        arrow.classList.add('error');
        
        setTimeout(() => {
            arrow.classList.remove('error');
        }, 1500);
    }

    updateDistanceUI(position) {
        const currentMission = this.missionManager.getCurrentMission();
        if (!currentMission) return;
        
        const distance = Utils.calculateDistance(
            position.lat, position.lng,
            currentMission.location.lat, currentMission.location.lng
        );
        
        this.elements.distanceText.textContent = 
            `Distância: ${Utils.formatDistance(distance)}`;
    }

    updateMissionUI(missionId) {
        const mission = this.missionManager.getMission(missionId);
        if (!mission) return;
        
        this.elements.missionTitle.textContent = mission.name;
        this.elements.missionDescription.textContent = mission.description;
    }

    handleTargetReached(data) {
        Utils.log(`Destino alcançado! Distância: ${data.distance.toFixed(1)}m`);
        
        // Mostrar animação de destino alcançado
        this.showDestinationReached();
        
        // Obter missão atual
        const currentMission = this.missionManager.getCurrentMission();
        if (currentMission) {
            // Ativar conteúdo AR específico da missão
            this.activateMissionAR(currentMission);
        }
    }

    handleNavigationUpdate(navData) {
        // Atualizar seta de navegação
        if (navData.isNearTarget) {
            this.hideNavigationArrow();
        } else {
            this.showNavigationArrowWithBearing(navData.bearing);
        }
        
        // Atualizar UI de distância
        this.updateDistanceUIWithData(navData.distance);
    }

    handleLocationError(error) {
        Utils.log(`Erro de localização: ${error.message}`, 'error');
        
        // Usar o error handler para processar o erro
        if (this.errorHandler) {
            const result = this.errorHandler.handleLocationError(error, {
                currentMission: this.missionManager?.getCurrentMission()?.id,
                playerPosition: this.state.getPlayerPosition()
            });
            
            if (result && result.fallbackActive) {
                this.handleLocationFallback(result);
                return;
            }
        }
        
        // Fallback para tratamento básico se error handler não disponível
        let errorMessage = 'Erro de localização: ';
        switch (error.code) {
            case 1: // PERMISSION_DENIED
                errorMessage += 'Permissão negada. Verifique as configurações do navegador.';
                break;
            case 2: // POSITION_UNAVAILABLE
                errorMessage += 'Localização indisponível. Verifique se o GPS está ativado.';
                break;
            case 3: // TIMEOUT
                errorMessage += 'Timeout. Tente novamente em alguns segundos.';
                break;
            default:
                errorMessage += error.message;
        }
        
        this.showError(errorMessage);
    }

    // Métodos para lidar com interfaces de fallback
    showCriticalErrorInterface(errorInfo) {
        const errorScreen = document.createElement('div');
        errorScreen.id = 'critical-error-screen';
        errorScreen.className = 'critical-error-screen';
        errorScreen.innerHTML = `
            <div class="critical-error-content">
                <h2>⚠️ Erro Crítico</h2>
                <p>O jogo encontrou um erro crítico e precisa ser reiniciado.</p>
                <div class="error-details">
                    <strong>Erro:</strong> ${errorInfo.message}
                </div>
                <div class="error-actions">
                    <button class="error-button primary" onclick="location.reload()">
                        Reiniciar Jogo
                    </button>
                    <button class="error-button" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Continuar (Não Recomendado)
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorScreen);
    }

    adjustInterfaceForDegradedMode(limitations) {
        Utils.log(`Ajustando interface para modo degradado: ${limitations.join(', ')}`);
        
        // Adicionar classe CSS para modo degradado
        document.body.classList.add('degraded-mode');
        
        // Simplificar animações
        const style = document.createElement('style');
        style.id = 'degraded-mode-styles';
        style.textContent = `
            .degraded-mode * {
                animation-duration: 0.1s !important;
                transition-duration: 0.1s !important;
            }
            
            .degraded-mode .complex-animation {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    enableManualNavigation() {
        Utils.log('Habilitando navegação manual');
        
        // Mostrar controles de navegação manual
        const manualNav = document.createElement('div');
        manualNav.id = 'manual-navigation';
        manualNav.className = 'manual-navigation';
        manualNav.innerHTML = `
            <div class="manual-nav-content">
                <h4>📍 Navegação Manual</h4>
                <p>Use os botões abaixo para navegar:</p>
                <div class="manual-nav-buttons">
                    <button class="nav-button" onclick="window.game.setManualDirection('north')">⬆️ Norte</button>
                    <button class="nav-button" onclick="window.game.setManualDirection('south')">⬇️ Sul</button>
                    <button class="nav-button" onclick="window.game.setManualDirection('east')">➡️ Leste</button>
                    <button class="nav-button" onclick="window.game.setManualDirection('west')">⬅️ Oeste</button>
                </div>
                <button class="nav-button complete" onclick="window.game.completeCurrentMissionManually()">
                    ✅ Cheguei ao Destino
                </button>
            </div>
        `;
        
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.appendChild(manualNav);
        }
    }

    enableAlternativeARInterface() {
        Utils.log('Habilitando interface alternativa de AR');
        
        // Ocultar scene AR
        if (this.elements.arScene) {
            this.elements.arScene.style.display = 'none';
        }
        
        // Mostrar interface alternativa
        if (this.errorHandler) {
            this.errorHandler.showNoARInterface();
        }
    }

    showManualLocationNotification() {
        this.showNotification('📍 Localização Manual', 'Você pode definir sua localização manualmente.', 'info');
    }

    showReducedAccuracyNotification() {
        this.showNotification('📍 Precisão Reduzida', 'Localização com precisão reduzida ativada.', 'warning');
    }

    enableNoARMode() {
        Utils.log('Habilitando modo sem AR');
        
        // Ocultar elementos AR
        if (this.elements.arScene) {
            this.elements.arScene.style.display = 'none';
        }
        
        // Mostrar interface alternativa
        if (this.errorHandler) {
            this.errorHandler.showNoARInterface();
        }
        
        this.showNotification('📷 Modo sem AR', 'Realidade aumentada indisponível. Usando interface alternativa.', 'info');
    }

    enableCompatibilityMode() {
        Utils.log('Habilitando modo de compatibilidade');
        
        // Aplicar configurações de compatibilidade
        document.body.classList.add('compatibility-mode');
        
        // Desabilitar recursos avançados
        const style = document.createElement('style');
        style.textContent = `
            .compatibility-mode .advanced-feature {
                display: none !important;
            }
            
            .compatibility-mode {
                font-size: 18px;
                line-height: 1.6;
            }
            
            .compatibility-mode button {
                min-height: 44px;
                font-size: 16px;
            }
        `;
        document.head.appendChild(style);
        
        this.showNotification('⚙️ Modo Compatibilidade', 'Interface simplificada para melhor compatibilidade.', 'info');
    }

    // Métodos utilitários para navegação manual
    setManualDirection(direction) {
        Utils.log(`Direção manual definida: ${direction}`);
        
        // Simular atualização de direção
        const directions = {
            north: 0,
            east: 90,
            south: 180,
            west: 270
        };
        
        const bearing = directions[direction];
        if (bearing !== undefined) {
            this.updateNavigationArrow(bearing, null, true);
        }
    }

    completeCurrentMissionManually() {
        Utils.log('Completando missão manualmente');
        
        const currentMission = this.missionManager.getCurrentMission();
        if (currentMission) {
            // Simular chegada ao destino
            this.handleTargetReached({
                target: currentMission.location,
                position: { lat: currentMission.location.lat, lng: currentMission.location.lng },
                distance: 0,
                manual: true
            });
        }
    }

    // Sistema de notificações
    showNotification(title, message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <h4>${title}</h4>
                <p>${message}</p>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    ✕
                </button>
            </div>
        `;
        
        // Adicionar estilos se não existirem
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    max-width: 300px;
                    background: #333;
                    border-radius: 8px;
                    padding: 0;
                    z-index: 9998;
                    animation: slideInRight 0.3s ease;
                }
                
                .notification-info { border-left: 4px solid #2196F3; }
                .notification-warning { border-left: 4px solid #FF9800; }
                .notification-error { border-left: 4px solid #F44336; }
                .notification-success { border-left: 4px solid #4CAF50; }
                
                .notification-content {
                    padding: 15px;
                    position: relative;
                }
                
                .notification-content h4 {
                    margin: 0 0 8px 0;
                    color: #fff;
                    font-size: 14px;
                }
                
                .notification-content p {
                    margin: 0;
                    color: #ccc;
                    font-size: 12px;
                    line-height: 1.4;
                }
                
                .notification-close {
                    position: absolute;
                    top: 5px;
                    right: 8px;
                    background: none;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    font-size: 16px;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                }
                
                .notification-close:hover {
                    color: #fff;
                }
                
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    showNavigationArrowWithBearing(bearing, distance = null) {
        if (bearing === null) return;
        
        // Usar o método updateNavigationArrow para consistência
        this.updateNavigationArrow(bearing, distance, true);
    }

    updateDistanceUIWithData(distance) {
        if (distance === null) return;
        
        this.elements.distanceText.textContent = 
            `Distância: ${Utils.formatDistance(distance)}`;
    }

    async activateMissionAR(mission) {
        switch (mission.type) {
            case 'ar_model':
                await this.arManager.showModel(mission.arContent);
                break;
            case 'image_tracking':
                await this.arManager.startImageTracking(mission.arContent);
                break;
            case 'ar_collection':
                await this.arManager.showCollectionItems(mission.arContent);
                break;
            case 'combat':
                await this.arManager.startCombat(mission.arContent);
                break;
            case 'navigation':
                // Apenas navegação, completar automaticamente
                this.missionManager.completeMission(mission.id);
                break;
        }
    }

    handleARObjectClick(objectId) {
        Utils.log(`Objeto AR clicado: ${objectId}`);
        
        const currentMission = this.missionManager.getCurrentMission();
        if (!currentMission) return;
        
        // Processar clique baseado no tipo de missão
        this.processARInteraction(currentMission, objectId);
    }

    processARInteraction(mission, objectId) {
        Utils.log(`Processando interação AR: missão ${mission.id} (${mission.type}), objeto: ${objectId}`);
        
        switch (mission.type) {
            case 'ar_model':
                if (objectId === 'bicicleta-will') {
                    Utils.log('Bicicleta do Will coletada! Completando Missão 1...');
                    this.missionManager.completeMission(mission.id);
                } else {
                    Utils.log(`Objeto AR desconhecido clicado: ${objectId}`, 'warn');
                }
                break;
            case 'image_tracking':
                if (objectId === 'castle-byers' && mission.id === 8) {
                    Utils.log('Castelo Byers encontrado! Will foi resgatado! Completando missão final...');
                    this.missionManager.completeMission(mission.id);
                } else {
                    Utils.log(`Interação de rastreamento de imagem: ${objectId} na missão ${mission.id}`);
                }
                break;
            case 'ar_collection':
                this.collectItem(objectId);
                break;
            case 'combat':
                this.handleCombatAction(objectId);
                break;
            default:
                Utils.log(`Tipo de missão não suportado para interação AR: ${mission.type}`, 'warn');
        }
    }

    collectItem(itemId) {
        // Usar o inventory manager para adicionar o item
        const added = this.inventoryManager.addItem(itemId);
        
        if (!added) {
            Utils.log(`Falha ao adicionar item ao inventário: ${itemId}`, 'warn');
            return;
        }
        
        // Verificar se todos os itens da missão foram coletados
        const currentMission = this.missionManager.getCurrentMission();
        if (currentMission && currentMission.type === 'ar_collection') {
            const requiredItems = currentMission.arContent.items.map(item => item.id);
            const hasAllItems = requiredItems.every(item => this.inventoryManager.hasItem(item));
            
            if (hasAllItems) {
                Utils.log('Todos os itens da missão coletados!');
                this.missionManager.completeMission(currentMission.id);
            }
        }
    }

    // Manipuladores de eventos do inventário
    handleItemAdded(data) {
        Utils.log(`Item adicionado ao inventário: ${data.itemId}`);
        
        // Vibrar para feedback tátil
        Utils.vibrate([100, 50, 100]);
        
        // Reproduzir som de coleta se disponível
        this.audioManager.playAudio('sounds/effects/item-collect.wav', { volume: 0.5 });
    }

    handleItemUsed(data) {
        Utils.log(`Item usado: ${data.itemId}`);
        
        const currentMission = this.missionManager.getCurrentMission();
        
        // Processar uso do item baseado no contexto
        if (currentMission && currentMission.type === 'combat') {
            this.processCombatItemUse(data.itemId, data.item);
        } else {
            Utils.log(`Item ${data.itemId} usado fora de contexto de combate`);
        }
    }

    handleItemClicked(data) {
        Utils.log(`Item clicado no inventário: ${data.itemId}`);
        // Feedback visual já é tratado pelo InventoryManager
    }

    processCombatItemUse(itemId, itemInfo) {
        Utils.log(`Usando ${itemId} em combate`);
        
        switch (itemId) {
            case 'taco':
                // Primeiro ataque com taco
                this.arManager.performAttack('taco');
                
                // Aguardar 3 segundos antes de permitir uso da gasolina
                setTimeout(() => {
                    Utils.log('Taco usado! Agora use a gasolina para finalizar o ataque.');
                }, 3000);
                break;
                
            case 'gasolina':
                // Verificar se o taco foi usado primeiro
                if (!this.combatState || !this.combatState.tacoUsed) {
                    Utils.log('Use o taco primeiro!', 'warn');
                    return;
                }
                
                // Ataque final com gasolina
                this.arManager.performAttack('gasolina');
                this.completeCombat();
                break;
                
            default:
                Utils.log(`Item ${itemId} não pode ser usado em combate`, 'warn');
        }
    }

    completeCombat() {
        Utils.log('Combate completado!');
        
        // Fazer Demogorgon desaparecer
        this.arManager.hideCombatEnemy();
        
        // Reproduzir áudio de vitória
        const currentMission = this.missionManager.getCurrentMission();
        if (currentMission && currentMission.audio && currentMission.audio.victory) {
            this.audioManager.playAudio(currentMission.audio.victory);
        }
        
        // Completar missão
        this.missionManager.completeMission(currentMission.id);
        
        // Limpar estado de combate
        this.combatState = null;
    }

    updateInventoryUI() {
        // O InventoryManager já cuida da atualização da UI
        // Este método é mantido para compatibilidade
        if (this.inventoryManager) {
            this.inventoryManager.updateUI();
        } else {
            // Fallback se InventoryManager não estiver disponível
            const inventory = this.state.getInventory();
            this.elements.inventoryItems.innerHTML = '';
            
            inventory.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'inventory-item';
                itemElement.style.backgroundImage = `url(assets/img/${item}.png)`;
                this.elements.inventoryItems.appendChild(itemElement);
            });
        }
    }

    async handleMissionComplete(missionId) {
        Utils.log(`Missão ${missionId} completada`);
        
        const mission = this.missionManager.getMission(missionId);
        this.state.completeMission(missionId);
        
        // Reproduzir áudio de conclusão
        if (mission.audio && mission.audio.completion) {
            await this.audioManager.playAudio(mission.audio.completion);
        }
        
        // Processar ações especiais
        if (mission.special) {
            await this.handleSpecialAction(mission.special);
        }
        
        // Avançar para próxima missão
        this.advanceToNextMission(missionId);
    }

    handleMarkerDetected(arContent) {
        Utils.log('Marcador AR detectado', arContent);
        
        const currentMission = this.missionManager.getCurrentMission();
        if (!currentMission) {
            Utils.log('Nenhuma missão ativa para processar marcador', 'warn');
            return;
        }
        
        if (currentMission.type === 'image_tracking') {
            Utils.log(`Processando rastreamento de imagem para missão ${currentMission.id}: ${currentMission.name}`);
            
            // Mostrar feedback visual de detecção
            this.showImageTrackingFeedback(arContent);
            
            // Missão 5 (Laboratório) requer clique no portal para ativar mundo invertido
            if (currentMission.id === 5 && currentMission.special === 'enable_upside_down') {
                Utils.log('Missão 5 detectada - aguardando clique no portal para ativar mundo invertido');
                // Não completar automaticamente - aguardar clique no portal
                return;
            }
            
            // Verificar se há delay de áudio especificado
            if (arContent.audioDelay && arContent.audioDelay > 0) {
                Utils.log(`Aguardando ${arContent.audioDelay}ms antes de completar missão`);
                
                // Mostrar indicador de delay
                this.showAudioDelayIndicator(arContent.audioDelay);
                
                // Completar missão após o delay
                setTimeout(() => {
                    Utils.log('Completando missão após delay de áudio');
                    this.missionManager.completeMission(currentMission.id);
                }, arContent.audioDelay);
            } else {
                // Sem delay, completar imediatamente
                Utils.log('Completando missão de rastreamento de imagem imediatamente');
                this.missionManager.completeMission(currentMission.id);
            }
        }
    }

    showImageTrackingFeedback(arContent) {
        // Mostrar feedback visual quando imagem é detectada
        const feedback = document.createElement('div');
        feedback.className = 'image-tracking-feedback';
        feedback.innerHTML = `
            <div class="feedback-content">
                <div class="feedback-icon">📷</div>
                <div class="feedback-text">Imagem detectada!</div>
            </div>
        `;
        
        document.body.appendChild(feedback);
        
        // Remover após animação
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 3000);
        
        Utils.log('Feedback de rastreamento de imagem exibido');
    }

    showAudioDelayIndicator(delayMs) {
        // Mostrar indicador de countdown para o delay de áudio
        const indicator = document.createElement('div');
        indicator.className = 'audio-delay-indicator';
        indicator.id = 'audio-delay-indicator';
        
        const seconds = Math.ceil(delayMs / 1000);
        indicator.innerHTML = `
            <div class="delay-content">
                <div class="delay-icon">⏱️</div>
                <div class="delay-text">Aguarde...</div>
                <div class="delay-countdown">${seconds}s</div>
            </div>
        `;
        
        document.body.appendChild(indicator);
        
        // Countdown
        let remainingSeconds = seconds;
        const countdownInterval = setInterval(() => {
            remainingSeconds--;
            const countdownElement = indicator.querySelector('.delay-countdown');
            if (countdownElement) {
                countdownElement.textContent = `${remainingSeconds}s`;
            }
            
            if (remainingSeconds <= 0) {
                clearInterval(countdownInterval);
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }
        }, 1000);
        
        // Remover após delay total
        setTimeout(() => {
            clearInterval(countdownInterval);
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, delayMs + 1000);
        
        Utils.log(`Indicador de delay de áudio exibido: ${seconds}s`);
    }

    handleImageTrackingStarted(data) {
        Utils.log(`Rastreamento de imagem iniciado: ${data.markerId}`, data);
        
        // Mostrar feedback adicional se necessário
        const currentMission = this.missionManager.getCurrentMission();
        if (currentMission && currentMission.type === 'image_tracking') {
            Utils.log(`Imagem ${data.markerImage} detectada para missão ${currentMission.name}`);
        }
    }

    handleImageTrackingLost(data) {
        Utils.log(`Rastreamento de imagem perdido: ${data.markerId}`, data);
        
        // Remover indicadores visuais se necessário
        const delayIndicator = document.getElementById('audio-delay-indicator');
        if (delayIndicator && delayIndicator.parentNode) {
            delayIndicator.parentNode.removeChild(delayIndicator);
        }
    }

    handleCombatStarted(data) {
        Utils.log(`Combate iniciado contra: ${data.enemy || 'inimigo desconhecido'}`);
        
        // Verificar se o jogador tem os itens necessários
        const hasTaco = this.inventoryManager.hasItem('taco');
        const hasGasolina = this.inventoryManager.hasItem('gasolina');
        
        if (!hasTaco || !hasGasolina) {
            this.showError('Você precisa de um taco e gasolina para lutar contra o Demogorgon!');
            return;
        }
        
        // Vibrar para indicar início do combate
        Utils.vibrate([300, 200, 300]);
        
        // Reproduzir áudio de aproximação se disponível
        const currentMission = this.missionManager.getCurrentMission();
        if (currentMission && currentMission.audio && currentMission.audio.approach) {
            this.audioManager.playAudio(currentMission.audio.approach);
        }
        
        Utils.log('Combate iniciado - interface gerenciada pelo AR Manager');
    }





    showVictoryMessage() {
        // Criar overlay de vitória
        const victoryOverlay = document.createElement('div');
        victoryOverlay.className = 'victory-overlay';
        victoryOverlay.innerHTML = `
            <div class="victory-content">
                <h2>DEMOGORGON DERROTADO!</h2>
                <p>Você salvou Hawkins!</p>
                <div class="victory-animation">🎉</div>
            </div>
        `;
        
        document.body.appendChild(victoryOverlay);
        
        // Mostrar com animação
        setTimeout(() => {
            victoryOverlay.classList.add('show');
        }, 100);
        
        // Remover após 4 segundos
        setTimeout(() => {
            victoryOverlay.classList.add('hide');
            setTimeout(() => {
                victoryOverlay.remove();
            }, 500);
        }, 4000);
    }

    handleAttackPerformed(data) {
        Utils.log(`Ataque executado: ${data.weapon} (${data.attackNumber}/${data.totalAttacks})`);
        
        // Usar item do inventário se for consumível
        if (data.weapon === 'gasolina') {
            this.inventoryManager.useItem('gasolina');
        }
        
        // Mostrar feedback visual do ataque
        this.showAttackFeedback(data.weapon);
        
        // Vibrar dispositivo para feedback tátil
        if (data.weapon === 'taco') {
            Utils.vibrate([200, 100, 200]);
        } else if (data.weapon === 'gasolina') {
            Utils.vibrate([300, 150, 300, 150, 500]);
        }
        
        Utils.log(`Ataque ${data.attackNumber} de ${data.totalAttacks} executado com ${data.weapon}`);
    }

    handleCombatCompleted(data) {
        Utils.log(`Combate completado: ${data.enemy}, ataques: ${data.attacksPerformed}, armas: ${data.weaponsUsed.join(', ')}`);
        
        // Reproduzir áudio de vitória
        this.playCombatVictoryAudio();
        
        // Completar missão atual
        const currentMission = this.missionManager.getCurrentMission();
        if (currentMission) {
            this.missionManager.completeMission(currentMission.id);
        }
        
        // Mostrar mensagem de vitória
        this.showVictoryMessage();
        
        Utils.log('Demogorgon derrotado - combate concluído com sucesso!');
    }

    async playCombatVictoryAudio() {
        const currentMission = this.missionManager.getCurrentMission();
        if (currentMission && currentMission.audio && currentMission.audio.victory) {
            try {
                await this.audioManager.playAudio(currentMission.audio.victory);
                Utils.log('Áudio de vitória reproduzido');
            } catch (error) {
                Utils.log(`Erro ao reproduzir áudio de vitória: ${error.message}`, 'warn');
            }
        }
    }

    showVictoryMessage() {
        // Criar overlay de vitória
        const victoryOverlay = document.createElement('div');
        victoryOverlay.className = 'victory-overlay';
        victoryOverlay.innerHTML = `
            <div class="victory-content">
                <h2 class="victory-title">DEMOGORGON DERROTADO!</h2>
                <p class="victory-subtitle">Você salvou Hawkins!</p>
                <div class="victory-animation">
                    <div class="victory-icon">🎉</div>
                    <div class="victory-sparks">
                        <span>✨</span>
                        <span>⭐</span>
                        <span>✨</span>
                        <span>⭐</span>
                        <span>✨</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(victoryOverlay);
        
        // Mostrar com animação
        setTimeout(() => {
            victoryOverlay.classList.add('show');
        }, 100);
        
        // Remover após 5 segundos
        setTimeout(() => {
            victoryOverlay.classList.add('hide');
            setTimeout(() => {
                if (victoryOverlay.parentNode) {
                    victoryOverlay.parentNode.removeChild(victoryOverlay);
                }
            }, 500);
        }, 5000);
    }

    showAttackFeedback(weapon) {
        // Criar feedback visual do ataque
        const feedback = document.createElement('div');
        feedback.className = 'attack-feedback';
        
        const weaponName = weapon === 'taco' ? 'Taco' : 'Gasolina';
        const icon = weapon === 'taco' ? '⚾' : '🔥';
        
        feedback.innerHTML = `
            <div class="feedback-content">
                <div class="feedback-icon">${icon}</div>
                <div class="feedback-text">${weaponName} usado!</div>
            </div>
        `;
        
        // Adicionar ao DOM
        document.body.appendChild(feedback);
        
        // Mostrar com animação
        setTimeout(() => {
            feedback.classList.add('show');
        }, 100);
        
        // Remover após animação
        setTimeout(() => {
            feedback.classList.add('hide');
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 500);
        }, 2000);
    }
        
        document.body.appendChild(feedback);
        
        // Animar entrada
        setTimeout(() => {
            feedback.classList.add('show');
        }, 10);
        
        // Remover após animação
        setTimeout(() => {
            feedback.classList.add('hide');
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 500);
        }, 2000);
    }

    handleCombatDefeat() {
        Utils.log('Combate perdido');
        
        // Mostrar mensagem de derrota
        this.showError('Você foi derrotado pelo Demogorgon! Tente novamente.');
        
        // Resetar combate (implementação futura)
        this.resetCombat();
    }

    resetCombat() {
        // Limpar estado de combate
        this.combatState = null;
        
        // Remover overlays de combate
        const combatOverlay = document.getElementById('combat-overlay');
        if (combatOverlay) {
            combatOverlay.remove();
        }
        
        const instructionPanel = document.getElementById('combat-instructions-panel');
        if (instructionPanel) {
            instructionPanel.remove();
        }
        
        // Resetar AR Manager
        if (this.arManager.isInCombat()) {
            this.arManager.hideCombatEnemy();
        }
        
        Utils.log('Combate resetado');
    }

    handleCombatAction(actionId) {
        Utils.log(`Ação de combate: ${actionId}`);
        // Implementar ações específicas de combate se necessário
    }

    handlePortalClick() {
        Utils.log('Portal clicado - ativando mundo invertido');
        
        const currentMission = this.missionManager.getCurrentMission();
        if (!currentMission || currentMission.id !== 5) {
            Utils.log('Portal clicado fora da Missão 5', 'warn');
            return;
        }
        
        // Ativar modo mundo invertido primeiro
        this.enableUpsideDownMode();
        
        // Completar a missão após ativar o mundo invertido
        setTimeout(() => {
            this.missionManager.completeMission(currentMission.id);
        }, 1000); // Pequeno delay para permitir que o efeito visual seja visto
    }

    async handleSpecialAction(action) {
        switch (action) {
            case 'enable_upside_down':
                this.enableUpsideDownMode();
                break;
            case 'game_complete':
                this.completeGame();
                break;
        }
    }

    enableUpsideDownMode() {
        Utils.log('Ativando modo mundo invertido...');
        
        // Atualizar estado do jogo
        this.state.enableUpsideDownMode();
        
        // Ativar sistema do mundo invertido
        if (this.upsideDownManager) {
            this.upsideDownManager.activate();
        } else {
            Utils.log('UpsideDownManager não disponível', 'error');
        }
        
        // Vibrar dispositivo para feedback
        Utils.vibrate([300, 100, 300, 100, 300]);
        
        Utils.log('Modo mundo invertido ativado com sucesso');
    }

    // Método para desativar o mundo invertido (para debug ou reset)
    disableUpsideDownMode() {
        Utils.log('Desativando modo mundo invertido...');
        
        // Atualizar estado do jogo
        this.state.disableUpsideDownMode();
        
        // Desativar sistema do mundo invertido
        if (this.upsideDownManager) {
            this.upsideDownManager.deactivate();
        }
        
        Utils.log('Modo mundo invertido desativado');
    }

    // Verificar se o mundo invertido está ativo
    isUpsideDownActive() {
        return this.state.isUpsideDownMode() && 
               this.upsideDownManager && 
               this.upsideDownManager.isUpsideDownActive();
    }

    // Restaurar estado do mundo invertido (para persistência)
    restoreUpsideDownState() {
        if (this.state.isUpsideDownMode() && this.upsideDownManager) {
            Utils.log('Restaurando estado do mundo invertido...');
            this.upsideDownManager.activate();
        }
    }

    // Método para debug do mundo invertido
    toggleUpsideDownDebug() {
        if (this.upsideDownManager) {
            this.upsideDownManager.toggleDebugMode();
        }
    }

    advanceToNextMission(completedMissionId) {
        // Encontrar próxima missão disponível (pode não ser sequencial)
        const allMissions = this.missionManager.missions;
        const sortedMissions = allMissions.sort((a, b) => a.id - b.id);
        
        let nextMission = null;
        for (const mission of sortedMissions) {
            if (mission.id > completedMissionId) {
                nextMission = mission;
                break;
            }
        }
        
        if (nextMission) {
            this.missionManager.startMission(nextMission.id);
            this.updateMissionUI(nextMission.id);
            
            // Definir novo destino no LocationManager
            this.locationManager.setTarget(
                nextMission.location.lat,
                nextMission.location.lng,
                nextMission.radius
            );
            
            Utils.log(`Avançando para missão ${nextMission.id}: ${nextMission.name}`);
        } else {
            // Limpar destino quando não há mais missões
            this.locationManager.clearTarget();
            Utils.log('Todas as missões completadas');
        }
    }

    handleMissionStart(missionId) {
        Utils.log(`Iniciando missão ${missionId}`);
        
        const mission = this.missionManager.getMission(missionId);
        if (mission) {
            // Configurar destino de navegação
            this.locationManager.setTarget(
                mission.location.lat,
                mission.location.lng,
                mission.radius
            );
            
            // Atualizar UI
            this.updateMissionUI(missionId);
        }
    }

    completeGame() {
        this.state.completeGame();
        
        // Mostrar tela de conclusão
        this.showGameComplete();
        
        Utils.log('Jogo completado!');
    }

    showGameComplete() {
        Utils.log('Mostrando tela de conclusão do jogo');
        
        // Parar câmera AR e limpar recursos
        this.arManager.stopCamera();
        this.locationManager.stopTracking();
        
        // Ocultar tela do jogo
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.classList.remove('active');
            gameScreen.classList.add('hidden');
        }
        
        // Mostrar tela de conclusão
        const completionScreen = document.getElementById('completion-screen');
        if (completionScreen) {
            completionScreen.classList.remove('hidden');
            completionScreen.classList.add('active');
            
            // Atualizar estatísticas
            this.updateCompletionStats();
            
            // Configurar botões
            this.setupCompletionButtons();
            
            // Reproduzir música de vitória se disponível
            this.playVictoryMusic();
        } else {
            Utils.log('Tela de conclusão não encontrada no HTML', 'error');
        }
    }

    updateCompletionStats() {
        const stats = this.state.getStats();
        const inventory = this.inventoryManager.getInventory();
        
        // Atualizar número de itens coletados
        const itemsCollectedElement = document.getElementById('items-collected');
        if (itemsCollectedElement) {
            itemsCollectedElement.textContent = inventory.length.toString();
        }
        
        Utils.log(`Estatísticas finais: ${stats.missionsCompleted} missões, ${inventory.length} itens`);
    }

    setupCompletionButtons() {
        // Botão jogar novamente
        const playAgainButton = document.getElementById('play-again');
        if (playAgainButton) {
            playAgainButton.addEventListener('click', () => {
                this.restartGame();
            });
        }
        
        // Botão compartilhar
        const shareButton = document.getElementById('share-victory');
        if (shareButton) {
            shareButton.addEventListener('click', () => {
                this.shareVictory();
            });
        }
    }

    async playVictoryMusic() {
        try {
            await this.audioManager.playAudio('sounds/music/victory.mp3', {
                loop: true,
                volume: 0.6
            });
            Utils.log('Música de vitória iniciada');
        } catch (error) {
            Utils.log(`Erro ao reproduzir música de vitória: ${error.message}`, 'warn');
        }
    }

    restartGame() {
        Utils.log('Reiniciando jogo...');
        
        // Parar todos os áudios
        this.audioManager.stopAll();
        
        // Limpar estado do jogo
        this.state.reset();
        
        // Recarregar página
        location.reload();
    }

    shareVictory() {
        const shareText = 'Acabei de completar o jogo Stranger Things AR! Salvei Will e derrotei o Demogorgon! 🎮👾';
        const shareUrl = window.location.href;
        
        if (navigator.share) {
            // Usar Web Share API se disponível
            navigator.share({
                title: 'Stranger Things AR - Vitória!',
                text: shareText,
                url: shareUrl
            }).catch(error => {
                Utils.log(`Erro ao compartilhar: ${error.message}`, 'warn');
                this.fallbackShare(shareText, shareUrl);
            });
        } else {
            this.fallbackShare(shareText, shareUrl);
        }
    }

    fallbackShare(text, url) {
        // Fallback para dispositivos sem Web Share API
        if (navigator.clipboard) {
            navigator.clipboard.writeText(`${text} ${url}`).then(() => {
                this.showShareMessage('Link copiado para a área de transferência!');
            }).catch(() => {
                this.showShareMessage('Não foi possível copiar o link');
            });
        } else {
            this.showShareMessage('Compartilhamento não suportado neste dispositivo');
        }
    }

    showShareMessage(message) {
        // Criar toast message temporária
        const toast = document.createElement('div');
        toast.className = 'share-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10000;
            font-family: 'Stranger Things', sans-serif;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000);
    }

    handleAudioEnded(audioId) {
        Utils.log(`Áudio finalizado: ${audioId}`);
        // Processar ações pós-áudio se necessário
    }

    // Controles de áudio
    toggleMute() {
        const isMuted = !this.audioManager.isSoundEnabled();
        this.audioManager.setSoundEnabled(isMuted);
        
        const muteButton = document.getElementById('mute-button');
        const icon = muteButton.querySelector('.audio-icon');
        
        if (isMuted) {
            icon.textContent = '🔊';
            muteButton.classList.remove('muted');
        } else {
            icon.textContent = '🔇';
            muteButton.classList.add('muted');
        }
        
        Utils.log(`Som ${isMuted ? 'habilitado' : 'desabilitado'}`);
    }

    setVolume(volume) {
        this.audioManager.setMasterVolume(volume);
        
        const muteButton = document.getElementById('mute-button');
        const icon = muteButton.querySelector('.audio-icon');
        
        if (volume === 0) {
            icon.textContent = '🔇';
            muteButton.classList.add('muted');
        } else if (volume < 0.5) {
            icon.textContent = '🔉';
            muteButton.classList.remove('muted');
        } else {
            icon.textContent = '🔊';
            muteButton.classList.remove('muted');
        }
        
        Utils.log(`Volume definido para: ${Math.round(volume * 100)}%`);
    }

    showAudioControls() {
        const audioControls = document.getElementById('audio-controls');
        audioControls.classList.remove('hidden');
    }

    hideAudioControls() {
        const audioControls = document.getElementById('audio-controls');
        audioControls.classList.add('hidden');
    }

    showError(message) {
        const errorScreen = document.getElementById('error-screen');
        const errorMessage = document.getElementById('error-message');
        
        errorMessage.textContent = message;
        
        // Adicionar botão de diagnóstico em modo debug
        if (this.state.isDebugMode()) {
            this.addDiagnosticButton(errorScreen);
        }
        
        // Ocultar outras telas
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        errorScreen.classList.add('active');
    }

    addDiagnosticButton(errorScreen) {
        // Verificar se já existe
        if (errorScreen.querySelector('.diagnostic-button')) return;
        
        const diagnosticButton = document.createElement('button');
        diagnosticButton.className = 'game-button diagnostic-button';
        diagnosticButton.textContent = 'Diagnóstico';
        diagnosticButton.style.marginTop = '1rem';
        diagnosticButton.style.backgroundColor = '#2196F3';
        
        diagnosticButton.addEventListener('click', () => {
            this.showDiagnosticModal();
        });
        
        const errorContent = errorScreen.querySelector('.error-content');
        errorContent.appendChild(diagnosticButton);
    }

    showDiagnosticModal() {
        const report = this.permissionHandler.generateCompatibilityReport();
        const permissions = this.permissionHandler.getPermissionStatus();
        const gameState = this.state.exportState();
        
        const modal = document.createElement('div');
        modal.className = 'permission-modal';
        modal.innerHTML = `
            <div class="permission-modal-content" style="max-width: 90%; width: 600px; max-height: 80vh; overflow-y: auto;">
                <h3>🔧 Diagnóstico do Sistema</h3>
                
                <div style="text-align: left; margin: 1rem 0;">
                    <h4>📊 Score de Compatibilidade: ${report.score}/100</h4>
                    <div style="background: #333; padding: 1rem; border-radius: 5px; margin: 0.5rem 0;">
                        <strong>Dispositivo:</strong> ${report.deviceInfo.platform}<br>
                        <strong>Navegador:</strong> ${report.deviceInfo.userAgent.split(' ').pop()}<br>
                        <strong>Resolução:</strong> ${report.deviceInfo.viewport.width}x${report.deviceInfo.viewport.height}<br>
                        <strong>Orientação:</strong> ${report.deviceInfo.screen.orientation}<br>
                        <strong>HTTPS:</strong> ${report.deviceInfo.isHTTPS ? '✅' : '❌'}<br>
                        <strong>Online:</strong> ${report.deviceInfo.onLine ? '✅' : '❌'}
                    </div>
                    
                    <h4>🔐 Permissões:</h4>
                    <div style="background: #333; padding: 1rem; border-radius: 5px; margin: 0.5rem 0;">
                        <strong>Câmera:</strong> ${permissions.camera ? '✅' : '❌'}<br>
                        <strong>Localização:</strong> ${permissions.location ? '✅' : '❌'}<br>
                        <strong>Vibração:</strong> ${permissions.vibration ? '✅' : '❌'}
                    </div>
                    
                    <h4>🛠️ Suporte de APIs:</h4>
                    <div style="background: #333; padding: 1rem; border-radius: 5px; margin: 0.5rem 0;">
                        <strong>WebGL:</strong> ${report.deviceInfo.support.webgl ? '✅' : '❌'}<br>
                        <strong>Service Worker:</strong> ${report.deviceInfo.support.serviceWorker ? '✅' : '❌'}<br>
                        <strong>Device Orientation:</strong> ${report.deviceInfo.support.deviceOrientation ? '✅' : '❌'}
                    </div>
                    
                    ${report.issues.length > 0 ? `
                    <h4>❌ Problemas Críticos:</h4>
                    <ul style="color: #ff6b6b; margin: 0.5rem 0;">
                        ${report.issues.map(issue => `<li>${issue}</li>`).join('')}
                    </ul>
                    ` : ''}
                    
                    ${report.warnings.length > 0 ? `
                    <h4>⚠️ Avisos:</h4>
                    <ul style="color: #ffa726; margin: 0.5rem 0;">
                        ${report.warnings.map(warning => `<li>${warning}</li>`).join('')}
                    </ul>
                    ` : ''}
                </div>
                
                <div class="permission-modal-buttons">
                    <button class="permission-button" id="copy-report">Copiar Relatório</button>
                    <button class="permission-button" id="export-logs">Exportar Logs</button>
                    <button class="permission-button close-button">Fechar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('#copy-report').addEventListener('click', () => {
            const reportText = JSON.stringify({
                compatibility: report,
                permissions,
                timestamp: new Date().toISOString()
            }, null, 2);
            
            navigator.clipboard.writeText(reportText).then(() => {
                alert('Relatório copiado para a área de transferência!');
            });
        });
        
        modal.querySelector('#export-logs').addEventListener('click', () => {
            const logs = {
                gameState: JSON.parse(gameState),
                compatibility: report,
                permissions,
                localStorage: this.exportLocalStorage(),
                timestamp: new Date().toISOString()
            };
            
            this.downloadJSON(logs, 'stranger-things-ar-logs.json');
        });
        
        modal.querySelector('.close-button').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    exportLocalStorage() {
        const storage = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('stranger-things-ar')) {
                storage[key] = localStorage.getItem(key);
            }
        }
        return storage;
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Cleanup quando o jogo é destruído
    cleanup() {
        if (this.permissionHandler) {
            this.permissionHandler.cleanup();
        }
        
        if (this.audioManager) {
            this.audioManager.cleanup?.();
        }
        
        if (this.locationManager) {
            this.locationManager.cleanup?.();
        }
        
        if (this.arManager) {
            this.arManager.cleanup?.();
        }
        
        Utils.log('Jogo limpo');
    }
}

// Exportar para uso global
window.StrangerThingsGame = StrangerThingsGame;