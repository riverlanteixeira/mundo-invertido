// Gerenciador de realidade aumentada
class ARManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.isActive = false;
        this.eventListeners = new Map();
        this.performanceManager = null;
        
        // Estado do AR
        this.arState = {
            cameraStarted: false,
            currentMode: null, // 'model', 'image_tracking', 'collection', 'combat'
            activeObjects: new Map(),
            imageTrackers: new Map(),
            currentMarker: null
        };
        
        // Configurações de AR
        this.arConfig = {
            camera: {
                facingMode: 'environment',
                width: { ideal: 720 },  // Otimizado para retrato
                height: { ideal: 1280 } // Otimizado para retrato
            },
            aframe: {
                debugUIEnabled: false,
                detectionMode: 'mono_and_matrix',
                matrixCodeType: '3x3',
                trackingMethod: 'best',
                maxDetectionRate: 60,
                canvasWidth: 640,
                canvasHeight: 480
            }
        };
        
        // Cache de modelos 3D
        this.modelCache = new Map();
        this.loadingPromises = new Map();
        
        // Sistema de delay de áudio
        this.delayedAudioTimeout = null;
    }

    async init() {
        Utils.log('Inicializando ARManager...');
        
        try {
            // Verificar suporte a WebXR/WebGL
            if (!this.checkARSupport()) {
                throw new Error('AR não suportado neste dispositivo');
            }
            
            // Inicializar A-Frame scene
            await this.initializeAFrameScene();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            Utils.log('ARManager inicializado com sucesso');
            
        } catch (error) {
            Utils.log(`Erro ao inicializar ARManager: ${error.message}`, 'error');
            throw error;
        }
    }

    setPerformanceManager(performanceManager) {
        this.performanceManager = performanceManager;
        Utils.log('PerformanceManager integrado ao ARManager');
        
        // Configurar integração automática
        this.setupPerformanceIntegration();
    }

    setupPerformanceIntegration() {
        if (!this.performanceManager) return;
        
        // Monitorar mudanças de LOD para ajustar qualidade AR
        this.performanceManager.on('lodChanged', (newLOD) => {
            this.adjustARQualityForLOD(newLOD);
        });
        
        // Monitorar otimizações de memória
        this.performanceManager.on('memoryOptimized', () => {
            this.handleMemoryOptimization();
        });
        
        Utils.log('Integração com PerformanceManager configurada');
    }

    adjustARQualityForLOD(lodLevel) {
        Utils.log(`Ajustando qualidade AR para LOD: ${lodLevel}`);
        
        // Ajustar configurações AR baseado no LOD
        switch (lodLevel) {
            case 'low':
                this.arConfig.aframe.maxDetectionRate = 30;
                this.arConfig.aframe.canvasWidth = 480;
                this.arConfig.aframe.canvasHeight = 360;
                break;
            case 'medium':
                this.arConfig.aframe.maxDetectionRate = 45;
                this.arConfig.aframe.canvasWidth = 640;
                this.arConfig.aframe.canvasHeight = 480;
                break;
            case 'high':
                this.arConfig.aframe.maxDetectionRate = 60;
                this.arConfig.aframe.canvasWidth = 720;
                this.arConfig.aframe.canvasHeight = 540;
                break;
        }
        
        // Aplicar configurações se AR estiver ativo
        if (this.isActive && this.scene) {
            this.applyARConfigChanges();
        }
    }

    applyARConfigChanges() {
        // Aplicar mudanças de configuração AR em tempo real
        const arjsSystem = this.scene.systems.arjs;
        if (arjsSystem) {
            // Atualizar taxa de detecção
            if (arjsSystem.arToolkitContext) {
                arjsSystem.arToolkitContext.arController.setPatternDetectionMode(
                    this.arConfig.aframe.detectionMode
                );
            }
        }
    }

    handleMemoryOptimization() {
        Utils.log('Aplicando otimizações de memória no AR');
        
        // Limpar objetos AR não utilizados
        this.clearInactiveARObjects();
        
        // Reduzir qualidade de modelos temporariamente
        this.reduceModelQuality();
    }

    clearInactiveARObjects() {
        // Remover objetos AR que não estão sendo usados
        for (const [id, object] of this.arState.activeObjects.entries()) {
            if (!this.isObjectVisible(object)) {
                this.removeARObject(id);
            }
        }
    }

    isObjectVisible(object) {
        // Verificar se objeto está visível na tela
        if (!object || !object.parentNode) return false;
        
        const position = object.getAttribute('position');
        if (!position) return false;
        
        // Verificar se está dentro do campo de visão
        const distance = Math.sqrt(
            position.x * position.x + 
            position.y * position.y + 
            position.z * position.z
        );
        
        return distance < 100; // Considerar visível se < 100m
    }

    removeARObject(objectId) {
        const object = this.arState.activeObjects.get(objectId);
        if (object && object.parentNode) {
            object.parentNode.removeChild(object);
            this.arState.activeObjects.delete(objectId);
            Utils.log(`Objeto AR removido para otimização: ${objectId}`);
        }
    }

    reduceModelQuality() {
        // Reduzir qualidade de todos os modelos ativos temporariamente
        for (const [id, object] of this.arState.activeObjects.entries()) {
            if (object.hasAttribute('gltf-model')) {
                this.applyLowQualitySettings(object);
            }
        }
    }

    applyLowQualitySettings(modelObject) {
        // Aplicar configurações de baixa qualidade
        modelObject.setAttribute('animation-mixer', 'enabled: false');
        modelObject.setAttribute('shadow', 'cast: false; receive: false');
        
        // Reduzir escala ligeiramente
        const currentScale = modelObject.getAttribute('scale');
        if (currentScale) {
            const scale = typeof currentScale === 'string' ? 
                currentScale.split(' ').map(Number) : 
                [currentScale.x, currentScale.y, currentScale.z];
            
            const reducedScale = scale.map(s => s * 0.8);
            modelObject.setAttribute('scale', reducedScale.join(' '));
        }
    }

    checkARSupport() {
        // Verificar WebGL
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            Utils.log('WebGL não suportado', 'error');
            return false;
        }
        
        // Verificar getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            Utils.log('getUserMedia não suportado', 'error');
            return false;
        }
        
        // Verificar A-Frame
        if (typeof AFRAME === 'undefined') {
            Utils.log('A-Frame não carregado', 'error');
            return false;
        }
        
        return true;
    }

    async validateARSystem() {
        const validation = {
            webgl: false,
            camera: false,
            aframe: false,
            arjs: false,
            errors: []
        };
        
        try {
            // Verificar WebGL
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            validation.webgl = !!gl;
            if (!validation.webgl) {
                validation.errors.push('WebGL não suportado');
            }
            
            // Verificar câmera
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' } 
                });
                stream.getTracks().forEach(track => track.stop());
                validation.camera = true;
            } catch (error) {
                validation.camera = false;
                validation.errors.push(`Câmera não acessível: ${error.message}`);
            }
            
            // Verificar A-Frame
            validation.aframe = typeof AFRAME !== 'undefined';
            if (!validation.aframe) {
                validation.errors.push('A-Frame não carregado');
            }
            
            // Verificar AR.js
            validation.arjs = validation.aframe && !!AFRAME.components.arjs;
            if (!validation.arjs && validation.aframe) {
                validation.errors.push('AR.js não carregado');
            }
            
        } catch (error) {
            validation.errors.push(`Erro na validação: ${error.message}`);
        }
        
        return validation;
    }

    async initializeAFrameScene() {
        this.scene = document.getElementById('ar-scene');
        this.camera = document.getElementById('ar-camera');
        
        if (!this.scene || !this.camera) {
            throw new Error('Elementos A-Frame não encontrados');
        }
        
        // Configurar scene com configurações otimizadas para retrato
        this.scene.setAttribute('arjs', {
            sourceType: 'webcam',
            debugUIEnabled: this.arConfig.aframe.debugUIEnabled,
            detectionMode: this.arConfig.aframe.detectionMode,
            matrixCodeType: this.arConfig.aframe.matrixCodeType,
            trackingMethod: this.arConfig.aframe.trackingMethod,
            maxDetectionRate: this.arConfig.aframe.maxDetectionRate,
            canvasWidth: this.arConfig.aframe.canvasWidth,
            canvasHeight: this.arConfig.aframe.canvasHeight
        });
        
        // Aguardar A-Frame estar pronto
        await new Promise((resolve) => {
            if (this.scene.hasLoaded) {
                resolve();
            } else {
                this.scene.addEventListener('loaded', resolve);
            }
        });
        
        // Precarregar assets 3D
        await this.preloadAssets();
        
        Utils.log('A-Frame scene inicializada com assets precarregados');
    }

    async preloadAssets() {
        const assets = document.querySelector('a-assets');
        if (!assets) {
            Utils.log('Elemento a-assets não encontrado', 'warn');
            return;
        }

        // Aguardar todos os assets carregarem
        const assetItems = assets.querySelectorAll('a-asset-item');
        const loadPromises = Array.from(assetItems).map(item => {
            return new Promise((resolve, reject) => {
                if (item.hasLoaded) {
                    resolve();
                } else {
                    item.addEventListener('loaded', resolve);
                    item.addEventListener('error', reject);
                }
            });
        });

        try {
            await Promise.all(loadPromises);
            Utils.log('Todos os assets 3D foram precarregados');
        } catch (error) {
            Utils.log(`Erro ao precarregar assets: ${error.message}`, 'warn');
        }
    }

    setupEventListeners() {
        // Eventos da scene
        this.scene.addEventListener('arjs-video-loaded', () => {
            Utils.log('Vídeo AR carregado');
            this.arState.cameraStarted = true;
            this.emit('cameraStarted');
        });
        
        // Eventos de clique em objetos AR
        this.scene.addEventListener('click', (event) => {
            this.handleARClick(event);
        });
        
        // Eventos de rastreamento de marcadores
        this.scene.addEventListener('markerFound', (event) => {
            this.handleMarkerFound(event);
        });
        
        this.scene.addEventListener('markerLost', (event) => {
            this.handleMarkerLost(event);
        });
        
        // Eventos de erro AR
        this.scene.addEventListener('arjs-video-loaded-error', (event) => {
            Utils.log('Erro ao carregar vídeo AR', 'error');
            const error = new Error('Falha ao carregar vídeo AR');
            error.detail = event.detail;
            this.emit('arError', error);
            this.emit('cameraError', event.detail);
        });
        
        // Monitorar mudanças de orientação para otimizar para retrato
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 500);
        });
        
        // Monitorar redimensionamento da janela
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    handleOrientationChange() {
        if (!this.isActive) return;
        
        Utils.log('Mudança de orientação detectada');
        
        // Verificar se está em modo retrato
        const isPortrait = window.innerHeight > window.innerWidth;
        
        if (!isPortrait) {
            Utils.log('Dispositivo não está em modo retrato', 'warn');
            this.emit('orientationWarning');
        } else {
            Utils.log('Modo retrato confirmado');
            // Reajustar configurações da câmera se necessário
            this.optimizeForPortrait();
        }
    }

    handleResize() {
        if (!this.isActive) return;
        
        // Reajustar canvas AR para nova dimensão
        const canvas = this.scene.querySelector('canvas');
        if (canvas) {
            canvas.style.width = '100%';
            canvas.style.height = '100%';
        }
    }

    optimizeForPortrait() {
        // Otimizações específicas para modo retrato
        const arjsSystem = this.scene.systems.arjs;
        if (arjsSystem && arjsSystem.arToolkitSource) {
            // Ajustar configurações da fonte de vídeo
            const videoElement = arjsSystem.arToolkitSource.domElement;
            if (videoElement) {
                // Configurações específicas para Samsung S20 FE
                videoElement.style.objectFit = 'cover';
                videoElement.style.width = '100%';
                videoElement.style.height = '100%';
                
                // Aplicar configurações de vídeo otimizadas para retrato
                const constraints = {
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 720, max: 1280 },
                        height: { ideal: 1280, max: 1920 },
                        frameRate: { ideal: 30, max: 60 }
                    }
                };
                
                // Reconfigurar stream se possível
                if (arjsSystem.arToolkitSource.ready) {
                    Utils.log('Aplicando otimizações para modo retrato');
                }
            }
        }
        
        // Ajustar canvas AR
        const canvas = this.scene.querySelector('canvas');
        if (canvas) {
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.objectFit = 'cover';
        }
    }

    async startCamera() {
        if (this.arState.cameraStarted) {
            Utils.log('Câmera AR já está ativa');
            return;
        }
        
        Utils.log('Iniciando câmera AR...');
        
        try {
            // Validar sistema antes de iniciar
            const validation = await this.validateARSystem();
            if (!validation.webgl || !validation.camera || !validation.aframe || !validation.arjs) {
                const error = new Error('Sistema AR não está completamente suportado');
                error.validation = validation;
                this.emit('arError', error);
                throw error;
            }
            
            // Mostrar scene AR
            this.scene.classList.remove('hidden');
            
            // Otimizar para orientação retrato
            this.optimizeForPortrait();
            
            // Aguardar câmera inicializar
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    const error = new Error('Timeout ao iniciar câmera AR');
                    this.emit('arError', error);
                    reject(error);
                }, 15000); // Aumentado para 15s para dispositivos mais lentos
                
                const onCameraStart = () => {
                    clearTimeout(timeout);
                    this.off('cameraStarted', onCameraStart);
                    resolve();
                };
                
                const onCameraError = (error) => {
                    clearTimeout(timeout);
                    this.off('cameraError', onCameraError);
                    const arError = new Error(`Erro na câmera AR: ${error}`);
                    this.emit('arError', arError);
                    reject(arError);
                };
                
                this.on('cameraStarted', onCameraStart);
                this.on('cameraError', onCameraError);
            });
            
            this.isActive = true;
            Utils.log('Câmera AR iniciada com sucesso');
            
        } catch (error) {
            Utils.log(`Erro ao iniciar câmera AR: ${error.message}`, 'error');
            // Ocultar scene em caso de erro
            this.scene.classList.add('hidden');
            // Emitir erro para o sistema de tratamento de erros
            this.emit('arError', error);
            throw error;
        }
    }

    stopCamera() {
        if (!this.isActive) return;
        
        // Ocultar scene AR
        this.scene.classList.add('hidden');
        
        // Limpar objetos ativos
        this.clearActiveObjects();
        
        this.isActive = false;
        this.arState.cameraStarted = false;
        this.arState.currentMode = null;
        
        Utils.log('Câmera AR parada');
        this.emit('cameraStopped');
    }

    async showModel(arContent) {
        Utils.log(`Mostrando modelo AR: ${arContent.path}`);
        
        try {
            this.arState.currentMode = 'model';
            
            // Otimizar asset se performance manager disponível
            let optimizedPath = arContent.path;
            if (this.performanceManager) {
                optimizedPath = await this.performanceManager.compressAsset(arContent.path, 'model');
            }
            
            // Determinar ID do asset baseado no path
            let assetId = null;
            if (arContent.path.includes('bicicleta-will')) {
                assetId = '#bicicleta-will-model';
            } else if (arContent.path.includes('castle_byers')) {
                assetId = '#castle-byers-model';
            }
            
            // Criar entidade A-Frame para o modelo
            const modelEntity = document.createElement('a-entity');
            const entityId = 'ar-model-' + Utils.generateId();
            modelEntity.setAttribute('id', entityId);
            
            // Usar asset precarregado se disponível, senão usar path otimizado
            const modelSrc = assetId || optimizedPath;
            modelEntity.setAttribute('gltf-model', modelSrc);
            modelEntity.setAttribute('position', arContent.position.join(' '));
            
            // Aplicar LOD baseado na performance
            const lodScale = this.calculateLODScale(arContent.scale);
            modelEntity.setAttribute('scale', lodScale.join(' '));
            
            // Configurar animação baseada na performance
            const animationEnabled = this.shouldEnableAnimations();
            if (animationEnabled) {
                modelEntity.setAttribute('animation-mixer', '');
                
                // Adicionar animação de aparição
                modelEntity.setAttribute('animation__appear', {
                    property: 'scale',
                    from: '0 0 0',
                    to: lodScale.join(' '),
                    dur: 1000,
                    easing: 'easeOutElastic'
                });
            } else {
                // Aparecer instantaneamente se performance baixa
                modelEntity.setAttribute('scale', lodScale.join(' '));
            }
            
            // Adicionar interatividade
            modelEntity.setAttribute('class', 'clickable ar-object-appear');
            
            // Adicionar cursor para melhor interação
            modelEntity.setAttribute('cursor', 'rayOrigin: mouse');
            
            // Adicionar evento de clique específico
            modelEntity.addEventListener('click', (event) => {
                Utils.log(`Modelo AR clicado diretamente: ${entityId}`);
                this.handleARClick(event);
            });
            
            // Adicionar à câmera
            this.camera.appendChild(modelEntity);
            this.arState.activeObjects.set(entityId, modelEntity);
            
            // Atualizar LOD baseado na distância se performance manager disponível
            if (this.performanceManager) {
                this.updateModelLOD(modelEntity, 5); // Assumir 5m de distância inicial
            }
            
            Utils.log(`Modelo AR exibido com sucesso: ${entityId} usando ${modelSrc}`);
            
        } catch (error) {
            Utils.log(`Erro ao mostrar modelo AR: ${error.message}`, 'error');
            throw error;
        }
    }

    calculateLODScale(originalScale) {
        if (!this.performanceManager) return originalScale;
        
        const metrics = this.performanceManager.getPerformanceMetrics();
        const optimizationStatus = this.performanceManager.getOptimizationStatus();
        
        // Reduzir escala baseado no LOD atual
        let scaleFactor = 1.0;
        switch (optimizationStatus.lodLevel) {
            case 'low':
                scaleFactor = 0.6;
                break;
            case 'medium':
                scaleFactor = 0.8;
                break;
            case 'high':
                scaleFactor = 1.0;
                break;
        }
        
        // Reduzir ainda mais se FPS muito baixo
        if (metrics.fps < 20) {
            scaleFactor *= 0.7;
        }
        
        return originalScale.map(s => s * scaleFactor);
    }

    shouldEnableAnimations() {
        if (!this.performanceManager) return true;
        
        const metrics = this.performanceManager.getPerformanceMetrics();
        const optimizationStatus = this.performanceManager.getOptimizationStatus();
        
        // Desabilitar animações se performance baixa
        return metrics.fps >= 25 && optimizationStatus.lodLevel !== 'low';
    }

    updateModelLOD(modelEntity, distance) {
        if (!this.performanceManager) return;
        
        // Atualizar LOD baseado na distância
        this.performanceManager.updateLOD(distance);
        
        const optimizationStatus = this.performanceManager.getOptimizationStatus();
        
        // Ajustar qualidade do modelo baseado no LOD
        switch (optimizationStatus.lodLevel) {
            case 'low':
                // Desabilitar animações e reduzir detalhes
                modelEntity.setAttribute('animation-mixer', 'enabled: false');
                this.setModelComplexity(modelEntity, 'low');
                break;
            case 'medium':
                // Qualidade média
                modelEntity.setAttribute('animation-mixer', 'enabled: true');
                this.setModelComplexity(modelEntity, 'medium');
                break;
            case 'high':
                // Qualidade máxima
                modelEntity.setAttribute('animation-mixer', 'enabled: true');
                this.setModelComplexity(modelEntity, 'high');
                break;
        }
    }

    setModelComplexity(modelEntity, level) {
        // Ajustar complexidade do modelo baseado no nível
        const currentScale = modelEntity.getAttribute('scale');
        let scale = typeof currentScale === 'string' ? 
            currentScale.split(' ').map(Number) : 
            [currentScale.x, currentScale.y, currentScale.z];
        
        switch (level) {
            case 'low':
                // Reduzir escala e desabilitar sombras
                scale = scale.map(s => s * 0.8);
                modelEntity.setAttribute('shadow', 'cast: false; receive: false');
                break;
            case 'medium':
                // Escala normal, sombras simples
                modelEntity.setAttribute('shadow', 'cast: true; receive: false');
                break;
            case 'high':
                // Qualidade máxima com sombras completas
                modelEntity.setAttribute('shadow', 'cast: true; receive: true');
                break;
        }
        
        modelEntity.setAttribute('scale', scale.join(' '));
    }

    async startImageTracking(arContent) {
        Utils.log(`Iniciando rastreamento de imagem: ${arContent.markerImage}`);
        
        try {
            this.arState.currentMode = 'image_tracking';
            
            // Gerar pattern file para a imagem
            const patternUrl = await this.generatePatternFromImage(arContent.markerImage);
            
            // Criar marcador de imagem
            const marker = document.createElement('a-marker');
            const markerId = 'image-marker-' + Utils.generateId();
            marker.setAttribute('type', 'pattern');
            marker.setAttribute('url', patternUrl);
            marker.setAttribute('id', markerId);
            marker.setAttribute('smooth', 'true');
            marker.setAttribute('smoothCount', '10');
            marker.setAttribute('smoothTolerance', '0.01');
            marker.setAttribute('smoothThreshold', '5');
            
            // Criar conteúdo do marcador
            if (arContent.overlayGif) {
                // Criar plano para GIF
                const gifPlane = document.createElement('a-plane');
                gifPlane.setAttribute('src', arContent.overlayGif);
                gifPlane.setAttribute('width', '3');
                gifPlane.setAttribute('height', '3');
                gifPlane.setAttribute('position', '0 0 0.1');
                gifPlane.setAttribute('rotation', '-90 0 0');
                gifPlane.setAttribute('material', 'transparent: true; alphaTest: 0.1');
                gifPlane.setAttribute('class', 'clickable');
                
                // Identificar se é o portal para tratamento especial
                if (arContent.overlayGif.includes('portal.gif')) {
                    gifPlane.setAttribute('id', 'portal-gif');
                    gifPlane.setAttribute('data-type', 'portal');
                }
                
                // Adicionar animação de pulsação
                gifPlane.setAttribute('animation__pulse', {
                    property: 'scale',
                    to: '1.1 1.1 1.1',
                    dur: 2000,
                    dir: 'alternate',
                    loop: true,
                    easing: 'easeInOutSine'
                });
                
                // Adicionar evento de clique específico para o GIF
                gifPlane.addEventListener('click', (event) => {
                    event.stopPropagation();
                    Utils.log(`GIF clicado: ${arContent.overlayGif}`);
                    
                    // Verificar se é o portal
                    if (arContent.overlayGif.includes('portal.gif')) {
                        Utils.log('Portal clicado - emitindo evento portalClicked');
                        this.emit('portalClicked');
                    }
                });
                
                marker.appendChild(gifPlane);
            }
            
            if (arContent.overlayModel) {
                // Criar modelo 3D
                const modelEntity = document.createElement('a-entity');
                modelEntity.setAttribute('gltf-model', arContent.overlayModel);
                modelEntity.setAttribute('position', '0 0.5 0');
                modelEntity.setAttribute('scale', '0.5 0.5 0.5');
                modelEntity.setAttribute('animation-mixer', '');
                modelEntity.setAttribute('class', 'clickable');
                
                // Adicionar animação de rotação
                modelEntity.setAttribute('animation__rotate', {
                    property: 'rotation',
                    to: '0 360 0',
                    dur: 10000,
                    loop: true,
                    easing: 'linear'
                });
                
                marker.appendChild(modelEntity);
            }
            
            // Adicionar eventos de rastreamento
            marker.addEventListener('markerFound', (event) => {
                Utils.log(`Marcador de imagem encontrado: ${markerId}`);
                this.arState.currentMarker = markerId;
                
                // Vibrar dispositivo para feedback
                Utils.vibrate([100, 50, 100]);
                
                // Delay de áudio se especificado
                if (arContent.audioDelay && arContent.audioDelay > 0) {
                    Utils.log(`Aguardando ${arContent.audioDelay}ms antes de reproduzir áudio`);
                    this.scheduleDelayedAudio(arContent, arContent.audioDelay);
                } else {
                    this.emit('markerDetected', arContent);
                }
                
                // Emitir evento específico para tracking
                this.emit('imageTrackingStarted', {
                    markerId: markerId,
                    markerImage: arContent.markerImage,
                    overlayContent: arContent.overlayGif || arContent.overlayModel
                });
            });
            
            marker.addEventListener('markerLost', (event) => {
                Utils.log(`Marcador de imagem perdido: ${markerId}`);
                if (this.arState.currentMarker === markerId) {
                    this.arState.currentMarker = null;
                }
                
                // Cancelar áudio com delay se ainda não foi reproduzido
                this.cancelDelayedAudio();
                
                this.emit('imageTrackingLost', {
                    markerId: markerId,
                    markerImage: arContent.markerImage
                });
            });
            
            // Adicionar à scene
            this.scene.appendChild(marker);
            this.arState.imageTrackers.set(markerId, marker);
            
            Utils.log(`Rastreamento de imagem iniciado para: ${arContent.markerImage}`);
            
        } catch (error) {
            Utils.log(`Erro no rastreamento de imagem: ${error.message}`, 'error');
            throw error;
        }
    }

    async generatePatternFromImage(imagePath) {
        Utils.log(`Obtendo pattern para imagem: ${imagePath}`);
        
        try {
            // Mapear imagens para seus respectivos arquivos de pattern
            const patternMap = {
                'assets/img/the-big-bang-theory.jpg': 'assets/patterns/the-big-bang-theory.patt',
                'assets/img/bloco-h.jpg': 'assets/patterns/bloco-h.patt'
            };
            
            const patternPath = patternMap[imagePath];
            
            if (patternPath) {
                // Verificar se o arquivo de pattern existe
                try {
                    const response = await fetch(patternPath);
                    if (response.ok) {
                        Utils.log(`Pattern encontrado: ${patternPath}`);
                        return patternPath;
                    }
                } catch (error) {
                    Utils.log(`Pattern não encontrado: ${patternPath}`, 'warn');
                }
            }
            
            // Fallback para pattern genérico
            Utils.log('Usando pattern genérico como fallback');
            return this.getGenericPatternUrl();
            
        } catch (error) {
            Utils.log(`Erro ao obter pattern: ${error.message}`, 'error');
            return this.getGenericPatternUrl();
        }
    }

    getGenericPatternUrl() {
        // URL para um pattern genérico que funciona com AR.js
        return 'data:text/plain;base64,' + btoa(`255 255 255 255 255 255 255 255 255 255 255 255 255 255 255 255
255 0 0 0 0 0 0 0 0 0 0 0 0 0 0 255
255 0 255 255 255 255 255 255 255 255 255 255 255 255 0 255
255 0 255 0 0 0 0 0 0 0 0 0 0 255 0 255
255 0 255 0 255 255 255 255 255 255 255 255 0 255 0 255
255 0 255 0 255 0 0 0 0 0 0 255 0 255 0 255
255 0 255 0 255 0 255 255 255 255 0 255 0 255 0 255
255 0 255 0 255 0 255 0 0 255 0 255 0 255 0 255
255 0 255 0 255 0 255 0 0 255 0 255 0 255 0 255
255 0 255 0 255 0 255 255 255 255 0 255 0 255 0 255
255 0 255 0 255 0 0 0 0 0 0 255 0 255 0 255
255 0 255 0 255 255 255 255 255 255 255 255 0 255 0 255
255 0 255 0 0 0 0 0 0 0 0 0 0 255 0 255
255 0 255 255 255 255 255 255 255 255 255 255 255 255 0 255
255 0 0 0 0 0 0 0 0 0 0 0 0 0 0 255
255 255 255 255 255 255 255 255 255 255 255 255 255 255 255 255

255 255 255 255 255 255 255 255 255 255 255 255 255 255 255 255
255 0 0 0 0 0 0 0 0 0 0 0 0 0 0 255
255 0 255 255 255 255 255 255 255 255 255 255 255 255 0 255
255 0 255 0 0 0 0 0 0 0 0 0 0 255 0 255
255 0 255 0 255 255 255 255 255 255 255 255 0 255 0 255
255 0 255 0 255 0 0 0 0 0 0 255 0 255 0 255
255 0 255 0 255 0 255 255 255 255 0 255 0 255 0 255
255 0 255 0 255 0 255 0 0 255 0 255 0 255 0 255
255 0 255 0 255 0 255 0 0 255 0 255 0 255 0 255
255 0 255 0 255 0 255 255 255 255 0 255 0 255 0 255
255 0 255 0 255 0 0 0 0 0 0 255 0 255 0 255
255 0 255 0 255 255 255 255 255 255 255 255 0 255 0 255
255 0 255 0 0 0 0 0 0 0 0 0 0 255 0 255
255 0 255 255 255 255 255 255 255 255 255 255 255 255 0 255
255 0 0 0 0 0 0 0 0 0 0 0 0 0 0 255
255 255 255 255 255 255 255 255 255 255 255 255 255 255 255 255

255 255 255 255 255 255 255 255 255 255 255 255 255 255 255 255
255 0 0 0 0 0 0 0 0 0 0 0 0 0 0 255
255 0 255 255 255 255 255 255 255 255 255 255 255 255 0 255
255 0 255 0 0 0 0 0 0 0 0 0 0 255 0 255
255 0 255 0 255 255 255 255 255 255 255 255 0 255 0 255
255 0 255 0 255 0 0 0 0 0 0 255 0 255 0 255
255 0 255 0 255 0 255 255 255 255 0 255 0 255 0 255
255 0 255 0 255 0 255 0 0 255 0 255 0 255 0 255
255 0 255 0 255 0 255 0 0 255 0 255 0 255 0 255
255 0 255 0 255 0 255 255 255 255 0 255 0 255 0 255
255 0 255 0 255 0 0 0 0 0 0 255 0 255 0 255
255 0 255 0 255 255 255 255 255 255 255 255 0 255 0 255
255 0 255 0 0 0 0 0 0 0 0 0 0 255 0 255
255 0 255 255 255 255 255 255 255 255 255 255 255 255 0 255
255 0 0 0 0 0 0 0 0 0 0 0 0 0 0 255
255 255 255 255 255 255 255 255 255 255 255 255 255 255 255 255`);
    }

    scheduleDelayedAudio(arContent, delay) {
        // Cancelar delay anterior se existir
        this.cancelDelayedAudio();
        
        // Agendar novo delay
        this.delayedAudioTimeout = setTimeout(() => {
            Utils.log(`Reproduzindo áudio após delay de ${delay}ms`);
            this.emit('markerDetected', arContent);
            this.delayedAudioTimeout = null;
        }, delay);
        
        Utils.log(`Áudio agendado para ${delay}ms`);
    }

    cancelDelayedAudio() {
        if (this.delayedAudioTimeout) {
            clearTimeout(this.delayedAudioTimeout);
            this.delayedAudioTimeout = null;
            Utils.log('Delay de áudio cancelado');
        }
    }

    async showCollectionItems(arContent) {
        Utils.log(`Mostrando itens para coleta: ${arContent.items.length} itens`);
        
        try {
            this.arState.currentMode = 'collection';
            
            for (const item of arContent.items) {
                // Criar plano para item
                const itemPlane = document.createElement('a-plane');
                itemPlane.setAttribute('id', 'collection-item-' + item.id);
                itemPlane.setAttribute('src', item.image);
                itemPlane.setAttribute('width', '1');
                itemPlane.setAttribute('height', '1');
                itemPlane.setAttribute('position', item.position.join(' '));
                itemPlane.setAttribute('rotation', '-90 0 0');
                itemPlane.setAttribute('class', 'clickable');
                
                // Adicionar animação de flutuação
                itemPlane.setAttribute('animation', {
                    property: 'position',
                    to: `${item.position[0]} ${item.position[1] + 0.2} ${item.position[2]}`,
                    dur: 2000,
                    dir: 'alternate',
                    loop: true,
                    easing: 'easeInOutSine'
                });
                
                // Adicionar interatividade
                itemPlane.addEventListener('click', () => {
                    this.collectItem(item.id, itemPlane);
                });
                
                // Adicionar à câmera
                this.camera.appendChild(itemPlane);
                this.arState.activeObjects.set(itemPlane.id, itemPlane);
            }
            
            Utils.log('Itens de coleta exibidos');
            
        } catch (error) {
            Utils.log(`Erro ao mostrar itens de coleta: ${error.message}`, 'error');
            throw error;
        }
    }

    collectItem(itemId, itemElement) {
        Utils.log(`Coletando item: ${itemId}`);
        
        // Animação de coleta
        itemElement.setAttribute('animation', {
            property: 'scale',
            to: '0 0 0',
            dur: 500,
            easing: 'easeInBack'
        });
        
        // Remover após animação
        setTimeout(() => {
            if (itemElement.parentNode) {
                itemElement.parentNode.removeChild(itemElement);
            }
            this.arState.activeObjects.delete(itemElement.id);
        }, 500);
        
        // Emitir evento
        this.emit('objectClicked', itemId);
    }

    async startCombat(arContent) {
        Utils.log(`Iniciando combate: ${arContent.enemy}`);
        
        try {
            this.arState.currentMode = 'combat';
            
            // Inicializar estado do combate
            this.combatState = {
                enemy: arContent.enemy,
                phase: 'preparation', // preparation, combat, victory
                attacksPerformed: 0,
                totalAttacks: 2,
                weaponsUsed: [],
                enemyModel: null,
                combatUI: null
            };
            
            // Determinar ID do asset baseado no modelo
            let assetId = null;
            if (arContent.model && arContent.model.includes('demogorgon')) {
                assetId = '#demogorgon-model';
            }
            
            // Carregar modelo do inimigo
            const enemyModel = document.createElement('a-entity');
            enemyModel.setAttribute('id', 'combat-enemy');
            this.combatState.enemyModel = enemyModel;
            
            // Usar asset precarregado se disponível, senão usar path direto
            const modelSrc = assetId || arContent.model;
            enemyModel.setAttribute('gltf-model', modelSrc);
            enemyModel.setAttribute('position', '0 1 -4');
            enemyModel.setAttribute('scale', '1.5 1.5 1.5');
            enemyModel.setAttribute('animation-mixer', '');
            
            // Adicionar animação de aparição dramática
            enemyModel.setAttribute('animation__appear', {
                property: 'scale',
                from: '0 0 0',
                to: '1.5 1.5 1.5',
                dur: 2000,
                easing: 'easeOutElastic'
            });
            
            // Adicionar animação de idle ameaçadora
            enemyModel.setAttribute('animation__idle', {
                property: 'rotation',
                to: '0 360 0',
                dur: 15000,
                loop: true,
                easing: 'linear',
                delay: 2000
            });
            
            // Adicionar animação de respiração
            enemyModel.setAttribute('animation__breathe', {
                property: 'scale',
                to: '1.6 1.6 1.6',
                dur: 3000,
                dir: 'alternate',
                loop: true,
                easing: 'easeInOutSine',
                delay: 2000
            });
            
            // Adicionar som ambiente do Demogorgon
            const ambientSound = document.createElement('a-sound');
            ambientSound.setAttribute('src', 'sounds/effects/demogorgon-roar.wav');
            ambientSound.setAttribute('autoplay', 'true');
            ambientSound.setAttribute('loop', 'true');
            ambientSound.setAttribute('volume', '0.3');
            enemyModel.appendChild(ambientSound);
            
            // Adicionar à câmera
            this.camera.appendChild(enemyModel);
            this.arState.activeObjects.set('combat-enemy', enemyModel);
            
            // Mostrar interface de combate
            this.showCombatInterface();
            
            // Emitir evento de início do combate
            this.emit('combatStarted', {
                enemy: arContent.enemy,
                model: enemyModel
            });
            
            Utils.log('Combate iniciado com sucesso');
            
        } catch (error) {
            Utils.log(`Erro ao iniciar combate: ${error.message}`, 'error');
            throw error;
        }
    }

    showCombatInterface() {
        const combatInterface = document.getElementById('combat-interface');
        if (!combatInterface) {
            Utils.log('Interface de combate não encontrada no DOM', 'error');
            return;
        }

        this.combatState.combatUI = combatInterface;
        
        // Mostrar interface com animação
        combatInterface.classList.remove('hidden');
        combatInterface.classList.add('entering');
        
        // Configurar botões de armas
        this.setupCombatControls();
        
        // Atualizar interface inicial
        this.updateCombatUI();
        
        Utils.log('Interface de combate exibida');
    }

    setupCombatControls() {
        const tacoButton = document.getElementById('use-taco');
        const gasolinaButton = document.getElementById('use-gasolina');
        
        if (!tacoButton || !gasolinaButton) {
            Utils.log('Botões de combate não encontrados', 'error');
            return;
        }

        // Event listeners para os botões
        tacoButton.addEventListener('click', () => {
            this.performAttack('taco');
        });

        gasolinaButton.addEventListener('click', () => {
            this.performAttack('gasolina');
        });

        Utils.log('Controles de combate configurados');
    }

    updateCombatUI() {
        if (!this.combatState.combatUI) return;

        const tacoButton = document.getElementById('use-taco');
        const gasolinaButton = document.getElementById('use-gasolina');
        const instructionText = document.getElementById('combat-instruction');
        const progressFill = document.getElementById('combat-progress-fill');
        const progressText = document.getElementById('combat-progress-text');

        // Verificar se o jogador tem os itens no inventário
        const hasInventoryManager = window.game && window.game.inventoryManager;
        const hasTaco = hasInventoryManager ? window.game.inventoryManager.hasItem('taco') : true;
        const hasGasolina = hasInventoryManager ? window.game.inventoryManager.hasItem('gasolina') : true;

        // Atualizar estado dos botões baseado na fase do combate
        if (this.combatState.phase === 'preparation') {
            // Primeira fase: apenas taco disponível
            if (hasTaco && !this.combatState.weaponsUsed.includes('taco')) {
                tacoButton.disabled = false;
                tacoButton.classList.add('available');
                tacoButton.classList.remove('used');
            } else {
                tacoButton.disabled = true;
                tacoButton.classList.remove('available');
                if (this.combatState.weaponsUsed.includes('taco')) {
                    tacoButton.classList.add('used');
                }
            }

            // Gasolina ainda não disponível
            gasolinaButton.disabled = true;
            gasolinaButton.classList.remove('available', 'used');

            instructionText.textContent = 'Use o taco primeiro para atacar o Demogorgon!';
            
        } else if (this.combatState.phase === 'combat') {
            // Segunda fase: após usar taco, gasolina fica disponível
            tacoButton.disabled = true;
            tacoButton.classList.remove('available');
            tacoButton.classList.add('used');

            if (hasGasolina && !this.combatState.weaponsUsed.includes('gasolina')) {
                gasolinaButton.disabled = false;
                gasolinaButton.classList.add('available');
                gasolinaButton.classList.remove('used');
                instructionText.textContent = 'Agora use a gasolina para finalizar o Demogorgon!';
            } else {
                gasolinaButton.disabled = true;
                gasolinaButton.classList.remove('available');
                if (this.combatState.weaponsUsed.includes('gasolina')) {
                    gasolinaButton.classList.add('used');
                    instructionText.textContent = 'Combate concluído!';
                }
            }
        }

        // Atualizar barra de progresso
        const progressPercentage = (this.combatState.attacksPerformed / this.combatState.totalAttacks) * 100;
        progressFill.style.width = `${progressPercentage}%`;
        progressText.textContent = `${this.combatState.attacksPerformed}/${this.combatState.totalAttacks} ataques`;

        Utils.log(`Interface de combate atualizada - Fase: ${this.combatState.phase}, Ataques: ${this.combatState.attacksPerformed}`);
    }

    async performAttack(weaponType) {
        Utils.log(`Executando ataque com: ${weaponType}`);

        if (!this.combatState || this.combatState.weaponsUsed.includes(weaponType)) {
            Utils.log(`Arma ${weaponType} já foi usada`, 'warn');
            return;
        }

        try {
            // Marcar arma como usada
            this.combatState.weaponsUsed.push(weaponType);
            this.combatState.attacksPerformed++;

            // Animação do botão de ataque
            const weaponButton = document.getElementById(`use-${weaponType}`);
            if (weaponButton) {
                weaponButton.classList.add('attacking');
                setTimeout(() => {
                    weaponButton.classList.remove('attacking');
                }, 600);
            }

            // Animação de impacto no inimigo
            this.animateEnemyHit();

            // Efeito visual de sucesso
            this.showAttackSuccess(weaponType);

            // Emitir evento de ataque
            this.emit('attackPerformed', {
                weapon: weaponType,
                attackNumber: this.combatState.attacksPerformed,
                totalAttacks: this.combatState.totalAttacks
            });

            // Processar sequência de ataque baseada na arma
            if (weaponType === 'taco') {
                await this.handleTacoAttack();
            } else if (weaponType === 'gasolina') {
                await this.handleGasolinaAttack();
            }

            // Atualizar interface
            this.updateCombatUI();

            // Verificar se o combate foi concluído
            if (this.combatState.attacksPerformed >= this.combatState.totalAttacks) {
                await this.completeCombat();
            }

        } catch (error) {
            Utils.log(`Erro durante ataque: ${error.message}`, 'error');
        }
    }

    async handleTacoAttack() {
        Utils.log('Processando ataque com taco...');

        // Mudar fase para permitir uso da gasolina
        this.combatState.phase = 'combat';

        // Reproduzir som de impacto
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playAudio('sounds/effects/demogorgon-roar.wav', { volume: 0.5 });
        }

        // Vibrar dispositivo
        Utils.vibrate([100, 50, 100, 50, 200]);

        // Aguardar 3 segundos antes de permitir próximo ataque (conforme requisito)
        await Utils.wait(3000);

        Utils.log('Ataque com taco concluído - gasolina agora disponível');
    }

    async handleGasolinaAttack() {
        Utils.log('Processando ataque com gasolina...');

        // Reproduzir som de fogo/explosão
        if (window.game && window.game.audioManager) {
            window.game.audioManager.playAudio('sounds/effects/portal-open.wav', { volume: 0.7 });
        }

        // Vibração mais intensa para o ataque final
        Utils.vibrate([200, 100, 200, 100, 300]);

        // Animação especial de desaparecimento do Demogorgon
        this.animateEnemyDefeat();

        Utils.log('Ataque com gasolina concluído - Demogorgon derrotado');
    }

    animateEnemyHit() {
        const combatUI = this.combatState.combatUI;
        if (combatUI) {
            combatUI.classList.add('enemy-hit');
            setTimeout(() => {
                combatUI.classList.remove('enemy-hit');
            }, 500);
        }

        // Animação no modelo 3D do inimigo
        const enemyModel = this.combatState.enemyModel;
        if (enemyModel) {
            // Adicionar animação de impacto
            enemyModel.setAttribute('animation__hit', {
                property: 'rotation',
                to: '0 380 0',
                dur: 300,
                easing: 'easeOutQuad'
            });

            // Efeito de flash vermelho
            enemyModel.setAttribute('animation__flash', {
                property: 'material.color',
                from: '#ffffff',
                to: '#ff0000',
                dur: 200,
                dir: 'alternate',
                loop: 2
            });
        }
    }

    animateEnemyDefeat() {
        const enemyModel = this.combatState.enemyModel;
        if (enemyModel) {
            // Parar animações de idle
            enemyModel.removeAttribute('animation__idle');
            enemyModel.removeAttribute('animation__breathe');

            // Animação de desaparecimento
            enemyModel.setAttribute('animation__defeat', {
                property: 'scale',
                to: '0 0 0',
                dur: 2000,
                easing: 'easeInBack'
            });

            enemyModel.setAttribute('animation__fade', {
                property: 'material.opacity',
                to: '0',
                dur: 2000,
                easing: 'easeInQuad'
            });

            // Remover modelo após animação
            setTimeout(() => {
                if (enemyModel.parentNode) {
                    enemyModel.parentNode.removeChild(enemyModel);
                }
                this.arState.activeObjects.delete('combat-enemy');
            }, 2000);
        }
    }

    showAttackSuccess(weaponType) {
        const combatUI = this.combatState.combatUI;
        if (!combatUI) return;

        const successEffect = document.createElement('div');
        successEffect.className = 'combat-success-effect';
        
        const messages = {
            'taco': 'ACERTO!',
            'gasolina': 'FINALIZADO!'
        };
        
        successEffect.textContent = messages[weaponType] || 'SUCESSO!';
        combatUI.appendChild(successEffect);

        // Remover efeito após animação
        setTimeout(() => {
            if (successEffect.parentNode) {
                successEffect.parentNode.removeChild(successEffect);
            }
        }, 1000);
    }

    async completeCombat() {
        Utils.log('Completando combate...');

        try {
            // Mudar fase para vitória
            this.combatState.phase = 'victory';

            // Animação de vitória na interface
            const combatUI = this.combatState.combatUI;
            if (combatUI) {
                combatUI.classList.add('victory');
            }

            // Aguardar um momento para o jogador ver a vitória
            await Utils.wait(2000);

            // Ocultar interface de combate
            this.hideCombatInterface();

            // Emitir evento de combate completo
            this.emit('combatCompleted', {
                enemy: this.combatState.enemy,
                attacksPerformed: this.combatState.attacksPerformed,
                weaponsUsed: [...this.combatState.weaponsUsed]
            });

            // Limpar estado do combate
            this.combatState = null;
            this.arState.currentMode = null;

            Utils.log('Combate completado com sucesso');

        } catch (error) {
            Utils.log(`Erro ao completar combate: ${error.message}`, 'error');
        }
    }

    hideCombatInterface() {
        const combatInterface = document.getElementById('combat-interface');
        if (combatInterface) {
            combatInterface.classList.add('exiting');
            
            setTimeout(() => {
                combatInterface.classList.add('hidden');
                combatInterface.classList.remove('entering', 'exiting', 'victory');
            }, 500);
        }

        Utils.log('Interface de combate ocultada');
    }

    createCombatInterface() {
        // Remover interface existente se houver
        this.removeCombatInterface();
        
        // Criar container da interface de combate
        const combatUI = document.createElement('div');
        combatUI.id = 'combat-interface';
        combatUI.className = 'combat-interface';
        
        combatUI.innerHTML = `
            <div class="combat-header">
                <h3 class="combat-title">DEMOGORGON DETECTADO!</h3>
                <p class="combat-instruction">Use seus itens para atacar</p>
            </div>
            <div class="combat-actions">
                <button id="combat-taco" class="combat-button weapon-button" data-weapon="taco">
                    <img src="assets/img/taco.png" alt="Taco">
                    <span>Taco</span>
                </button>
                <button id="combat-gasolina" class="combat-button weapon-button disabled" data-weapon="gasolina">
                    <img src="assets/img/gasolina.png" alt="Gasolina">
                    <span>Gasolina</span>
                </button>
            </div>
            <div class="combat-status">
                <div class="combat-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="combat-progress-fill"></div>
                    </div>
                    <span class="progress-text" id="combat-progress-text">Prepare-se para atacar!</span>
                </div>
            </div>
        `;
        
        // Adicionar ao DOM
        document.body.appendChild(combatUI);
        
        // Configurar event listeners
        this.setupCombatEventListeners();
        
        // Animar entrada
        setTimeout(() => {
            combatUI.classList.add('show');
        }, 100);
        
        Utils.log('Interface de combate criada');
    }

    setupCombatEventListeners() {
        const tacoButton = document.getElementById('combat-taco');
        const gasolinaButton = document.getElementById('combat-gasolina');
        
        if (tacoButton) {
            tacoButton.addEventListener('click', () => {
                this.performAttack('taco');
            });
        }
        
        if (gasolinaButton) {
            gasolinaButton.addEventListener('click', () => {
                this.performAttack('gasolina');
            });
        }
    }

    performAttack(weapon) {
        Utils.log(`Realizando ataque com: ${weapon}`);
        
        const combatInterface = document.getElementById('combat-interface');
        const progressText = document.getElementById('combat-progress-text');
        const progressFill = document.getElementById('combat-progress-fill');
        const tacoButton = document.getElementById('combat-taco');
        const gasolinaButton = document.getElementById('combat-gasolina');
        
        if (weapon === 'taco') {
            // Verificar se o jogador tem o taco no inventário
            if (!window.game?.inventoryManager?.hasItem('taco')) {
                Utils.log('Jogador não possui taco no inventário', 'warn');
                this.showCombatMessage('Você não possui um taco!', 'error');
                return;
            }
            
            // Desabilitar botão do taco
            tacoButton.disabled = true;
            tacoButton.classList.add('used');
            
            // Atualizar progresso
            progressText.textContent = 'Atacando com taco...';
            progressFill.style.width = '50%';
            
            // Animar ataque do taco
            this.animateWeaponAttack('taco');
            
            // Vibrar dispositivo
            Utils.vibrate([200, 100, 200, 100, 200]);
            
            // Emitir evento de ataque
            this.emit('attackPerformed', { weapon: 'taco', damage: 50 });
            
            // Aguardar 3 segundos antes de habilitar gasolina
            setTimeout(() => {
                gasolinaButton.disabled = false;
                gasolinaButton.classList.remove('disabled');
                gasolinaButton.classList.add('ready');
                
                progressText.textContent = 'Agora use a gasolina!';
                
                // Piscar botão da gasolina para chamar atenção
                this.blinkButton(gasolinaButton);
                
            }, 3000);
            
        } else if (weapon === 'gasolina') {
            // Verificar se o jogador tem gasolina no inventário
            if (!window.game?.inventoryManager?.hasItem('gasolina')) {
                Utils.log('Jogador não possui gasolina no inventário', 'warn');
                this.showCombatMessage('Você não possui gasolina!', 'error');
                return;
            }
            
            // Verificar se o taco já foi usado
            if (!tacoButton.classList.contains('used')) {
                Utils.log('Taco deve ser usado primeiro', 'warn');
                this.showCombatMessage('Use o taco primeiro!', 'error');
                return;
            }
            
            // Desabilitar botão da gasolina
            gasolinaButton.disabled = true;
            gasolinaButton.classList.add('used');
            
            // Atualizar progresso
            progressText.textContent = 'Ataque final com gasolina!';
            progressFill.style.width = '100%';
            
            // Animar ataque da gasolina
            this.animateWeaponAttack('gasolina');
            
            // Vibração mais intensa para ataque final
            Utils.vibrate([300, 150, 300, 150, 300]);
            
            // Emitir evento de ataque final
            this.emit('attackPerformed', { weapon: 'gasolina', damage: 100, final: true });
            
            // Completar combate após animação
            setTimeout(() => {
                this.completeCombat();
            }, 2000);
        }
    }

    animateWeaponAttack(weapon) {
        const enemyModel = this.arState.activeObjects.get('combat-enemy');
        if (!enemyModel) return;
        
        if (weapon === 'taco') {
            // Animação de impacto do taco
            enemyModel.setAttribute('animation__hit', {
                property: 'rotation',
                to: '0 380 0',
                dur: 500,
                easing: 'easeOutBounce'
            });
            
            // Efeito de dano
            enemyModel.setAttribute('animation__damage', {
                property: 'scale',
                to: '1.3 1.3 1.3',
                dur: 300,
                dir: 'alternate',
                loop: 2,
                easing: 'easeInOutQuad'
            });
            
        } else if (weapon === 'gasolina') {
            // Animação de queima com gasolina
            enemyModel.setAttribute('animation__burn', {
                property: 'material.color',
                to: '#ff4444',
                dur: 1000,
                easing: 'easeInOutSine'
            });
            
            // Animação de desaparecimento
            enemyModel.setAttribute('animation__disappear', {
                property: 'scale',
                to: '0 0 0',
                dur: 1500,
                delay: 500,
                easing: 'easeInBack'
            });
            
            // Efeito de partículas de fogo (simulado com mudança de cor)
            enemyModel.setAttribute('animation__fire', {
                property: 'rotation',
                to: '0 720 0',
                dur: 2000,
                easing: 'linear'
            });
        }
    }

    blinkButton(button) {
        let blinkCount = 0;
        const maxBlinks = 6;
        
        const blinkInterval = setInterval(() => {
            button.classList.toggle('blink');
            blinkCount++;
            
            if (blinkCount >= maxBlinks) {
                clearInterval(blinkInterval);
                button.classList.remove('blink');
            }
        }, 300);
    }

    showCombatMessage(message, type = 'info') {
        // Criar elemento de mensagem
        const messageElement = document.createElement('div');
        messageElement.className = `combat-message ${type}`;
        messageElement.textContent = message;
        
        // Adicionar ao container de combate
        const combatInterface = document.getElementById('combat-interface');
        if (combatInterface) {
            combatInterface.appendChild(messageElement);
            
            // Animar entrada
            setTimeout(() => {
                messageElement.classList.add('show');
            }, 10);
            
            // Remover após 3 segundos
            setTimeout(() => {
                messageElement.classList.add('hide');
                setTimeout(() => {
                    if (messageElement.parentNode) {
                        messageElement.parentNode.removeChild(messageElement);
                    }
                }, 300);
            }, 3000);
        }
    }

    completeCombat() {
        Utils.log('Combate completado - Demogorgon derrotado!');
        
        const progressText = document.getElementById('combat-progress-text');
        if (progressText) {
            progressText.textContent = 'Demogorgon derrotado!';
        }
        
        // Remover modelo do Demogorgon
        const enemyModel = this.arState.activeObjects.get('combat-enemy');
        if (enemyModel && enemyModel.parentNode) {
            enemyModel.parentNode.removeChild(enemyModel);
            this.arState.activeObjects.delete('combat-enemy');
        }
        
        // Remover interface de combate após delay
        setTimeout(() => {
            this.removeCombatInterface();
        }, 3000);
        
        // Emitir evento de combate completado
        this.emit('combatCompleted', { 
            enemy: 'demogorgon', 
            victory: true,
            weaponsUsed: ['taco', 'gasolina']
        });
        
        // Vibração de vitória
        Utils.vibrate([100, 50, 100, 50, 100, 50, 300]);
    }

    removeCombatInterface() {
        const combatInterface = document.getElementById('combat-interface');
        if (combatInterface) {
            combatInterface.classList.add('hide');
            setTimeout(() => {
                if (combatInterface.parentNode) {
                    combatInterface.parentNode.removeChild(combatInterface);
                }
            }, 500);
        }
        
        Utils.log('Interface de combate removida');
    }

    // Método para limpar estado de combate
    cleanupCombat() {
        this.removeCombatInterface();
        
        // Remover modelo do inimigo se ainda existir
        const enemyModel = this.arState.activeObjects.get('combat-enemy');
        if (enemyModel && enemyModel.parentNode) {
            enemyModel.parentNode.removeChild(enemyModel);
            this.arState.activeObjects.delete('combat-enemy');
        }
        
        Utils.log('Estado de combate limpo');
    }       // Adicionar à câmera
            this.camera.appendChild(enemyModel);
            this.arState.activeObjects.set(enemyModel.id, enemyModel);
            
            // Configurar estado de combate
            this.combatState = {
                enemy: arContent.enemy,
                model: enemyModel,
                phase: 'appearing', // appearing, idle, attacking, defeated
                tacoUsed: false,
                gasolinaUsed: false,
                startTime: Date.now()
            };
            
            Utils.log('Combate iniciado - Demogorgon aparecendo');
            this.emit('combatStarted', arContent.enemy);
            
            // Vibrar dispositivo para indicar perigo
            Utils.vibrate([300, 100, 300, 100, 300]);
            
        } catch (error) {
            Utils.log(`Erro ao iniciar combate: ${error.message}`, 'error');
            throw error;
        }
    }

    // Executar ataque com item específico
    performAttack(itemType) {
        if (!this.combatState || !this.combatState.model) {
            Utils.log('Nenhum combate ativo para executar ataque', 'warn');
            return false;
        }

        const enemyModel = this.combatState.model;
        
        switch (itemType) {
            case 'taco':
                return this.performTacoAttack(enemyModel);
            case 'gasolina':
                return this.performGasolinaAttack(enemyModel);
            default:
                Utils.log(`Tipo de ataque desconhecido: ${itemType}`, 'warn');
                return false;
        }
    }

    performTacoAttack(enemyModel) {
        Utils.log('Executando ataque com taco');
        
        // Marcar taco como usado
        this.combatState.tacoUsed = true;
        this.combatState.phase = 'attacking';
        
        // Animação de impacto no Demogorgon
        enemyModel.setAttribute('animation__hit', {
            property: 'rotation',
            to: '0 -30 0',
            dur: 200,
            easing: 'easeOutQuad'
        });
        
        // Animação de recuo
        enemyModel.setAttribute('animation__recoil', {
            property: 'position',
            to: '0 1 -5',
            dur: 500,
            easing: 'easeOutBack',
            delay: 200
        });
        
        // Som de impacto
        const hitSound = document.createElement('a-sound');
        hitSound.setAttribute('src', 'sounds/effects/demogorgon-roar.wav');
        hitSound.setAttribute('autoplay', 'true');
        hitSound.setAttribute('volume', '0.8');
        enemyModel.appendChild(hitSound);
        
        // Vibração de impacto
        Utils.vibrate([150, 50, 150]);
        
        // Retornar à posição original após o impacto
        setTimeout(() => {
            enemyModel.setAttribute('animation__return', {
                property: 'position',
                to: '0 1 -4',
                dur: 1000,
                easing: 'easeInOutQuad'
            });
            
            enemyModel.setAttribute('animation__straighten', {
                property: 'rotation',
                to: '0 0 0',
                dur: 1000,
                easing: 'easeInOutQuad'
            });
        }, 700);
        
        Utils.log('Ataque com taco executado - aguardando próximo item');
        this.emit('attackPerformed', { weapon: 'taco', success: true });
        
        return true;
    }

    performGasolinaAttack(enemyModel) {
        if (!this.combatState.tacoUsed) {
            Utils.log('Taco deve ser usado primeiro!', 'warn');
            return false;
        }
        
        Utils.log('Executando ataque final com gasolina');
        
        // Marcar gasolina como usada
        this.combatState.gasolinaUsed = true;
        this.combatState.phase = 'defeated';
        
        // Parar todas as animações existentes
        enemyModel.removeAttribute('animation__idle');
        enemyModel.removeAttribute('animation__breathe');
        
        // Animação de derrota - encolher e desaparecer
        enemyModel.setAttribute('animation__defeat', {
            property: 'scale',
            to: '0 0 0',
            dur: 2000,
            easing: 'easeInBack'
        });
        
        // Animação de rotação final
        enemyModel.setAttribute('animation__spin', {
            property: 'rotation',
            to: '0 720 0',
            dur: 2000,
            easing: 'easeInQuad'
        });
        
        // Efeito de fade out
        enemyModel.setAttribute('animation__fade', {
            property: 'material.opacity',
            to: '0',
            dur: 2000,
            easing: 'easeInQuad'
        });
        
        // Som de derrota
        const defeatSound = document.createElement('a-sound');
        defeatSound.setAttribute('src', 'sounds/effects/demogorgon-approach.wav');
        defeatSound.setAttribute('autoplay', 'true');
        defeatSound.setAttribute('volume', '0.6');
        enemyModel.appendChild(defeatSound);
        
        // Vibração de vitória
        Utils.vibrate([100, 50, 100, 50, 100, 50, 300]);
        
        // Remover modelo após animação
        setTimeout(() => {
            this.hideCombatEnemy();
        }, 2500);
        
        Utils.log('Ataque final executado - Demogorgon derrotado!');
        this.emit('attackPerformed', { weapon: 'gasolina', success: true, final: true });
        this.emit('combatCompleted', { enemy: this.combatState.enemy, victory: true });
        
        return true;
    }

    // Ocultar inimigo de combate
    hideCombatEnemy() {
        if (this.combatState && this.combatState.model) {
            const enemyModel = this.combatState.model;
            
            // Remover do DOM
            if (enemyModel.parentNode) {
                enemyModel.parentNode.removeChild(enemyModel);
            }
            
            // Remover do estado ativo
            this.arState.activeObjects.delete('combat-enemy');
            
            Utils.log('Inimigo de combate removido');
        }
        
        // Limpar estado de combate
        this.combatState = null;
        this.arState.currentMode = null;
    }

    // Obter estado atual do combate
    getCombatState() {
        return this.combatState;
    }

    // Verificar se está em combate
    isInCombat() {
        return this.combatState !== null && this.arState.currentMode === 'combat';
    }

    async loadModel(modelPath) {
        // Verificar cache
        if (this.modelCache.has(modelPath)) {
            return this.modelCache.get(modelPath);
        }
        
        // Verificar se já está carregando
        if (this.loadingPromises.has(modelPath)) {
            return this.loadingPromises.get(modelPath);
        }
        
        // Criar promise de carregamento
        const loadPromise = new Promise((resolve, reject) => {
            const loader = new THREE.GLTFLoader();
            loader.load(
                modelPath,
                (gltf) => {
                    this.modelCache.set(modelPath, gltf);
                    this.loadingPromises.delete(modelPath);
                    Utils.log(`Modelo carregado: ${modelPath}`);
                    resolve(gltf);
                },
                (progress) => {
                    // Progresso de carregamento
                },
                (error) => {
                    this.loadingPromises.delete(modelPath);
                    Utils.log(`Erro ao carregar modelo ${modelPath}: ${error.message}`, 'error');
                    reject(error);
                }
            );
        });
        
        this.loadingPromises.set(modelPath, loadPromise);
        return loadPromise;
    }

    handleARClick(event) {
        const target = event.target;
        
        // Verificar se o objeto é clicável
        if (!target.classList.contains('clickable')) {
            return;
        }
        
        Utils.log('Objeto AR clicado:', target.id);
        
        // Determinar tipo de objeto baseado no ID
        if (target.id.includes('ar-model')) {
            this.handleModelClick(target);
        } else if (target.id.includes('collection-item')) {
            this.handleCollectionClick(target);
        } else if (target.id.includes('combat-enemy')) {
            this.handleCombatClick(target);
        } else if (target.tagName === 'A-MARKER') {
            this.handleMarkerClick(target);
        }
    }

    handleModelClick(target) {
        Utils.log(`Modelo AR clicado: ${target.id}`);
        
        // Extrair tipo de modelo do ID ou atributos
        let objectType = 'unknown';
        if (target.id.includes('bicicleta') || target.getAttribute('gltf-model')?.includes('bicicleta')) {
            objectType = 'bicicleta-will';
        } else if (target.id.includes('castle') || target.getAttribute('gltf-model')?.includes('castle')) {
            objectType = 'castle-byers';
        }
        
        // Animação de coleta
        target.setAttribute('animation__collect', {
            property: 'scale',
            to: '0 0 0',
            dur: 800,
            easing: 'easeInBack'
        });
        
        // Emitir evento após pequeno delay para permitir animação
        setTimeout(() => {
            this.emit('objectClicked', objectType);
            
            // Remover objeto após coleta
            if (target.parentNode) {
                target.parentNode.removeChild(target);
            }
            this.arState.activeObjects.delete(target.id);
        }, 200);
    }

    handleCollectionClick(target) {
        // Extrair ID do item do ID do elemento
        const itemId = target.id.replace('collection-item-', '');
        Utils.log(`Item de coleta clicado: ${itemId}`);
        
        // Usar método collectItem existente
        this.collectItem(itemId, target);
    }

    handleCombatClick(target) {
        Utils.log('Inimigo de combate clicado');
        this.emit('objectClicked', 'combat-enemy');
    }

    handleMarkerClick(target) {
        Utils.log('Marcador AR clicado');
        // Processar clique em marcador se necessário
    }

    handleMarkerFound(event) {
        const marker = event.target;
        Utils.log(`Marcador encontrado: ${marker.id}`);
        this.arState.currentMarker = marker.id;
    }

    handleMarkerLost(event) {
        const marker = event.target;
        Utils.log(`Marcador perdido: ${marker.id}`);
        if (this.arState.currentMarker === marker.id) {
            this.arState.currentMarker = null;
        }
    }

    // Métodos para combate
    performAttack(weaponType) {
        Utils.log(`Executando ataque com: ${weaponType}`);
        
        const enemy = this.arState.activeObjects.get('combat-enemy');
        if (!enemy) {
            Utils.log('Nenhum inimigo encontrado para atacar', 'warn');
            return;
        }
        
        // Animação de ataque no inimigo
        enemy.setAttribute('animation__hit', {
            property: 'rotation',
            to: '0 720 0',
            dur: 1000,
            easing: 'easeOutBounce'
        });
        
        // Efeito visual baseado na arma
        if (weaponType === 'taco') {
            // Efeito de impacto
            enemy.setAttribute('animation__shake', {
                property: 'position',
                to: '0.2 0 -3',
                dur: 100,
                dir: 'alternate',
                loop: 3,
                easing: 'linear'
            });
            
            // Marcar que taco foi usado
            if (!this.combatState) {
                this.combatState = {};
            }
            this.combatState.tacoUsed = true;
            
        } else if (weaponType === 'gasolina') {
            // Efeito de fogo/explosão
            enemy.setAttribute('animation__burn', {
                property: 'scale',
                to: '0.5 0.5 0.5',
                dur: 2000,
                easing: 'easeInQuart'
            });
        }
    }

    hideCombatEnemy() {
        const enemy = this.arState.activeObjects.get('combat-enemy');
        if (enemy) {
            // Animação de desaparecimento
            enemy.setAttribute('animation__disappear', {
                property: 'scale',
                to: '0 0 0',
                dur: 1000,
                easing: 'easeInBack'
            });
            
            // Remover após animação
            setTimeout(() => {
                if (enemy.parentNode) {
                    enemy.parentNode.removeChild(enemy);
                }
                this.arState.activeObjects.delete('combat-enemy');
            }, 1000);
            
            Utils.log('Inimigo de combate removido');
        }
    }

    clearActiveObjects() {
        // Remover todos os objetos ativos
        this.arState.activeObjects.forEach((object, id) => {
            if (object.parentNode) {
                object.parentNode.removeChild(object);
            }
        });
        this.arState.activeObjects.clear();
        
        // Remover marcadores de imagem
        this.arState.imageTrackers.forEach((tracker, id) => {
            if (tracker.parentNode) {
                tracker.parentNode.removeChild(tracker);
            }
        });
        this.arState.imageTrackers.clear();
        
        // Cancelar áudio com delay
        this.cancelDelayedAudio();
        
        Utils.log('Todos os objetos AR foram limpos');
    }

    async validateARSystem() {
        const validation = {
            webgl: false,
            camera: false,
            aframe: false,
            arjs: false
        };
        
        // Verificar WebGL
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        validation.webgl = !!gl;
        
        // Verificar câmera
        validation.camera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        
        // Verificar A-Frame
        validation.aframe = typeof AFRAME !== 'undefined';
        
        // Verificar AR.js
        validation.arjs = validation.aframe && !!AFRAME.components['arjs'];
        
        Utils.log('Validação do sistema AR:', validation);
        return validation;
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
        // Parar câmera
        this.stopCamera();
        
        // Limpar objetos
        this.clearActiveObjects();
        
        // Limpar cache
        this.modelCache.clear();
        this.loadingPromises.clear();
        
        // Limpar event listeners
        this.eventListeners.clear();
        
        // Cancelar timeouts
        this.cancelDelayedAudio();
        
        Utils.log('ARManager limpo');
    }
}

// Exportar para uso global
window.ARManager = ARManager;et);
        }
        
        // Adicionar feedback visual
        this.addClickFeedback(target);
    }

    handleModelClick(target) {
        // Determinar qual modelo foi clicado baseado no gltf-model
        const modelSrc = target.getAttribute('gltf-model');
        let objectType = 'unknown';
        
        if (modelSrc && modelSrc.includes('bicicleta-will')) {
            objectType = 'bicicleta-will';
        } else if (modelSrc && modelSrc.includes('castle_byers')) {
            objectType = 'castle-byers';
        }
        
        Utils.log(`Modelo AR clicado: ${objectType} (src: ${modelSrc})`);
        
        // Adicionar animação de coleta
        target.setAttribute('animation', {
            property: 'scale',
            to: '0.1 0.1 0.1',
            dur: 800,
            easing: 'easeInBack'
        });
        
        // Adicionar efeito visual de coleta
        target.setAttribute('animation__rotate', {
            property: 'rotation',
            to: '0 360 0',
            dur: 800,
            easing: 'easeInBack'
        });
        
        // Remover após animação
        setTimeout(() => {
            if (target.parentNode) {
                target.parentNode.removeChild(target);
            }
            this.arState.activeObjects.delete(target.id);
            Utils.log(`Modelo AR removido: ${objectType}`);
        }, 800);
        
        this.emit('objectClicked', objectType);
    }

    handleCollectionClick(target) {
        const itemId = target.id.replace('collection-item-', '');
        this.collectItem(itemId, target);
    }

    handleCombatClick(target) {
        this.emit('combatObjectClicked', target.id);
    }

    handleMarkerClick(target) {
        this.emit('markerClicked', target.id);
    }

    addClickFeedback(target) {
        // Adicionar efeito visual de clique
        const originalScale = target.getAttribute('scale') || '1 1 1';
        
        // Animação de "pulse" no clique
        target.setAttribute('animation__click', {
            property: 'scale',
            from: originalScale,
            to: '1.2 1.2 1.2',
            dur: 150,
            dir: 'alternate',
            loop: 1,
            easing: 'easeInOutQuad'
        });
        
        // Remover animação após completar
        setTimeout(() => {
            target.removeAttribute('animation__click');
        }, 300);
    }

    handleMarkerFound(event) {
        const marker = event.target;
        Utils.log('Marcador encontrado:', marker.id);
        this.arState.currentMarker = marker.id;
    }

    handleMarkerLost(event) {
        const marker = event.target;
        Utils.log('Marcador perdido:', marker.id);
        if (this.arState.currentMarker === marker.id) {
            this.arState.currentMarker = null;
        }
    }

    clearActiveObjects() {
        // Remover todos os objetos ativos
        this.arState.activeObjects.forEach((object, id) => {
            if (object.parentNode) {
                object.parentNode.removeChild(object);
            }
        });
        this.arState.activeObjects.clear();
        
        // Remover rastreadores de imagem
        this.arState.imageTrackers.forEach((tracker, id) => {
            if (tracker.parentNode) {
                tracker.parentNode.removeChild(tracker);
            }
        });
        this.arState.imageTrackers.clear();
        
        Utils.log('Objetos AR limpos');
    }

    // Validar sistema AR
    async validateARSystem() {
        const validation = {
            webgl: false,
            camera: false,
            aframe: false,
            arjs: false,
            models: false,
            orientation: false
        };

        try {
            // Verificar WebGL
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            validation.webgl = !!gl;

            // Verificar câmera
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop());
                validation.camera = true;
            } catch (error) {
                validation.camera = false;
            }

            // Verificar A-Frame
            validation.aframe = typeof AFRAME !== 'undefined';

            // Verificar AR.js
            validation.arjs = typeof THREEx !== 'undefined' && typeof THREEx.ArToolkitSource !== 'undefined';

            // Verificar modelos 3D
            const modelPaths = [
                'assets/models/bicicleta-will.glb',
                'src/models/castle_byers.glb'
            ];
            
            let modelsValid = 0;
            for (const path of modelPaths) {
                try {
                    const response = await fetch(path, { method: 'HEAD' });
                    if (response.ok) modelsValid++;
                } catch (error) {
                    // Modelo não encontrado
                }
            }
            validation.models = modelsValid === modelPaths.length;

            // Verificar orientação
            validation.orientation = window.innerHeight > window.innerWidth;

            Utils.log('Validação do sistema AR:', validation);
            return validation;

        } catch (error) {
            Utils.log(`Erro na validação AR: ${error.message}`, 'error');
            return validation;
        }
    }

    // Obter estatísticas do AR
    getARStats() {
        return {
            isActive: this.isActive,
            cameraStarted: this.arState.cameraStarted,
            currentMode: this.arState.currentMode,
            activeObjects: this.arState.activeObjects.size,
            imageTrackers: this.arState.imageTrackers.size,
            currentMarker: this.arState.currentMarker,
            modelsCached: this.modelCache.size
        };
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
        this.stopCamera();
        this.clearActiveObjects();
        this.cancelDelayedAudio();
        this.eventListeners.clear();
        this.modelCache.clear();
        this.loadingPromises.clear();
        
        Utils.log('ARManager limpo');
    }
}

window.ARManager = ARManager;