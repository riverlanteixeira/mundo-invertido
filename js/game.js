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
        
        // Eventos de localização
        this.locationManager.on('positionUpdate', (position) => {
            this.handlePositionUpdate(position);
        });
        
        this.locationManager.on('targetReached', (target) => {
            this.handleTargetReached(target);
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
        // Solicitar permissão de câmera
        const cameraGranted = await this.permissionHandler.requestCameraPermission();
        this.state.setPermission('camera', cameraGranted);
        
        if (!cameraGranted) {
            throw new Error('Permissão de câmera é necessária para jogar');
        }
        
        Utils.log('Permissões iniciais obtidas');
    }

    showDustinCall() {
        this.elements.callInterface.classList.remove('hidden');
        this.elements.callInterface.classList.add('fade-in');
        
        // Reproduzir som de chamada se disponível
        this.audioManager.playAudio('sounds/effects/radio-static.wav', { loop: true, volume: 0.3 });
        
        Utils.log('Ligação do Dustin exibida');
    }

    async handleCallAnswer() {
        Utils.log('Ligação atendida');
        
        // Parar som de chamada
        this.audioManager.stopAll();
        
        // Reproduzir áudio de introdução
        await this.audioManager.playAudio('sounds/call/dustin-intro.wav');
        
        // Ocultar interface de ligação
        this.elements.callInterface.classList.add('fade-out');
        setTimeout(() => {
            this.elements.callInterface.classList.add('hidden');
            this.elements.callInterface.classList.remove('fade-out');
        }, 500);
        
        // Iniciar primeira missão
        this.startFirstMission();
    }

    async startFirstMission() {
        Utils.log('Iniciando primeira missão...');
        
        try {
            // Solicitar permissão de localização
            const locationGranted = await this.permissionHandler.requestLocationPermission();
            this.state.setPermission('location', locationGranted);
            
            if (!locationGranted) {
                throw new Error('Permissão de localização é necessária');
            }
            
            // Ativar câmera AR
            await this.arManager.startCamera();
            this.elements.arScene.classList.remove('hidden');
            
            // Iniciar rastreamento de localização
            await this.locationManager.startTracking();
            
            // Definir primeira missão
            this.missionManager.startMission(1);
            
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
        
        this.elements.navigationArrow.classList.remove('hidden');
        this.elements.navigationArrow.querySelector('.arrow-svg').style.transform = 
            `rotate(${bearing}deg)`;
    }

    hideNavigationArrow() {
        this.elements.navigationArrow.classList.add('hidden');
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

    handleTargetReached(mission) {
        Utils.log(`Destino alcançado: ${mission.name}`);
        
        // Ativar conteúdo AR específico da missão
        this.activateMissionAR(mission);
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
            Utils.log(`Avançando para missão ${nextMissionId}`);
        } else {
            Utils.log('Todas as missões completadas');
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

    showError(message) {
        const errorScreen = document.getElementById('error-screen');
        const errorMessage = document.getElementById('error-message');
        
        errorMessage.textContent = message;
        
        // Ocultar outras telas
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        errorScreen.classList.add('active');
    }
}

// Exportar para uso global
window.StrangerThingsGame = StrangerThingsGame;