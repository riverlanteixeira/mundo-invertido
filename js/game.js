// Classe principal do jogo Stranger Things AR
class StrangerThingsGame {
    constructor() {
        this.state = new GameState();
        this.audioManager = null;
        this.locationManager = null;
        this.arManager = null;
        this.missionManager = null;
        this.permissionHandler = null;
        
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
        this.permissionHandler = new PermissionHandler();
        this.audioManager = new AudioManager();
        this.locationManager = new LocationManager();
        this.arManager = new ARManager();
        this.missionManager = new MissionManager();
        
        // Inicializar cada gerenciador
        await this.audioManager.init();
        await this.locationManager.init();
        await this.arManager.init();
        await this.missionManager.init();
        
        Utils.log('Todos os gerenciadores inicializados');
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
        
        // Eventos de áudio
        this.audioManager.on('audioEnded', (audioId) => {
            this.handleAudioEnded(audioId);
        });
        
        Utils.log('Event listeners configurados');
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
                id: 7,
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
        
        // Mostrar mensagem de erro específica
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
        switch (mission.type) {
            case 'ar_model':
                if (objectId === 'bicicleta-will') {
                    this.missionManager.completeMission(mission.id);
                }
                break;
            case 'ar_collection':
                this.collectItem(objectId);
                break;
            case 'combat':
                this.handleCombatAction(objectId);
                break;
        }
    }

    collectItem(itemId) {
        this.state.addToInventory(itemId);
        this.updateInventoryUI();
        
        // Verificar se todos os itens da missão foram coletados
        const currentMission = this.missionManager.getCurrentMission();
        if (currentMission.type === 'ar_collection') {
            const requiredItems = currentMission.arContent.items.map(item => item.id);
            const hasAllItems = requiredItems.every(item => this.state.hasInInventory(item));
            
            if (hasAllItems) {
                this.missionManager.completeMission(currentMission.id);
            }
        }
    }

    updateInventoryUI() {
        const inventory = this.state.getInventory();
        this.elements.inventoryItems.innerHTML = '';
        
        inventory.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.style.backgroundImage = `url(assets/img/${item}.png)`;
            this.elements.inventoryItems.appendChild(itemElement);
        });
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
        this.state.enableUpsideDownMode();
        this.elements.upsideDownFilter.classList.remove('hidden');
        this.elements.upsideDownFilter.classList.add('active');
        
        // Adicionar partículas
        this.createFloatingParticles();
        
        Utils.log('Modo mundo invertido ativado');
    }

    createFloatingParticles() {
        const particlesContainer = this.elements.upsideDownFilter.querySelector('.particles-overlay');
        
        // Criar 20 partículas
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 8}s`;
            particle.style.animationDuration = `${8 + Math.random() * 4}s`;
            particlesContainer.appendChild(particle);
        }
    }

    advanceToNextMission(completedMissionId) {
        const nextMissionId = completedMissionId + 1;
        const nextMission = this.missionManager.getMission(nextMissionId);
        
        if (nextMission) {
            this.missionManager.startMission(nextMissionId);
            this.updateMissionUI(nextMissionId);
            
            // Definir novo destino no LocationManager
            this.locationManager.setTarget(
                nextMission.location.lat,
                nextMission.location.lng,
                nextMission.radius
            );
            
            Utils.log(`Avançando para missão ${nextMissionId}: ${nextMission.name}`);
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
        const stats = this.state.getStats();
        
        // Criar tela de conclusão
        const completeScreen = document.createElement('div');
        completeScreen.className = 'screen active';
        completeScreen.innerHTML = `
            <div class="complete-content">
                <h1 class="stranger-title">PARABÉNS!</h1>
                <h2>Você salvou Will!</h2>
                <div class="stats">
                    <p>Tempo: ${this.state.getFormattedTimeSpent()}</p>
                    <p>Distância: ${Utils.formatDistance(stats.totalDistance)}</p>
                    <p>Missões: ${stats.missionsCompleted}</p>
                </div>
                <button class="game-button" onclick="location.reload()">Jogar Novamente</button>
            </div>
        `;
        
        document.body.appendChild(completeScreen);
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