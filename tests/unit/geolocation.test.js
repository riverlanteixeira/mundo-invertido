// Testes unitários para cálculos de geolocalização
describe('Testes de Geolocalização', () => {
    
    // Coordenadas de teste baseadas no bairro Pedra Branca
    const testLocations = {
        floresta: { lat: -27.63054776462635, lng: -48.681133649550205 },
        casaWill: { lat: -27.630903061716687, lng: -48.67974685847095 },
        fugaDemogorgon: { lat: -27.630111492213196, lng: -48.67959126452254 },
        lojaMelvald: { lat: -27.62568754766323, lng: -48.679824079211336 },
        laboratorio: { lat: -27.624056768580015, lng: -48.68124296486716 },
        demogorgon: { lat: -27.630116851676945, lng: -48.67954178126999 }
    };

    describe('Utils.calculateDistance', () => {
        test('deve calcular distância correta entre dois pontos próximos', () => {
            const distance = Utils.calculateDistance(
                testLocations.floresta.lat, testLocations.floresta.lng,
                testLocations.casaWill.lat, testLocations.casaWill.lng
            );
            
            // Distância esperada entre floresta e casa do Will (aproximadamente 300m)
            expect(distance).toBeGreaterThan(250);
            expect(distance).toBeLessThan(350);
        });

        test('deve retornar 0 para coordenadas idênticas', () => {
            const distance = Utils.calculateDistance(
                testLocations.floresta.lat, testLocations.floresta.lng,
                testLocations.floresta.lat, testLocations.floresta.lng
            );
            
            expect(distance).toBe(0);
        });

        test('deve calcular distância correta para pontos mais distantes', () => {
            const distance = Utils.calculateDistance(
                testLocations.floresta.lat, testLocations.floresta.lng,
                testLocations.laboratorio.lat, testLocations.laboratorio.lng
            );
            
            // Distância esperada entre floresta e laboratório (aproximadamente 800m)
            expect(distance).toBeGreaterThan(700);
            expect(distance).toBeLessThan(900);
        });

        test('deve lidar com coordenadas inválidas', () => {
            expect(() => {
                Utils.calculateDistance(null, null, 0, 0);
            }).toThrow();
            
            expect(() => {
                Utils.calculateDistance(91, 0, 0, 0); // Latitude inválida
            }).toThrow();
            
            expect(() => {
                Utils.calculateDistance(0, 181, 0, 0); // Longitude inválida
            }).toThrow();
        });
    });

    describe('Utils.calculateBearing', () => {
        test('deve calcular bearing correto para direção norte', () => {
            const bearing = Utils.calculateBearing(
                -27.630, -48.680,
                -27.625, -48.680 // Mesmo longitude, latitude menor (norte)
            );
            
            // Bearing para norte deve ser próximo de 0°
            expect(bearing).toBeGreaterThan(-10);
            expect(bearing).toBeLessThan(10);
        });

        test('deve calcular bearing correto para direção leste', () => {
            const bearing = Utils.calculateBearing(
                -27.630, -48.680,
                -27.630, -48.675 // Mesma latitude, longitude maior (leste)
            );
            
            // Bearing para leste deve ser próximo de 90°
            expect(bearing).toBeGreaterThan(80);
            expect(bearing).toBeLessThan(100);
        });

        test('deve calcular bearing correto para direção sul', () => {
            const bearing = Utils.calculateBearing(
                -27.625, -48.680,
                -27.630, -48.680 // Mesmo longitude, latitude maior (sul)
            );
            
            // Bearing para sul deve ser próximo de 180°
            expect(bearing).toBeGreaterThan(170);
            expect(bearing).toBeLessThan(190);
        });

        test('deve calcular bearing correto para direção oeste', () => {
            const bearing = Utils.calculateBearing(
                -27.630, -48.675,
                -27.630, -48.680 // Mesma latitude, longitude menor (oeste)
            );
            
            // Bearing para oeste deve ser próximo de 270°
            expect(bearing).toBeGreaterThan(260);
            expect(bearing).toBeLessThan(280);
        });

        test('deve retornar bearing entre 0 e 360 graus', () => {
            const bearing = Utils.calculateBearing(
                testLocations.floresta.lat, testLocations.floresta.lng,
                testLocations.casaWill.lat, testLocations.casaWill.lng
            );
            
            expect(bearing).toBeGreaterThanOrEqual(0);
            expect(bearing).toBeLessThan(360);
        });
    });

    describe('Utils.isInPedraBranca', () => {
        test('deve identificar coordenadas dentro do bairro Pedra Branca', () => {
            Object.values(testLocations).forEach(location => {
                expect(Utils.isInPedraBranca(location.lat, location.lng)).toBe(true);
            });
        });

        test('deve identificar coordenadas fora do bairro Pedra Branca', () => {
            // Coordenadas de Florianópolis centro (fora do bairro)
            expect(Utils.isInPedraBranca(-27.5954, -48.5480)).toBe(false);
            
            // Coordenadas muito distantes
            expect(Utils.isInPedraBranca(-23.5505, -46.6333)).toBe(false); // São Paulo
        });

        test('deve lidar com coordenadas limítrofes', () => {
            // Coordenadas próximas aos limites do bairro
            const limitCoords = [
                { lat: -27.620, lng: -48.685 }, // Norte
                { lat: -27.635, lng: -48.685 }, // Sul
                { lat: -27.628, lng: -48.675 }, // Leste
                { lat: -27.628, lng: -48.690 }  // Oeste
            ];
            
            limitCoords.forEach(coord => {
                const result = Utils.isInPedraBranca(coord.lat, coord.lng);
                expect(typeof result).toBe('boolean');
            });
        });
    });

    describe('Utils.formatDistance', () => {
        test('deve formatar distâncias pequenas em metros', () => {
            expect(Utils.formatDistance(5)).toBe('5m');
            expect(Utils.formatDistance(15.7)).toBe('16m');
            expect(Utils.formatDistance(999)).toBe('999m');
        });

        test('deve formatar distâncias grandes em quilômetros', () => {
            expect(Utils.formatDistance(1000)).toBe('1.0km');
            expect(Utils.formatDistance(1500)).toBe('1.5km');
            expect(Utils.formatDistance(2750)).toBe('2.8km');
        });

        test('deve lidar com valores zero e negativos', () => {
            expect(Utils.formatDistance(0)).toBe('0m');
            expect(Utils.formatDistance(-10)).toBe('0m'); // Não deve mostrar distâncias negativas
        });

        test('deve lidar com valores muito grandes', () => {
            expect(Utils.formatDistance(50000)).toBe('50.0km');
            expect(Utils.formatDistance(999999)).toBe('1000.0km');
        });
    });

    describe('Utils.isValidCoordinate', () => {
        test('deve validar coordenadas válidas', () => {
            expect(Utils.isValidCoordinate(-27.630, -48.680)).toBe(true);
            expect(Utils.isValidCoordinate(0, 0)).toBe(true);
            expect(Utils.isValidCoordinate(90, 180)).toBe(true);
            expect(Utils.isValidCoordinate(-90, -180)).toBe(true);
        });

        test('deve rejeitar coordenadas inválidas', () => {
            expect(Utils.isValidCoordinate(91, 0)).toBe(false); // Latitude > 90
            expect(Utils.isValidCoordinate(-91, 0)).toBe(false); // Latitude < -90
            expect(Utils.isValidCoordinate(0, 181)).toBe(false); // Longitude > 180
            expect(Utils.isValidCoordinate(0, -181)).toBe(false); // Longitude < -180
            expect(Utils.isValidCoordinate(null, 0)).toBe(false);
            expect(Utils.isValidCoordinate(0, null)).toBe(false);
            expect(Utils.isValidCoordinate(NaN, 0)).toBe(false);
            expect(Utils.isValidCoordinate(0, NaN)).toBe(false);
        });
    });

    describe('Integração com LocationManager', () => {
        let locationManager;

        beforeEach(() => {
            locationManager = new LocationManager();
        });

        afterEach(() => {
            if (locationManager) {
                locationManager.cleanup();
            }
        });

        test('deve calcular distância para alvo corretamente', () => {
            // Simular posição atual
            const currentPosition = {
                lat: testLocations.floresta.lat,
                lng: testLocations.floresta.lng,
                accuracy: 10,
                timestamp: Date.now()
            };
            
            locationManager.updateCurrentPosition(currentPosition);
            locationManager.setTarget(
                testLocations.casaWill.lat,
                testLocations.casaWill.lng,
                20
            );

            const distance = locationManager.getDistanceToTarget();
            expect(distance).toBeGreaterThan(250);
            expect(distance).toBeLessThan(350);
        });

        test('deve calcular bearing para alvo corretamente', () => {
            const currentPosition = {
                lat: testLocations.floresta.lat,
                lng: testLocations.floresta.lng,
                accuracy: 10,
                timestamp: Date.now()
            };
            
            locationManager.updateCurrentPosition(currentPosition);
            locationManager.setTarget(
                testLocations.casaWill.lat,
                testLocations.casaWill.lng,
                20
            );

            const bearing = locationManager.getBearingToTarget();
            expect(bearing).toBeGreaterThanOrEqual(0);
            expect(bearing).toBeLessThan(360);
        });

        test('deve detectar chegada ao destino', (done) => {
            const targetLocation = testLocations.casaWill;
            
            locationManager.on('targetReached', (data) => {
                expect(data.target.lat).toBe(targetLocation.lat);
                expect(data.target.lng).toBe(targetLocation.lng);
                expect(data.distance).toBeLessThanOrEqual(20);
                done();
            });

            locationManager.setTarget(targetLocation.lat, targetLocation.lng, 20);
            
            // Simular chegada ao destino
            const arrivalPosition = {
                lat: targetLocation.lat + 0.0001, // Muito próximo
                lng: targetLocation.lng + 0.0001,
                accuracy: 5,
                timestamp: Date.now()
            };
            
            locationManager.updateCurrentPosition(arrivalPosition);
        });

        test('deve filtrar posições com baixa precisão', () => {
            const lowAccuracyPosition = {
                lat: testLocations.floresta.lat,
                lng: testLocations.floresta.lng,
                accuracy: 100, // Precisão muito baixa
                timestamp: Date.now()
            };
            
            locationManager.setPositionFilter({ minAccuracy: 50 });
            locationManager.updateCurrentPosition(lowAccuracyPosition);
            
            // Posição não deve ser atualizada devido à baixa precisão
            expect(locationManager.currentPosition).toBeNull();
        });

        test('deve calcular velocidade corretamente', () => {
            const position1 = {
                lat: testLocations.floresta.lat,
                lng: testLocations.floresta.lng,
                accuracy: 10,
                timestamp: Date.now()
            };
            
            const position2 = {
                lat: testLocations.casaWill.lat,
                lng: testLocations.casaWill.lng,
                accuracy: 10,
                timestamp: Date.now() + 60000 // 1 minuto depois
            };
            
            locationManager.setPositionFilter({ enabled: false }); // Desabilitar filtro
            locationManager.updateCurrentPosition(position1);
            locationManager.updateCurrentPosition(position2);
            
            expect(locationManager.currentPosition.velocity).toBeDefined();
            expect(locationManager.currentPosition.velocity.speed).toBeGreaterThan(0);
            expect(locationManager.currentPosition.velocity.speedKmh).toBeGreaterThan(0);
        });
    });

    describe('Testes de Performance', () => {
        test('cálculo de distância deve ser rápido', () => {
            const start = performance.now();
            
            for (let i = 0; i < 1000; i++) {
                Utils.calculateDistance(
                    testLocations.floresta.lat, testLocations.floresta.lng,
                    testLocations.casaWill.lat, testLocations.casaWill.lng
                );
            }
            
            const end = performance.now();
            const duration = end - start;
            
            // 1000 cálculos devem levar menos de 100ms
            expect(duration).toBeLessThan(100);
        });

        test('cálculo de bearing deve ser rápido', () => {
            const start = performance.now();
            
            for (let i = 0; i < 1000; i++) {
                Utils.calculateBearing(
                    testLocations.floresta.lat, testLocations.floresta.lng,
                    testLocations.casaWill.lat, testLocations.casaWill.lng
                );
            }
            
            const end = performance.now();
            const duration = end - start;
            
            // 1000 cálculos devem levar menos de 100ms
            expect(duration).toBeLessThan(100);
        });
    });

    describe('Testes de Precisão', () => {
        test('deve manter precisão em cálculos de distância', () => {
            // Teste com coordenadas conhecidas
            const lat1 = -27.630000;
            const lng1 = -48.680000;
            const lat2 = -27.631000; // 1km ao sul aproximadamente
            const lng2 = -48.680000;
            
            const distance = Utils.calculateDistance(lat1, lng1, lat2, lng2);
            
            // Distância deve ser aproximadamente 111m (1 grau de latitude ≈ 111km)
            expect(distance).toBeGreaterThan(100);
            expect(distance).toBeLessThan(120);
        });

        test('deve manter precisão em cálculos de bearing', () => {
            // Teste com direções cardeais conhecidas
            const center = { lat: -27.630, lng: -48.680 };
            
            // Norte
            const north = Utils.calculateBearing(center.lat, center.lng, center.lat - 0.001, center.lng);
            expect(Math.abs(north - 0) < 5 || Math.abs(north - 360) < 5).toBe(true);
            
            // Leste
            const east = Utils.calculateBearing(center.lat, center.lng, center.lat, center.lng + 0.001);
            expect(Math.abs(east - 90) < 5).toBe(true);
            
            // Sul
            const south = Utils.calculateBearing(center.lat, center.lng, center.lat + 0.001, center.lng);
            expect(Math.abs(south - 180) < 5).toBe(true);
            
            // Oeste
            const west = Utils.calculateBearing(center.lat, center.lng, center.lat, center.lng - 0.001);
            expect(Math.abs(west - 270) < 5).toBe(true);
        });
    });
});