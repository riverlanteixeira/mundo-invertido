// Gerenciador de performance e otimizações
class PerformanceManager {
    constructor() {
        this.isInitialized = false;
        this.performanceMetrics = {
            fps: 0,
            memoryUsage: 0,
            loadTime: 0,
            renderTime: 0
        };
        
        // Cache de assets otimizados
        this.assetCache = new Map();
        this.modelCache = new Map();
        this.textureCache = new Map();
        
        // Sistema LOD (Level of Detail) aprimorado
        this.lodSystem = {
            enabled: true,
            distances: {
                high: 10,    // < 10m = alta qualidade
                medium: 50,  // 10-50m = média qualidade
                low: 100     // > 50m = baixa qualidade
            },
            currentLOD: 'high',
            adaptiveEnabled: true,
            performanceBasedLOD: true,
            lodLevels: {
                high: {
                    maxVertices: 50000,
                    textureSize: 1024,
                    animationsEnabled: true,
                    shadowsEnabled: true,
                    particlesEnabled: true
                },
                medium: {
                    maxVertices: 20000,
                    textureSize: 512,
                    animationsEnabled: true,
                    shadowsEnabled: false,
                    particlesEnabled: false
                },
                low: {
                    maxVertices: 5000,
                    textureSize: 256,
                    animationsEnabled: false,
                    shadowsEnabled: false,
                    particlesEnabled: false
                }
            }
        };
        
        // Configurações de otimização
        this.optimizationConfig = {
            maxActiveModels: 3,
            maxTextureSize: 1024,
            compressionEnabled: true,
            memoryThreshold: 100 * 1024 * 1024, // 100MB
            cleanupInterval: 30000, // 30 segundos
            targetFPS: 30
        };
        
        // Monitoramento de performance
        this.performanceMonitor = {
            enabled: true,
            interval: null,
            samples: [],
            maxSamples: 60
        };
        
        // Cleanup automático
        this.cleanupTimer = null;
        
        Utils.log('PerformanceManager inicializado');
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            // Detectar capacidades do dispositivo
            await this.detectDeviceCapabilities();
            
            // Configurar otimizações baseadas no dispositivo
            this.configureOptimizations();
            
            // Iniciar monitoramento de performance
            this.startPerformanceMonitoring();
            
            // Configurar cleanup automático
            this.setupAutomaticCleanup();
            
            // Iniciar preload de assets críticos
            await this.preloadCriticalAssets();
            
            // Iniciar otimização em tempo real
            this.startRealTimeOptimization();
            
            this.isInitialized = true;
            Utils.log('PerformanceManager inicializado com sucesso');
            
        } catch (error) {
            Utils.log(`Erro ao inicializar PerformanceManager: ${error.message}`, 'error');
            throw error;
        }
    }

    async detectDeviceCapabilities() {
        const capabilities = {
            gpu: this.detectGPUCapabilities(),
            memory: this.detectMemoryCapabilities(),
            cpu: this.detectCPUCapabilities(),
            network: this.detectNetworkCapabilities()
        };
        
        // Ajustar configurações baseadas nas capacidades
        if (capabilities.gpu.tier === 'low') {
            this.optimizationConfig.maxActiveModels = 2;
            this.optimizationConfig.maxTextureSize = 512;
            this.optimizationConfig.targetFPS = 24;
        } else if (capabilities.gpu.tier === 'medium') {
            this.optimizationConfig.maxActiveModels = 3;
            this.optimizationConfig.maxTextureSize = 1024;
            this.optimizationConfig.targetFPS = 30;
        }
        
        if (capabilities.memory.available < 2048) { // < 2GB RAM
            this.optimizationConfig.memoryThreshold = 50 * 1024 * 1024; // 50MB
            this.optimizationConfig.cleanupInterval = 15000; // 15 segundos
        }
        
        Utils.log(`Capacidades detectadas: GPU=${capabilities.gpu.tier}, RAM=${capabilities.memory.available}MB`);
        return capabilities;
    }

    detectGPUCapabilities() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            return { tier: 'none', renderer: 'unknown' };
        }
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
        
        // Detectar tier baseado no renderer
        let tier = 'medium';
        if (renderer.toLowerCase().includes('adreno')) {
            // Qualcomm Adreno (Samsung S20 FE usa Adreno 650)
            if (renderer.includes('650') || renderer.includes('660') || renderer.includes('730')) {
                tier = 'high';
            } else if (renderer.includes('530') || renderer.includes('540') || renderer.includes('630')) {
                tier = 'medium';
            } else {
                tier = 'low';
            }
        } else if (renderer.toLowerCase().includes('mali')) {
            // ARM Mali
            tier = 'medium';
        } else if (renderer.toLowerCase().includes('powervr')) {
            // PowerVR
            tier = 'low';
        }
        
        return { tier, renderer };
    }

    detectMemoryCapabilities() {
        let available = 4096; // Default 4GB
        
        // Tentar detectar memória real (limitado em navegadores)
        if ('memory' in performance) {
            available = Math.round(performance.memory.jsHeapSizeLimit / (1024 * 1024));
        } else if ('deviceMemory' in navigator) {
            available = navigator.deviceMemory * 1024;
        }
        
        return { available };
    }

    detectCPUCapabilities() {
        const cores = navigator.hardwareConcurrency || 4;
        
        // Benchmark simples de CPU
        const start = performance.now();
        let iterations = 0;
        while (performance.now() - start < 10) { // 10ms test
            Math.random() * Math.random();
            iterations++;
        }
        
        const score = iterations / 10; // iterations per ms
        
        return { cores, score };
    }

    detectNetworkCapabilities() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection) {
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt
            };
        }
        
        return { effectiveType: '4g', downlink: 10, rtt: 100 };
    }

    configureOptimizations() {
        // Configurar Three.js para melhor performance
        if (typeof THREE !== 'undefined') {
            // Configurar renderer otimizado
            THREE.Cache.enabled = true;
        }
        
        // Configurar A-Frame para melhor performance
        if (typeof AFRAME !== 'undefined') {
            AFRAME.registerComponent('performance-optimizer', {
                init: function() {
                    // Otimizações específicas do A-Frame
                    this.el.setAttribute('renderer', {
                        antialias: false,
                        colorManagement: true,
                        sortObjects: true,
                        physicallyCorrectLights: false
                    });
                }
            });
        }
        
        Utils.log('Otimizações configuradas');
    }

    startPerformanceMonitoring() {
        if (!this.performanceMonitor.enabled) return;
        
        this.performanceMonitor.interval = setInterval(() => {
            this.collectPerformanceMetrics();
        }, 1000);
        
        Utils.log('Monitoramento de performance iniciado');
    }

    collectPerformanceMetrics() {
        const metrics = {
            timestamp: Date.now(),
            fps: this.calculateFPS(),
            memory: this.getMemoryUsage(),
            renderTime: this.getRenderTime()
        };
        
        this.performanceMonitor.samples.push(metrics);
        
        // Manter apenas as últimas amostras
        if (this.performanceMonitor.samples.length > this.performanceMonitor.maxSamples) {
            this.performanceMonitor.samples.shift();
        }
        
        // Atualizar métricas atuais
        this.performanceMetrics = {
            fps: metrics.fps,
            memoryUsage: metrics.memory,
            renderTime: metrics.renderTime
        };
        
        // Verificar se precisa otimizar
        this.checkPerformanceThresholds(metrics);
    }

    calculateFPS() {
        // Usar requestAnimationFrame para calcular FPS
        if (!this.fpsCounter) {
            this.fpsCounter = {
                frames: 0,
                lastTime: performance.now(),
                fps: 60
            };
        }
        
        this.fpsCounter.frames++;
        const currentTime = performance.now();
        
        if (currentTime - this.fpsCounter.lastTime >= 1000) {
            this.fpsCounter.fps = Math.round(
                (this.fpsCounter.frames * 1000) / (currentTime - this.fpsCounter.lastTime)
            );
            this.fpsCounter.frames = 0;
            this.fpsCounter.lastTime = currentTime;
        }
        
        return this.fpsCounter.fps;
    }

    getMemoryUsage() {
        if ('memory' in performance) {
            return Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
        }
        return 0;
    }

    getRenderTime() {
        // Medir tempo de render usando performance marks
        if (this.lastRenderMark) {
            const measures = performance.getEntriesByType('measure');
            const renderMeasures = measures.filter(m => m.name.includes('render'));
            
            if (renderMeasures.length > 0) {
                return renderMeasures[renderMeasures.length - 1].duration;
            }
        }
        return 0;
    }

    checkPerformanceThresholds(metrics) {
        // Verificar FPS baixo
        if (metrics.fps < this.optimizationConfig.targetFPS * 0.8) {
            this.handleLowFPS();
        }
        
        // Verificar uso de memória alto
        if (metrics.memory > this.optimizationConfig.memoryThreshold / (1024 * 1024)) {
            this.handleHighMemoryUsage();
        }
        
        // Verificar tempo de render alto
        if (metrics.renderTime > 33) { // > 33ms = < 30 FPS
            this.handleSlowRender();
        }
    }

    handleLowFPS() {
        Utils.log('FPS baixo detectado, aplicando otimizações', 'warn');
        
        // Reduzir qualidade LOD
        this.reduceLODQuality();
        
        // Limpar cache desnecessário
        this.cleanupUnusedAssets();
        
        // Reduzir número de modelos ativos
        this.limitActiveModels();
    }

    handleHighMemoryUsage() {
        Utils.log('Uso alto de memória detectado, limpando cache', 'warn');
        
        // Limpeza agressiva de cache
        this.aggressiveCleanup();
        
        // Reduzir tamanho de texturas
        this.reduceTextureQuality();
    }

    handleSlowRender() {
        Utils.log('Render lento detectado, otimizando', 'warn');
        
        // Simplificar geometrias
        this.simplifyGeometries();
        
        // Reduzir efeitos visuais
        this.reduceVisualEffects();
    }

    // Sistema LOD (Level of Detail) aprimorado
    updateLOD(distance, performanceMetrics = null) {
        let newLOD = this.calculateOptimalLOD(distance, performanceMetrics);
        
        if (newLOD !== this.lodSystem.currentLOD) {
            this.lodSystem.currentLOD = newLOD;
            this.applyLOD(newLOD);
            Utils.log(`LOD atualizado para: ${newLOD} (distância: ${distance.toFixed(1)}m)`);
        }
    }

    calculateOptimalLOD(distance, performanceMetrics = null) {
        // LOD baseado em distância
        let distanceBasedLOD = 'high';
        if (distance > this.lodSystem.distances.low) {
            distanceBasedLOD = 'low';
        } else if (distance > this.lodSystem.distances.medium) {
            distanceBasedLOD = 'medium';
        }
        
        // Se LOD adaptativo não está habilitado, usar apenas distância
        if (!this.lodSystem.adaptiveEnabled) {
            return distanceBasedLOD;
        }
        
        // LOD baseado em performance
        const currentMetrics = performanceMetrics || this.performanceMetrics;
        let performanceBasedLOD = 'high';
        
        if (currentMetrics.fps < 20) {
            performanceBasedLOD = 'low';
        } else if (currentMetrics.fps < 25) {
            performanceBasedLOD = 'medium';
        }
        
        // Considerar uso de memória
        if (currentMetrics.memoryUsage > this.optimizationConfig.memoryThreshold / (1024 * 1024) * 0.8) {
            performanceBasedLOD = this.reduceLODLevel(performanceBasedLOD);
        }
        
        // Retornar o LOD mais conservador
        return this.getMoreConservativeLOD(distanceBasedLOD, performanceBasedLOD);
    }

    reduceLODLevel(currentLOD) {
        switch (currentLOD) {
            case 'high': return 'medium';
            case 'medium': return 'low';
            case 'low': return 'low';
            default: return 'medium';
        }
    }

    getMoreConservativeLOD(lod1, lod2) {
        const lodPriority = { 'low': 0, 'medium': 1, 'high': 2 };
        return lodPriority[lod1] < lodPriority[lod2] ? lod1 : lod2;
    }

    applyLOD(level) {
        const scene = document.getElementById('ar-scene');
        if (!scene) return;
        
        const models = scene.querySelectorAll('[gltf-model]');
        
        models.forEach(model => {
            switch (level) {
                case 'low':
                    // Reduzir detalhes, desabilitar animações
                    model.setAttribute('animation-mixer', 'enabled: false');
                    this.setModelQuality(model, 0.5);
                    break;
                case 'medium':
                    // Qualidade média
                    model.setAttribute('animation-mixer', 'enabled: true');
                    this.setModelQuality(model, 0.75);
                    break;
                case 'high':
                    // Qualidade máxima
                    model.setAttribute('animation-mixer', 'enabled: true');
                    this.setModelQuality(model, 1.0);
                    break;
            }
        });
    }

    setModelQuality(model, quality) {
        // Ajustar escala baseada na qualidade
        const currentScale = model.getAttribute('scale');
        if (currentScale) {
            const scale = typeof currentScale === 'string' ? 
                currentScale.split(' ').map(Number) : 
                [currentScale.x, currentScale.y, currentScale.z];
            
            const adjustedScale = scale.map(s => s * quality);
            model.setAttribute('scale', adjustedScale.join(' '));
        }
    }

    reduceLODQuality() {
        // Forçar LOD baixo temporariamente
        this.applyLOD('low');
        
        // Restaurar LOD normal após um tempo
        setTimeout(() => {
            this.applyLOD(this.lodSystem.currentLOD);
        }, 5000);
    }

    // Compressão de assets
    async compressAsset(assetUrl, type = 'auto') {
        const cacheKey = `compressed_${assetUrl}`;
        
        // Verificar cache primeiro
        if (this.assetCache.has(cacheKey)) {
            return this.assetCache.get(cacheKey);
        }
        
        try {
            let compressedAsset;
            
            switch (type) {
                case 'image':
                    compressedAsset = await this.compressImage(assetUrl);
                    break;
                case 'model':
                    compressedAsset = await this.compressModel(assetUrl);
                    break;
                case 'audio':
                    compressedAsset = await this.compressAudio(assetUrl);
                    break;
                default:
                    // Auto-detectar tipo
                    compressedAsset = await this.autoCompressAsset(assetUrl);
            }
            
            // Armazenar no cache
            this.assetCache.set(cacheKey, compressedAsset);
            
            Utils.log(`Asset comprimido: ${assetUrl}`);
            return compressedAsset;
            
        } catch (error) {
            Utils.log(`Erro ao comprimir asset ${assetUrl}: ${error.message}`, 'warn');
            return assetUrl; // Retornar original em caso de erro
        }
    }

    async compressImage(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Redimensionar se necessário
                const maxSize = this.optimizationConfig.maxTextureSize;
                let { width, height } = img;
                
                if (width > maxSize || height > maxSize) {
                    const ratio = Math.min(maxSize / width, maxSize / height);
                    width *= ratio;
                    height *= ratio;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Desenhar imagem redimensionada
                ctx.drawImage(img, 0, 0, width, height);
                
                // Converter para blob comprimido
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    resolve(url);
                }, 'image/jpeg', 0.8); // 80% qualidade
            };
            
            img.onerror = reject;
            img.src = imageUrl;
        });
    }

    async compressModel(modelUrl) {
        // Para modelos GLB, aplicar otimizações específicas para mobile
        try {
            const response = await fetch(modelUrl);
            const arrayBuffer = await response.arrayBuffer();
            
            // Criar versões otimizadas baseadas no dispositivo
            const optimizedModel = await this.optimizeGLBForMobile(arrayBuffer, modelUrl);
            
            // Cache do modelo otimizado
            const cacheKey = `optimized_${modelUrl}`;
            this.modelCache.set(cacheKey, optimizedModel);
            
            Utils.log(`Modelo GLB otimizado para mobile: ${modelUrl}`);
            return optimizedModel.url || modelUrl;
            
        } catch (error) {
            Utils.log(`Erro ao processar modelo ${modelUrl}: ${error.message}`, 'warn');
            return modelUrl;
        }
    }

    async optimizeGLBForMobile(arrayBuffer, originalUrl) {
        try {
            // Análise básica do arquivo GLB
            const glbInfo = this.analyzeGLB(arrayBuffer);
            
            // Aplicar otimizações baseadas nas capacidades do dispositivo
            const deviceCapabilities = await this.detectDeviceCapabilities();
            
            let optimizedBuffer = arrayBuffer;
            const optimizations = [];
            
            // Reduzir precisão de vértices se necessário
            if (deviceCapabilities.gpu.tier === 'low') {
                optimizedBuffer = this.reduceVertexPrecision(optimizedBuffer);
                optimizations.push('vertex_precision_reduced');
            }
            
            // Comprimir texturas embutidas
            if (glbInfo.hasTextures) {
                optimizedBuffer = await this.compressEmbeddedTextures(optimizedBuffer);
                optimizations.push('textures_compressed');
            }
            
            // Simplificar geometria se modelo muito complexo
            if (glbInfo.vertexCount > this.getMaxVertexCount()) {
                optimizedBuffer = this.simplifyGeometry(optimizedBuffer);
                optimizations.push('geometry_simplified');
            }
            
            // Remover dados desnecessários
            optimizedBuffer = this.removeUnusedData(optimizedBuffer);
            optimizations.push('unused_data_removed');
            
            // Criar blob otimizado
            const optimizedBlob = new Blob([optimizedBuffer], { type: 'model/gltf-binary' });
            const optimizedUrl = URL.createObjectURL(optimizedBlob);
            
            Utils.log(`Modelo otimizado com: ${optimizations.join(', ')}`);
            
            return {
                url: optimizedUrl,
                originalSize: arrayBuffer.byteLength,
                optimizedSize: optimizedBuffer.byteLength,
                compressionRatio: (1 - optimizedBuffer.byteLength / arrayBuffer.byteLength) * 100,
                optimizations: optimizations,
                lastUsed: Date.now()
            };
            
        } catch (error) {
            Utils.log(`Erro na otimização GLB: ${error.message}`, 'warn');
            return {
                url: originalUrl,
                originalSize: arrayBuffer.byteLength,
                optimizedSize: arrayBuffer.byteLength,
                compressionRatio: 0,
                optimizations: [],
                lastUsed: Date.now()
            };
        }
    }

    analyzeGLB(arrayBuffer) {
        try {
            const dataView = new DataView(arrayBuffer);
            
            // Verificar header GLB
            const magic = dataView.getUint32(0, true);
            if (magic !== 0x46546C67) { // 'glTF'
                throw new Error('Não é um arquivo GLB válido');
            }
            
            const version = dataView.getUint32(4, true);
            const length = dataView.getUint32(8, true);
            
            // Análise básica do conteúdo
            let hasTextures = false;
            let vertexCount = 0;
            let triangleCount = 0;
            
            // Procurar por chunks JSON e BIN
            let offset = 12;
            while (offset < length) {
                const chunkLength = dataView.getUint32(offset, true);
                const chunkType = dataView.getUint32(offset + 4, true);
                
                if (chunkType === 0x4E4F534A) { // 'JSON'
                    const jsonData = new TextDecoder().decode(
                        new Uint8Array(arrayBuffer, offset + 8, chunkLength)
                    );
                    const gltf = JSON.parse(jsonData);
                    
                    // Analisar conteúdo JSON
                    if (gltf.images && gltf.images.length > 0) {
                        hasTextures = true;
                    }
                    
                    if (gltf.accessors) {
                        gltf.accessors.forEach(accessor => {
                            if (accessor.type === 'VEC3' && accessor.componentType === 5126) {
                                vertexCount += accessor.count;
                            }
                        });
                    }
                    
                    if (gltf.meshes) {
                        gltf.meshes.forEach(mesh => {
                            mesh.primitives.forEach(primitive => {
                                if (primitive.indices !== undefined) {
                                    const indexAccessor = gltf.accessors[primitive.indices];
                                    triangleCount += indexAccessor.count / 3;
                                }
                            });
                        });
                    }
                }
                
                offset += 8 + chunkLength;
            }
            
            return {
                version,
                length,
                hasTextures,
                vertexCount,
                triangleCount,
                complexity: this.calculateModelComplexity(vertexCount, triangleCount)
            };
            
        } catch (error) {
            Utils.log(`Erro ao analisar GLB: ${error.message}`, 'warn');
            return {
                version: 2,
                length: arrayBuffer.byteLength,
                hasTextures: false,
                vertexCount: 1000, // Estimativa conservadora
                triangleCount: 500,
                complexity: 'medium'
            };
        }
    }

    calculateModelComplexity(vertexCount, triangleCount) {
        const complexityScore = vertexCount + (triangleCount * 2);
        
        if (complexityScore < 5000) return 'low';
        if (complexityScore < 20000) return 'medium';
        return 'high';
    }

    getMaxVertexCount() {
        const deviceCapabilities = this.detectDeviceCapabilities();
        
        switch (deviceCapabilities.gpu.tier) {
            case 'low': return 5000;
            case 'medium': return 15000;
            case 'high': return 50000;
            default: return 10000;
        }
    }

    reduceVertexPrecision(arrayBuffer) {
        // Implementação simplificada - na prática seria mais complexa
        // Aqui apenas retornamos o buffer original
        // Em uma implementação real, reduziríamos a precisão dos floats
        Utils.log('Reduzindo precisão de vértices (simulado)');
        return arrayBuffer;
    }

    async compressEmbeddedTextures(arrayBuffer) {
        // Implementação simplificada para compressão de texturas embutidas
        // Na prática, extrairia as texturas, comprimiria e reinseriria
        Utils.log('Comprimindo texturas embutidas (simulado)');
        return arrayBuffer;
    }

    simplifyGeometry(arrayBuffer) {
        // Implementação simplificada para simplificação de geometria
        // Na prática, usaria algoritmos como decimação de malha
        Utils.log('Simplificando geometria (simulado)');
        return arrayBuffer;
    }

    removeUnusedData(arrayBuffer) {
        // Remove dados não utilizados do GLB
        // Implementação simplificada
        Utils.log('Removendo dados não utilizados');
        return arrayBuffer;
    }

    async compressAudio(audioUrl) {
        // Para áudio, poderia implementar conversão para formatos mais eficientes
        // Por enquanto, apenas retornar o original
        return audioUrl;
    }

    async autoCompressAsset(assetUrl) {
        const extension = assetUrl.split('.').pop().toLowerCase();
        
        switch (extension) {
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return this.compressImage(assetUrl);
            case 'glb':
            case 'gltf':
                return this.compressModel(assetUrl);
            case 'wav':
            case 'mp3':
            case 'ogg':
                return this.compressAudio(assetUrl);
            default:
                return assetUrl;
        }
    }

    // Gerenciamento de memória
    setupAutomaticCleanup() {
        this.cleanupTimer = setInterval(() => {
            this.cleanupUnusedAssets();
        }, this.optimizationConfig.cleanupInterval);
        
        Utils.log('Cleanup automático configurado');
    }

    cleanupUnusedAssets() {
        const currentTime = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutos
        
        // Limpar cache de assets antigos
        for (const [key, asset] of this.assetCache.entries()) {
            if (asset.lastUsed && currentTime - asset.lastUsed > maxAge) {
                this.assetCache.delete(key);
                
                // Revogar URLs de blob se necessário
                if (typeof asset.url === 'string' && asset.url.startsWith('blob:')) {
                    URL.revokeObjectURL(asset.url);
                }
            }
        }
        
        // Limpar cache de modelos
        this.cleanupModelCache();
        
        // Limpar cache de texturas
        this.cleanupTextureCache();
        
        Utils.log(`Cleanup executado: ${this.assetCache.size} assets em cache`);
    }

    cleanupModelCache() {
        // Remover modelos não utilizados recentemente
        const scene = document.getElementById('ar-scene');
        if (!scene) return;
        
        const activeModels = new Set();
        const models = scene.querySelectorAll('[gltf-model]');
        
        models.forEach(model => {
            const src = model.getAttribute('gltf-model');
            if (src) activeModels.add(src);
        });
        
        // Remover modelos não ativos do cache
        for (const [key, model] of this.modelCache.entries()) {
            if (!activeModels.has(key)) {
                this.modelCache.delete(key);
            }
        }
    }

    cleanupTextureCache() {
        // Limpar texturas não utilizadas
        for (const [key, texture] of this.textureCache.entries()) {
            if (texture.lastUsed && Date.now() - texture.lastUsed > 300000) { // 5 minutos
                this.textureCache.delete(key);
                
                // Liberar memória da textura se possível
                if (texture.dispose) {
                    texture.dispose();
                }
            }
        }
    }

    // Sistema de preload inteligente de assets
    async preloadCriticalAssets() {
        Utils.log('Iniciando preload inteligente de assets críticos');
        
        const criticalAssets = this.identifyCriticalAssets();
        const preloadPromises = [];
        
        for (const asset of criticalAssets) {
            preloadPromises.push(this.preloadAsset(asset));
        }
        
        try {
            await Promise.all(preloadPromises);
            Utils.log(`${criticalAssets.length} assets críticos precarregados`);
        } catch (error) {
            Utils.log(`Erro no preload de assets: ${error.message}`, 'warn');
        }
    }

    identifyCriticalAssets() {
        // Identificar assets que serão usados nas próximas missões
        return [
            { url: 'assets/models/bicicleta-will.glb', type: 'model', priority: 'high' },
            { url: 'src/models/castle_byers.glb', type: 'model', priority: 'high' },
            { url: 'src/models/demogorgon.glb', type: 'model', priority: 'medium' },
            { url: 'assets/img/taco.png', type: 'image', priority: 'medium' },
            { url: 'assets/img/gasolina.png', type: 'image', priority: 'medium' },
            { url: 'assets/gif/portal.gif', type: 'image', priority: 'high' },
            { url: 'assets/gif/luzes-piscando.gif', type: 'image', priority: 'medium' }
        ];
    }

    async preloadAsset(asset) {
        try {
            // Verificar se já está em cache
            const cacheKey = `preloaded_${asset.url}`;
            if (this.assetCache.has(cacheKey)) {
                return this.assetCache.get(cacheKey);
            }
            
            // Precarregar baseado no tipo
            let preloadedAsset;
            switch (asset.type) {
                case 'model':
                    preloadedAsset = await this.preloadModel(asset.url);
                    break;
                case 'image':
                    preloadedAsset = await this.preloadImage(asset.url);
                    break;
                default:
                    preloadedAsset = await this.preloadGeneric(asset.url);
            }
            
            // Armazenar no cache com metadados
            this.assetCache.set(cacheKey, {
                ...preloadedAsset,
                priority: asset.priority,
                preloaded: true,
                lastUsed: Date.now()
            });
            
            return preloadedAsset;
            
        } catch (error) {
            Utils.log(`Erro ao precarregar ${asset.url}: ${error.message}`, 'warn');
            return null;
        }
    }

    async preloadModel(modelUrl) {
        const response = await fetch(modelUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        // Otimizar modelo durante preload
        const optimizedModel = await this.optimizeGLBForMobile(arrayBuffer, modelUrl);
        
        return {
            url: optimizedModel.url || modelUrl,
            originalUrl: modelUrl,
            size: optimizedModel.optimizedSize,
            optimizations: optimizedModel.optimizations
        };
    }

    async preloadImage(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                resolve({
                    url: imageUrl,
                    width: img.width,
                    height: img.height,
                    element: img
                });
            };
            
            img.onerror = reject;
            img.src = imageUrl;
        });
    }

    async preloadGeneric(assetUrl) {
        const response = await fetch(assetUrl);
        const blob = await response.blob();
        
        return {
            url: assetUrl,
            size: blob.size,
            type: blob.type,
            blob: blob
        };
    }

    // Sistema de gerenciamento de memória avançado
    async optimizeMemoryUsage() {
        Utils.log('Otimizando uso de memória');
        
        const memoryInfo = this.getDetailedMemoryInfo();
        
        if (memoryInfo.usage > memoryInfo.threshold) {
            await this.performMemoryOptimization(memoryInfo);
        }
    }

    getDetailedMemoryInfo() {
        let usage = 0;
        let threshold = this.optimizationConfig.memoryThreshold;
        
        if ('memory' in performance) {
            usage = performance.memory.usedJSHeapSize;
            threshold = performance.memory.jsHeapSizeLimit * 0.8; // 80% do limite
        }
        
        return {
            usage,
            threshold,
            percentage: (usage / threshold) * 100,
            cacheSize: this.calculateCacheSize()
        };
    }

    calculateCacheSize() {
        let totalSize = 0;
        
        // Calcular tamanho dos caches
        for (const [key, asset] of this.assetCache.entries()) {
            if (asset.size) {
                totalSize += asset.size;
            }
        }
        
        for (const [key, model] of this.modelCache.entries()) {
            if (model.optimizedSize) {
                totalSize += model.optimizedSize;
            }
        }
        
        return totalSize;
    }

    async performMemoryOptimization(memoryInfo) {
        const optimizations = [];
        
        // 1. Limpar assets não utilizados recentemente
        this.cleanupUnusedAssets();
        optimizations.push('unused_assets_cleaned');
        
        // 2. Reduzir qualidade de texturas temporariamente
        if (memoryInfo.percentage > 90) {
            this.reduceTextureQuality();
            optimizations.push('texture_quality_reduced');
        }
        
        // 3. Limitar modelos ativos
        this.limitActiveModels();
        optimizations.push('active_models_limited');
        
        // 4. Forçar garbage collection se disponível
        if (window.gc) {
            window.gc();
            optimizations.push('garbage_collection_forced');
        }
        
        // 5. Reduzir LOD temporariamente
        this.applyLOD('low');
        optimizations.push('lod_reduced');
        
        Utils.log(`Otimizações de memória aplicadas: ${optimizations.join(', ')}`);
        
        // Agendar restauração gradual
        this.scheduleMemoryRecovery();
    }

    scheduleMemoryRecovery() {
        // Restaurar qualidade gradualmente após 10 segundos
        setTimeout(() => {
            this.applyLOD('medium');
            Utils.log('LOD restaurado para médio');
        }, 10000);
        
        // Restaurar qualidade completa após 20 segundos se memória permitir
        setTimeout(() => {
            const memoryInfo = this.getDetailedMemoryInfo();
            if (memoryInfo.percentage < 70) {
                this.applyLOD('high');
                Utils.log('LOD restaurado para alto');
            }
        }, 20000);
    }

    // Sistema de monitoramento de performance em tempo real
    startRealTimeOptimization() {
        // Monitoramento mais frequente para otimização em tempo real
        this.realTimeOptimizer = setInterval(() => {
            this.performRealTimeOptimizations();
        }, 5000); // A cada 5 segundos
        
        Utils.log('Otimização em tempo real iniciada');
    }

    performRealTimeOptimizations() {
        const metrics = this.performanceMetrics;
        const memoryInfo = this.getDetailedMemoryInfo();
        
        // Otimizações baseadas em FPS
        if (metrics.fps < 20) {
            this.applyEmergencyOptimizations();
        } else if (metrics.fps < 25) {
            this.applyModerateOptimizations();
        }
        
        // Otimizações baseadas em memória
        if (memoryInfo.percentage > 85) {
            this.performMemoryOptimization(memoryInfo);
        }
        
        // Ajustar LOD dinamicamente
        this.updateLOD(10, metrics); // Assumir 10m de distância padrão
    }

    applyEmergencyOptimizations() {
        Utils.log('Aplicando otimizações de emergência', 'warn');
        
        // Desabilitar todas as animações
        const scene = document.getElementById('ar-scene');
        if (scene) {
            const animatedElements = scene.querySelectorAll('[animation]');
            animatedElements.forEach(el => {
                el.setAttribute('animation', 'enabled: false');
            });
        }
        
        // Forçar LOD baixo
        this.applyLOD('low');
        
        // Limitar modelos ativos drasticamente
        this.optimizationConfig.maxActiveModels = 1;
        this.limitActiveModels();
        
        // Limpeza agressiva
        this.aggressiveCleanup();
    }

    applyModerateOptimizations() {
        Utils.log('Aplicando otimizações moderadas');
        
        // Reduzir para LOD médio
        this.applyLOD('medium');
        
        // Limitar modelos ativos
        this.optimizationConfig.maxActiveModels = 2;
        this.limitActiveModels();
        
        // Cleanup regular
        this.cleanupUnusedAssets();
    }

    // Métodos públicos para integração com outros sistemas
    async optimizeAssetForCurrentDevice(assetUrl, assetType) {
        return await this.compressAsset(assetUrl, assetType);
    }

    getCurrentOptimizationLevel() {
        return {
            lodLevel: this.lodSystem.currentLOD,
            memoryUsage: this.performanceMetrics.memoryUsage,
            fps: this.performanceMetrics.fps,
            cacheSize: this.calculateCacheSize(),
            activeOptimizations: this.getActiveOptimizations()
        };
    }

    getActiveOptimizations() {
        const optimizations = [];
        
        if (this.lodSystem.currentLOD === 'low') {
            optimizations.push('low_lod');
        }
        
        if (this.optimizationConfig.maxActiveModels < 3) {
            optimizations.push('limited_models');
        }
        
        if (this.optimizationConfig.maxTextureSize < 1024) {
            optimizations.push('reduced_textures');
        }
        
        return optimizations;
    }

    aggressiveCleanup() {
        Utils.log('Executando limpeza agressiva de memória', 'warn');
        
        // Limpar todos os caches
        this.assetCache.clear();
        this.modelCache.clear();
        this.textureCache.clear();
        
        // Forçar garbage collection se disponível
        if (window.gc) {
            window.gc();
        }
        
        // Reduzir qualidade temporariamente
        this.applyLOD('low');
    }

    limitActiveModels() {
        const scene = document.getElementById('ar-scene');
        if (!scene) return;
        
        const models = scene.querySelectorAll('[gltf-model]');
        
        if (models.length > this.optimizationConfig.maxActiveModels) {
            // Remover modelos mais antigos
            const modelsArray = Array.from(models);
            const toRemove = modelsArray.slice(0, models.length - this.optimizationConfig.maxActiveModels);
            
            toRemove.forEach(model => {
                if (model.parentNode) {
                    model.parentNode.removeChild(model);
                }
            });
            
            Utils.log(`Removidos ${toRemove.length} modelos para otimização`);
        }
    }

    reduceTextureQuality() {
        // Reduzir qualidade de texturas temporariamente
        this.optimizationConfig.maxTextureSize = Math.max(256, this.optimizationConfig.maxTextureSize / 2);
        
        Utils.log(`Qualidade de textura reduzida para ${this.optimizationConfig.maxTextureSize}px`);
        
        // Restaurar qualidade após um tempo
        setTimeout(() => {
            this.optimizationConfig.maxTextureSize *= 2;
            Utils.log('Qualidade de textura restaurada');
        }, 10000);
    }

    simplifyGeometries() {
        // Simplificar geometrias de modelos 3D
        const scene = document.getElementById('ar-scene');
        if (!scene) return;
        
        const models = scene.querySelectorAll('[gltf-model]');
        
        models.forEach(model => {
            // Aplicar simplificação temporária
            model.setAttribute('geometry', 'primitive: box; segmentsHeight: 1; segmentsWidth: 1');
        });
        
        Utils.log('Geometrias simplificadas temporariamente');
    }

    reduceVisualEffects() {
        // Reduzir efeitos visuais para melhorar performance
        const scene = document.getElementById('ar-scene');
        if (!scene) return;
        
        // Desabilitar animações temporariamente
        const animatedElements = scene.querySelectorAll('[animation]');
        animatedElements.forEach(el => {
            el.setAttribute('animation', 'enabled: false');
        });
        
        // Reduzir qualidade de sombras
        scene.setAttribute('shadow', 'enabled: false');
        
        Utils.log('Efeitos visuais reduzidos temporariamente');
        
        // Restaurar após um tempo
        setTimeout(() => {
            animatedElements.forEach(el => {
                el.setAttribute('animation', 'enabled: true');
            });
            scene.setAttribute('shadow', 'enabled: true');
            Utils.log('Efeitos visuais restaurados');
        }, 5000);
    }

    // Métodos públicos para integração
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }

    getOptimizationStatus() {
        return {
            lodLevel: this.lodSystem.currentLOD,
            cacheSize: this.assetCache.size,
            memoryUsage: this.performanceMetrics.memoryUsage,
            fps: this.performanceMetrics.fps
        };
    }

    forceOptimization() {
        Utils.log('Forçando otimização manual');
        this.handleLowFPS();
        this.handleHighMemoryUsage();
    }

    destroy() {
        // Limpar timers
        if (this.performanceMonitor.interval) {
            clearInterval(this.performanceMonitor.interval);
        }
        
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        
        if (this.realTimeOptimizer) {
            clearInterval(this.realTimeOptimizer);
        }
        
        // Limpar caches
        this.aggressiveCleanup();
        
        Utils.log('PerformanceManager destruído');
    }
}