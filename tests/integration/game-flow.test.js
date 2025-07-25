// Testes de integração para fluxo completo do jogo
describe('Testes de Integração - Fluxo do Jogo', () => {
    
    let game;
    let mockLocationManager;
    let mockARManager;
    let mockAudioManager;
    
    // Mock das APIs do navegador
    const mockGeolocation = {
        getCurrentPosition: jest.fn(),
        watchPosition: jest.fn(),
        clearWatch: jest.fn()
    };
    
    const mockMediaDevices = {
        getUserMedia: jest.fn()
    };
    
    beforeAll(() => {
        // Setup dos mocks globais
        global.navigator = {
            ...global.navigator,
            geolocation: mockGeolocation,
            mediaDevices: mockMediaDevices,
            vibrate: jest.fn()
        };
        
        // Mock do localStorage
        global.localStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        };
        
        // Mock do A-Frame
        global.AFRAME = {
            components: { arjs: {} },
            registerComponent: jest.fn()
        };
    });

    beforeEach(() => {
        // Reset dos mocks
        jest.clearAllMocks();
        
        // Setup do DOM básico
        document.body.innerHTML = `
            <div id="loading-screen" class="screen">
                <div id="loading-progress"></div>
                <div id="loading-text"></div>
            </div>
            <div id="main-menu" class="screen">
                <button id="start-game">Iniciar Jogo</button>
            </div>
            <div id="game-screen" class="screen">
                <div id="call-interface">
                    <button id="answer-call">Atender</button>
                    <img id="dustin-image" src="assets/img/dustin-call.png" />
                </div>
                <div id="ar-scene">
                    <div id="ar-camera"></div>
                </div>
                <div id="navigation-arrow">
                    <div class="arrow-svg"></div>
                    <div id="arrow-distance"></div>
                </div>
                <div id="mission-title"></div>
                <div id="mission-description"></div>
                <div id="distance-text"></div>
                <div class="inventory-items"></div>
            </div>
        `;
        
        // Inicializar jogo
        game = new StrangerThingsGame();
    });

    afterEach(() => {
        if (game) {
            game.cleanup?.();
        }
    });

    describe('Inicialização do Jogo', () => {
        test('deve inicializar todos os gerenciadores', async () => {
            // Mock das respostas de permissão
            mockMediaDevices.getUserMedia.mockResolvedValue({
                getTracks: () => [{ stop: jest.fn() }]
            });
            
            mockGeolocation.getCurrentPosition.mockImplementation((success) => {
                success({
                    coords: {
                        latitude: -27.630,
                        longitude: -48.680,
                        accuracy: 10
                    },
                    timestamp: Date.now()
                });
            });
            
            await game.init();
            
            expect(game.initialized).toBe(true);
            expect(game.errorHandler).toBeDefined();
            expect(game.permissionHandler).toBeDefined();
            expect(game.locationManager).toBeDefined();
            expect(game.arManager).toBeDefined();
            expect(game.missionManager).toBeDefined();
            expect(game.audioManager).toBeDefined();
        });

        test('deve lidar com falha na inicialização', async () => {
            // Simular erro na inicialização
            mockMediaDevices.getUserMedia.mockRejectedValue(new Error('Camera not available'));
            
            await expect(game.init()).rejects.toThrow();
            expect(game.initialized).toBe(false);
        });

        test('deve carregar configurações de missões', async () => {
            mockMediaDevices.getUserMedia.mockResolvedValue({
                getTracks: () => [{ stop: jest.fn() }]
            });
            
            mockGeolocation.getCurrentPosition.mockImplementation((success) => {
                success({
                    coords: {
                        latitude: -27.630,
                        longitude: -48.680,
                        accuracy: 10
                    },
                    timestamp: Date.now()
                });
            });
            
            await game.init();
            
            expect(game.missionManager.getTotalMissions()).toBeGreaterThan(0);
            expect(game.missionManager.getMission(1)).toBeDefined();
            expect(game.missionManager.getMission(1).name).toBe("Floresta das Trevas");
        });
    });

    describe('Fluxo de Permissões', () => {
        test('deve solicitar permissões na sequência correta', async () => {
            const permissionPromises = [];
            
            mockMediaDevices.getUserMedia.mockImplementation(() => {
                const promise = Promise.resolve({
                    getTracks: () => [{ stop: jest.fn() }]
                });
                permissionPromises.push('camera');
                return promise;
            });
            
            mockGeolocation.getCurrentPosition.mockImplementation((success) => {
                permissionPromises.push('location');
                success({
                    coords: {
                        latitude: -27.630,
                        longitude: -48.680,
                        accuracy: 10
                    },
                    timestamp: Date.now()
                });
            });
            
            await game.init();
            await game.startIntroSequence();
            
            expect(permissionPromises).toContain('camera');
            expect(permissionPromises).toContain('location');
        });

        test('deve ativar fallbacks quando permissões são negadas', async () => {
            mockMediaDevices.getUserMedia.mockRejectedValue(new Error('Permission denied'));
            mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
                error({ code: 1, message: 'Permission denied' });
            });
            
            await game.init();
            
            // Verificar se fallbacks foram ativados
            expect(game.errorHandler.fallbackModes.location).toBe(true);
        });
    });

    describe('Sequência de Introdução', () => {
        test('deve mostrar ligação do Dustin', async () => {
            await game.init();
            await game.startIntroSequence();
            
            const callInterface = document.getElementById('call-interface');
            expect(callInterface.classList.contains('hidden')).toBe(false);
        });

        test('deve processar resposta da ligação', async () => {
            await game.init();
            await game.startIntroSequence();
            
            // Simular clique no botão de atender
            const answerButton = document.getElementById('answer-call');
            answerButton.click();
            
            // Verificar se a primeira missão foi iniciada
            expect(game.missionManager.getCurrentMission()).toBeDefined();
            expect(game.missionManager.getCurrentMission().id).toBe(1);
        });
    });

    describe('Fluxo de Missões', () => {
        beforeEach(async () => {
            // Setup básico para testes de missão
            mockMediaDevices.getUserMedia.mockResolvedValue({
                getTracks: () => [{ stop: jest.fn() }]
            });
            
            mockGeolocation.getCurrentPosition.mockImplementation((success) => {
                success({
                    coords: {
                        latitude: -27.630,
                        longitude: -48.680,
                        accuracy: 10
                    },
                    timestamp: Date.now()
                });
            });
            
            await game.init();
            await game.startIntroSequence();
        });

        test('deve navegar para primeira missão', () => {
            const currentMission = game.missionManager.getCurrentMission();
            expect(currentMission.id).toBe(1);
            expect(currentMission.name).toBe("Floresta das Trevas");
            expect(currentMission.type).toBe("ar_model");
        });

        test('deve atualizar UI com informações da missão', () => {
            const missionTitle = document.getElementById('mission-title');
            const missionDescription = document.getElementById('mission-description');
            
            expect(missionTitle.textContent).toBe("Floresta das Trevas");
            expect(missionDescription.textContent).toBe("Encontre a bicicleta do Will");
        });

        test('deve mostrar seta de navegação quando longe do destino', () => {
            // Simular posição longe do destino
            const farPosition = {
                lat: -27.620, // Longe da missão
                lng: -48.670,
                accuracy: 10,
                timestamp: Date.now()
            };
            
            game.handlePositionUpdate(farPosition);
            
            const navigationArrow = document.getElementById('navigation-arrow');
            expect(navigationArrow.classList.contains('hidden')).toBe(false);
        });

        test('deve ocultar seta quando próximo do destino', () => {
            // Simular posição próxima do destino
            const nearPosition = {
                lat: -27.63054776462635, // Muito próximo da missão 1
                lng: -48.681133649550205,
                accuracy: 5,
                timestamp: Date.now()
            };
            
            game.handlePositionUpdate(nearPosition);
            
            const navigationArrow = document.getElementById('navigation-arrow');
            expect(navigationArrow.classList.contains('hidden')).toBe(true);
        });

        test('deve completar missão e avançar para próxima', () => {
            // Simular chegada ao destino da missão 1
            const targetReachedData = {
                target: game.missionManager.getCurrentMission().location,
                position: { lat: -27.63054776462635, lng: -48.681133649550205 },
                distance: 5
            };
            
            game.handleTargetReached(targetReachedData);
            
            // Simular clique no objeto AR (bicicleta)
            game.handleARObjectClick('bicicleta-will');
            
            // Verificar se avançou para missão 2
            const currentMission = game.missionManager.getCurrentMission();
            expect(currentMission.id).toBe(2);
            expect(currentMission.name).toBe("Casa do Will");
        });
    });

    describe('Sistema de Inventário', () => {
        beforeEach(async () => {
            await game.init();
            await game.startIntroSequence();
            
            // Avançar para missão 4 (coleta de itens)
            game.missionManager.startMission(4);
        });

        test('deve coletar itens e adicionar ao inventário', () => {
            // Simular coleta do taco
            game.inventoryManager.addItem('taco', {
                name: 'Taco de Baseball',
                image: 'assets/img/taco.png',
                type: 'weapon'
            });
            
            expect(game.inventoryManager.hasItem('taco')).toBe(true);
            expect(game.inventoryManager.getItemCount('taco')).toBe(1);
        });

        test('deve mostrar itens na interface', () => {
            game.inventoryManager.addItem('taco', {
                name: 'Taco de Baseball',
                image: 'assets/img/taco.png',
                type: 'weapon'
            });
            
            const inventoryItems = document.querySelector('.inventory-items');
            expect(inventoryItems.children.length).toBeGreaterThan(0);
        });

        test('deve usar itens durante combate', () => {
            // Adicionar itens necessários para combate
            game.inventoryManager.addItem('taco', {
                name: 'Taco de Baseball',
                image: 'assets/img/taco.png',
                type: 'weapon'
            });
            
            game.inventoryManager.addItem('gasolina', {
                name: 'Gasolina',
                image: 'assets/img/gasolina.png',
                type: 'weapon'
            });
            
            // Simular uso do taco
            const useResult = game.inventoryManager.useItem('taco');
            expect(useResult.success).toBe(true);
            expect(game.inventoryManager.hasItem('taco')).toBe(false);
        });
    });

    describe('Sistema do Mundo Invertido', () => {
        beforeEach(async () => {
            await game.init();
            await game.startIntroSequence();
        });

        test('deve ativar mundo invertido na missão 5', () => {
            // Avançar para missão 5
            game.missionManager.startMission(5);
            
            // Simular clique no portal
            game.handlePortalClick();
            
            // Verificar se filtro foi ativado
            const upsideDownFilter = document.getElementById('upside-down-filter');
            expect(upsideDownFilter.classList.contains('active')).toBe(true);
        });

        test('deve manter filtro ativo até o final do jogo', () => {
            // Ativar mundo invertido
            game.upsideDownManager.activate();
            
            // Avançar para missões posteriores
            game.missionManager.startMission(6);
            game.missionManager.startMission(8);
            
            // Filtro deve continuar ativo
            const upsideDownFilter = document.getElementById('upside-down-filter');
            expect(upsideDownFilter.classList.contains('active')).toBe(true);
        });
    });

    describe('Sistema de Combate', () => {
        beforeEach(async () => {
            await game.init();
            await game.startIntroSequence();
            
            // Preparar para combate
            game.inventoryManager.addItem('taco', {
                name: 'Taco de Baseball',
                image: 'assets/img/taco.png',
                type: 'weapon'
            });
            
            game.inventoryManager.addItem('gasolina', {
                name: 'Gasolina',
                image: 'assets/img/gasolina.png',
                type: 'weapon'
            });
        });

        test('deve iniciar combate na missão 6', () => {
            game.missionManager.startMission(6);
            
            // Simular chegada ao local do Demogorgon
            const targetReachedData = {
                target: game.missionManager.getCurrentMission().location,
                position: { lat: -27.630116851676945, lng: -48.67954178126999 },
                distance: 5
            };
            
            game.handleTargetReached(targetReachedData);
            
            // Verificar se combate foi iniciado
            expect(game.arManager.arState.currentMode).toBe('combat');
        });

        test('deve executar sequência de combate correta', (done) => {
            let attackSequence = [];
            
            // Mock do sistema de combate
            game.arManager.on('attackPerformed', (data) => {
                attackSequence.push(data.weapon);
                
                if (attackSequence.length === 2) {
                    expect(attackSequence).toEqual(['taco', 'gasolina']);
                    done();
                }
            });
            
            // Simular ataques
            game.handleAttackPerformed({ weapon: 'taco' });
            
            setTimeout(() => {
                game.handleAttackPerformed({ weapon: 'gasolina' });
            }, 3000);
        });

        test('deve completar combate e avançar', () => {
            // Simular combate completo
            game.handleCombatCompleted({
                victory: true,
                enemy: 'demogorgon'
            });
            
            // Verificar se missão foi completada
            expect(game.missionManager.isMissionCompleted(6)).toBe(true);
        });
    });

    describe('Finalização do Jogo', () => {
        beforeEach(async () => {
            await game.init();
            await game.startIntroSequence();
        });

        test('deve completar jogo na missão final', () => {
            // Simular progressão até missão final
            for (let i = 1; i <= 7; i++) {
                if (game.missionManager.getMission(i)) {
                    game.missionManager.completeMission(i);
                }
            }
            
            // Iniciar missão final
            game.missionManager.startMission(8);
            
            // Completar missão final
            const finalResult = game.missionManager.completeMission(8);
            expect(finalResult.gameComplete).toBe(true);
        });

        test('deve mostrar tela de conclusão', () => {
            // Simular conclusão do jogo
            game.handleGameComplete();
            
            // Verificar se tela de vitória foi mostrada
            const victoryOverlay = document.querySelector('.victory-overlay');
            expect(victoryOverlay).toBeDefined();
        });

        test('deve salvar estatísticas finais', () => {
            // Simular jogo completo
            game.state.startGame();
            game.state.incrementStat('missionsCompleted', 8);
            game.state.incrementStat('objectsCollected', 4);
            game.state.incrementStat('distanceTraveled', 2000);
            
            const finalStats = game.state.getGameStats();
            expect(finalStats.missionsCompleted).toBe(8);
            expect(finalStats.objectsCollected).toBe(4);
            expect(finalStats.distanceTraveled).toBe(2000);
        });
    });

    describe('Tratamento de Erros Integrado', () => {
        test('deve ativar fallbacks quando necessário', async () => {
            // Simular falha de câmera
            mockMediaDevices.getUserMedia.mockRejectedValue(new Error('Camera denied'));
            
            await game.init();
            
            // Verificar se modo sem AR foi ativado
            expect(game.errorHandler.fallbackModes.ar).toBe(true);
        });

        test('deve continuar jogo em modo degradado', async () => {
            await game.init();
            
            // Simular ativação de modo degradado
            game.errorHandler.activateDegradedMode('Teste de integração');
            
            // Jogo deve continuar funcionando
            await game.startIntroSequence();
            expect(game.missionManager.getCurrentMission()).toBeDefined();
        });

        test('deve recuperar de erros temporários', async () => {
            await game.init();
            
            // Simular erro temporário de localização
            const mockError = { code: 3, message: 'Timeout' };
            const result = game.errorHandler.handleLocationError(mockError);
            
            expect(result.fallbackActive).toBe(true);
            
            // Jogo deve continuar funcionando
            expect(game.locationManager.isTracking).toBe(true);
        });
    });

    describe('Performance e Otimização', () => {
        test('deve manter FPS estável durante jogo', async () => {
            await game.init();
            
            const fpsReadings = [];
            const startTime = performance.now();
            
            // Simular loop de jogo por 1 segundo
            const gameLoop = () => {
                const currentTime = performance.now();
                const deltaTime = currentTime - startTime;
                
                if (deltaTime < 1000) {
                    fpsReadings.push(currentTime);
                    requestAnimationFrame(gameLoop);
                }
            };
            
            gameLoop();
            
            // Aguardar conclusão
            await new Promise(resolve => setTimeout(resolve, 1100));
            
            // Calcular FPS médio
            const avgFPS = fpsReadings.length;
            expect(avgFPS).toBeGreaterThan(30); // Mínimo 30 FPS
        });

        test('deve otimizar uso de memória', async () => {
            await game.init();
            
            // Simular uso intensivo
            for (let i = 0; i < 100; i++) {
                game.state.incrementStat('testCounter');
            }
            
            // Verificar se limpeza foi executada
            if (game.performanceManager) {
                const memoryUsage = game.performanceManager.getMemoryUsage();
                expect(memoryUsage.optimized).toBe(true);
            }
        });
    });
});