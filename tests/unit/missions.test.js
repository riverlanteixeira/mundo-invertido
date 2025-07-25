// Testes unitários para lógica de missões e transições
describe('Testes de Missões', () => {
    
    let missionManager;
    let gameState;
    
    const testMissions = [
        {
            id: 1,
            name: "Floresta das Trevas",
            description: "Encontre a bicicleta do Will",
            type: "ar_model",
            location: { lat: -27.63054776462635, lng: -48.681133649550205 },
            radius: 20,
            arContent: {
                type: "model",
                path: "assets/models/bicicleta-will.glb",
                scale: [1, 1, 1],
                position: [0, 0, -2]
            },
            audio: { completion: "sounds/call/dustin-missao-1-completa.wav" }
        },
        {
            id: 2,
            name: "Casa do Will",
            description: "Procure pistas nas paredes",
            type: "image_tracking",
            location: { lat: -27.630903061716687, lng: -48.67974685847095 },
            radius: 20,
            arContent: {
                type: "image_tracking",
                markerImage: "assets/img/the-big-bang-theory.jpg",
                overlayGif: "assets/gif/luzes-piscando.gif",
                audioDelay: 10000
            },
            audio: { completion: "sounds/call/dustin-missao-2-completa.wav" }
        },
        {
            id: 3,
            name: "Fuga do Demogorgon",
            description: "Fuja para local seguro",
            type: "navigation",
            location: { lat: -27.630111492213196, lng: -48.67959126452254 },
            radius: 20,
            audio: { completion: "sounds/call/dustin-missao-3-completa.wav" }
        }
    ];

    beforeEach(() => {
        gameState = new GameState();
        missionManager = new MissionManager();
        missionManager.loadMissions(testMissions);
    });

    afterEach(() => {
        if (missionManager) {
            missionManager.cleanup?.();
        }
        if (gameState) {
            gameState.cleanup?.();
        }
    });

    describe('MissionManager - Inicialização', () => {
        test('deve carregar missões corretamente', () => {
            expect(missionManager.missions.size).toBe(3);
            expect(missionManager.getMission(1)).toBeDefined();
            expect(missionManager.getMission(1).name).toBe("Floresta das Trevas");
        });

        test('deve definir primeira missão como atual', () => {
            missionManager.startMission(1);
            const currentMission = missionManager.getCurrentMission();
            expect(currentMission).toBeDefined();
            expect(currentMission.id).toBe(1);
        });

        test('deve lidar com missões inexistentes', () => {
            expect(missionManager.getMission(999)).toBeUndefined();
        });
    });

    describe('MissionManager - Transições', () => {
        test('deve completar missão e avançar para próxima', () => {
            missionManager.startMission(1);
            
            const completionResult = missionManager.completeMission(1);
            expect(completionResult.success).toBe(true);
            expect(completionResult.nextMission).toBe(2);
            
            const currentMission = missionManager.getCurrentMission();
            expect(currentMission.id).toBe(2);
        });

        test('deve marcar missão como completada', () => {
            missionManager.startMission(1);
            missionManager.completeMission(1);
            
            expect(missionManager.isMissionCompleted(1)).toBe(true);
            expect(missionManager.isMissionCompleted(2)).toBe(false);
        });

        test('deve lidar com tentativa de completar missão já completada', () => {
            missionManager.startMission(1);
            missionManager.completeMission(1);
            
            const secondCompletion = missionManager.completeMission(1);
            expect(secondCompletion.success).toBe(false);
            expect(secondCompletion.reason).toContain('já foi completada');
        });

        test('deve lidar com tentativa de completar missão inexistente', () => {
            const result = missionManager.completeMission(999);
            expect(result.success).toBe(false);
            expect(result.reason).toContain('não encontrada');
        });

        test('deve detectar fim do jogo na última missão', () => {
            // Simular progressão até última missão
            missionManager.startMission(1);
            missionManager.completeMission(1);
            missionManager.completeMission(2);
            
            const finalResult = missionManager.completeMission(3);
            expect(finalResult.gameComplete).toBe(true);
        });
    });

    describe('MissionManager - Estados', () => {
        test('deve rastrear progresso das missões', () => {
            missionManager.startMission(1);
            
            expect(missionManager.getCompletedMissions()).toEqual([]);
            expect(missionManager.getTotalMissions()).toBe(3);
            expect(missionManager.getProgress()).toBe(0);
            
            missionManager.completeMission(1);
            
            expect(missionManager.getCompletedMissions()).toEqual([1]);
            expect(missionManager.getProgress()).toBeCloseTo(33.33, 1);
        });

        test('deve identificar tipos de missão corretamente', () => {
            expect(missionManager.getMissionType(1)).toBe('ar_model');
            expect(missionManager.getMissionType(2)).toBe('image_tracking');
            expect(missionManager.getMissionType(3)).toBe('navigation');
        });

        test('deve fornecer informações de localização', () => {
            const mission1 = missionManager.getMission(1);
            expect(mission1.location.lat).toBe(-27.63054776462635);
            expect(mission1.location.lng).toBe(-48.681133649550205);
            expect(mission1.radius).toBe(20);
        });
    });

    describe('GameState - Gerenciamento de Estado', () => {
        test('deve inicializar com estado padrão', () => {
            expect(gameState.isGameStarted()).toBe(false);
            expect(gameState.getCurrentMission()).toBeNull();
            expect(gameState.getPlayerPosition()).toBeNull();
        });

        test('deve iniciar jogo corretamente', () => {
            gameState.startGame();
            expect(gameState.isGameStarted()).toBe(true);
            expect(gameState.getGameStartTime()).toBeDefined();
        });

        test('deve gerenciar posição do jogador', () => {
            const position = { lat: -27.630, lng: -48.680, accuracy: 10 };
            gameState.setPlayerPosition(position.lat, position.lng, position.accuracy);
            
            const storedPosition = gameState.getPlayerPosition();
            expect(storedPosition.lat).toBe(position.lat);
            expect(storedPosition.lng).toBe(position.lng);
            expect(storedPosition.accuracy).toBe(position.accuracy);
        });

        test('deve gerenciar permissões', () => {
            expect(gameState.hasPermission('camera')).toBe(false);
            
            gameState.setPermission('camera', true);
            expect(gameState.hasPermission('camera')).toBe(true);
            
            gameState.setPermission('camera', false);
            expect(gameState.hasPermission('camera')).toBe(false);
        });

        test('deve persistir estado no localStorage', () => {
            gameState.startGame();
            gameState.setCurrentMission(2);
            
            // Criar novo GameState para simular reload
            const newGameState = new GameState();
            newGameState.loadState();
            
            expect(newGameState.isGameStarted()).toBe(true);
            expect(newGameState.getCurrentMission()).toBe(2);
        });
    });

    describe('Integração Missões + Estado', () => {
        test('deve sincronizar estado do jogo com progresso das missões', () => {
            gameState.startGame();
            missionManager.startMission(1);
            gameState.setCurrentMission(1);
            
            expect(gameState.getCurrentMission()).toBe(1);
            expect(missionManager.getCurrentMission().id).toBe(1);
            
            missionManager.completeMission(1);
            gameState.setCurrentMission(2);
            
            expect(gameState.getCurrentMission()).toBe(2);
            expect(missionManager.getCurrentMission().id).toBe(2);
        });

        test('deve calcular tempo de jogo corretamente', () => {
            gameState.startGame();
            
            // Simular passagem de tempo
            const originalNow = Date.now;
            Date.now = jest.fn(() => originalNow() + 60000); // +1 minuto
            
            const playTime = gameState.getPlayTime();
            expect(playTime).toBeGreaterThanOrEqual(60000);
            
            Date.now = originalNow; // Restaurar
        });

        test('deve rastrear estatísticas de jogo', () => {
            gameState.startGame();
            missionManager.startMission(1);
            
            // Simular algumas ações
            gameState.incrementStat('objectsCollected');
            gameState.incrementStat('objectsCollected');
            gameState.incrementStat('distanceTraveled', 150);
            
            const stats = gameState.getGameStats();
            expect(stats.objectsCollected).toBe(2);
            expect(stats.distanceTraveled).toBe(150);
            expect(stats.missionsCompleted).toBe(0);
            
            missionManager.completeMission(1);
            gameState.incrementStat('missionsCompleted');
            
            const updatedStats = gameState.getGameStats();
            expect(updatedStats.missionsCompleted).toBe(1);
        });
    });

    describe('Validação de Missões', () => {
        test('deve validar estrutura de missão', () => {
            const invalidMission = {
                id: 4,
                name: "Missão Inválida"
                // Faltando campos obrigatórios
            };
            
            expect(() => {
                missionManager.validateMission(invalidMission);
            }).toThrow();
        });

        test('deve validar coordenadas de missão', () => {
            const missionWithInvalidCoords = {
                id: 4,
                name: "Missão com Coordenadas Inválidas",
                type: "navigation",
                location: { lat: 91, lng: 181 }, // Coordenadas inválidas
                radius: 20
            };
            
            expect(() => {
                missionManager.validateMission(missionWithInvalidCoords);
            }).toThrow();
        });

        test('deve validar tipos de missão suportados', () => {
            const missionWithInvalidType = {
                id: 4,
                name: "Missão com Tipo Inválido",
                type: "invalid_type",
                location: { lat: -27.630, lng: -48.680 },
                radius: 20
            };
            
            expect(() => {
                missionManager.validateMission(missionWithInvalidType);
            }).toThrow();
        });
    });

    describe('Eventos de Missão', () => {
        test('deve emitir eventos ao iniciar missão', (done) => {
            missionManager.on('missionStart', (missionId) => {
                expect(missionId).toBe(1);
                done();
            });
            
            missionManager.startMission(1);
        });

        test('deve emitir eventos ao completar missão', (done) => {
            missionManager.on('missionComplete', (data) => {
                expect(data.missionId).toBe(1);
                expect(data.nextMission).toBe(2);
                done();
            });
            
            missionManager.startMission(1);
            missionManager.completeMission(1);
        });

        test('deve emitir evento ao completar jogo', (done) => {
            missionManager.on('gameComplete', (data) => {
                expect(data.totalMissions).toBe(3);
                expect(data.completedMissions).toEqual([1, 2, 3]);
                done();
            });
            
            // Completar todas as missões
            missionManager.startMission(1);
            missionManager.completeMission(1);
            missionManager.completeMission(2);
            missionManager.completeMission(3);
        });
    });

    describe('Persistência de Missões', () => {
        test('deve salvar progresso das missões', () => {
            missionManager.startMission(1);
            missionManager.completeMission(1);
            
            const progress = missionManager.saveProgress();
            expect(progress.currentMission).toBe(2);
            expect(progress.completedMissions).toContain(1);
        });

        test('deve carregar progresso das missões', () => {
            const savedProgress = {
                currentMission: 2,
                completedMissions: [1],
                gameStartTime: Date.now() - 300000 // 5 minutos atrás
            };
            
            missionManager.loadProgress(savedProgress);
            
            expect(missionManager.getCurrentMission().id).toBe(2);
            expect(missionManager.isMissionCompleted(1)).toBe(true);
            expect(missionManager.isMissionCompleted(2)).toBe(false);
        });

        test('deve lidar com progresso corrompido', () => {
            const corruptedProgress = {
                currentMission: 999, // Missão inexistente
                completedMissions: [1, 999],
                gameStartTime: "invalid_date"
            };
            
            expect(() => {
                missionManager.loadProgress(corruptedProgress);
            }).not.toThrow();
            
            // Deve resetar para estado inicial
            expect(missionManager.getCurrentMission()).toBeNull();
        });
    });

    describe('Performance de Missões', () => {
        test('deve lidar com muitas missões eficientemente', () => {
            const manyMissions = [];
            for (let i = 1; i <= 100; i++) {
                manyMissions.push({
                    id: i,
                    name: `Missão ${i}`,
                    type: 'navigation',
                    location: { lat: -27.630 + (i * 0.001), lng: -48.680 + (i * 0.001) },
                    radius: 20
                });
            }
            
            const start = performance.now();
            missionManager.loadMissions(manyMissions);
            const end = performance.now();
            
            expect(end - start).toBeLessThan(100); // Deve carregar em menos de 100ms
            expect(missionManager.getTotalMissions()).toBe(100);
        });

        test('deve buscar missões rapidamente', () => {
            const start = performance.now();
            
            for (let i = 0; i < 1000; i++) {
                missionManager.getMission(1);
                missionManager.getMission(2);
                missionManager.getMission(3);
            }
            
            const end = performance.now();
            expect(end - start).toBeLessThan(50); // 3000 buscas em menos de 50ms
        });
    });

    describe('Casos Extremos', () => {
        test('deve lidar com missões sem conteúdo AR', () => {
            const missionWithoutAR = {
                id: 4,
                name: "Missão sem AR",
                type: "navigation",
                location: { lat: -27.630, lng: -48.680 },
                radius: 20
            };
            
            expect(() => {
                missionManager.loadMissions([missionWithoutAR]);
                missionManager.startMission(4);
            }).not.toThrow();
        });

        test('deve lidar com raio de missão muito pequeno', () => {
            const missionWithSmallRadius = {
                id: 4,
                name: "Missão com Raio Pequeno",
                type: "navigation",
                location: { lat: -27.630, lng: -48.680 },
                radius: 1 // 1 metro
            };
            
            missionManager.loadMissions([missionWithSmallRadius]);
            expect(missionManager.getMission(4).radius).toBe(1);
        });

        test('deve lidar com raio de missão muito grande', () => {
            const missionWithLargeRadius = {
                id: 4,
                name: "Missão com Raio Grande",
                type: "navigation",
                location: { lat: -27.630, lng: -48.680 },
                radius: 1000 // 1 km
            };
            
            missionManager.loadMissions([missionWithLargeRadius]);
            expect(missionManager.getMission(4).radius).toBe(1000);
        });
    });
});