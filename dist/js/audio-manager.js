// Gerenciador de áudio com Web Audio API
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.audioCache = new Map();
        this.activeAudios = new Map();
        this.masterVolume = 1.0;
        this.soundEnabled = true;
        
        // Configurações de áudio
        this.audioConfig = {
            call: { volume: 0.8, loop: false },
            effects: { volume: 0.6, loop: false },
            ambient: { volume: 0.4, loop: true },
            music: { volume: 0.5, loop: true }
        };
        
        // Event listeners
        this.eventListeners = new Map();
        
        // Estado de carregamento
        this.loadingPromises = new Map();
        this.totalAudios = 0;
        this.loadedAudios = 0;
    }

    async init() {
        Utils.log('Inicializando AudioManager...');
        
        try {
            // Criar contexto de áudio
            await this.createAudioContext();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Pré-carregar áudios essenciais
            await this.preloadEssentialAudios();
            
            Utils.log('AudioManager inicializado com sucesso');
            
        } catch (error) {
            Utils.log(`Erro ao inicializar AudioManager: ${error.message}`, 'error');
            throw error;
        }
    }

    async createAudioContext() {
        try {
            // Criar contexto de áudio
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Verificar se o contexto foi criado
            if (!this.audioContext) {
                throw new Error('Não foi possível criar contexto de áudio');
            }
            
            // Aguardar contexto estar pronto
            if (this.audioContext.state === 'suspended') {
                Utils.log('Contexto de áudio suspenso, aguardando interação do usuário');
            }
            
            Utils.log(`Contexto de áudio criado: ${this.audioContext.state}`);
            
        } catch (error) {
            Utils.log(`Erro ao criar contexto de áudio: ${error.message}`, 'error');
            // Fallback para HTML5 Audio se Web Audio API falhar
            this.audioContext = null;
        }
    }

    setupEventListeners() {
        // Listener para reativar contexto após interação do usuário
        const resumeContext = async () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                try {
                    await this.audioContext.resume();
                    Utils.log('Contexto de áudio reativado');
                } catch (error) {
                    Utils.log(`Erro ao reativar contexto: ${error.message}`, 'warn');
                }
            }
        };

        // Adicionar listeners para primeira interação
        ['touchstart', 'touchend', 'mousedown', 'keydown'].forEach(event => {
            document.addEventListener(event, resumeContext, { once: true });
        });

        // Listener para mudanças de visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAll();
            } else {
                this.resumeAll();
            }
        });
    }

    async preloadEssentialAudios() {
        const essentialAudios = [
            'sounds/call/dustin-intro.wav',
            'sounds/effects/radio-static.wav',
            'sounds/call/dustin-missao-1-completa.wav'
        ];

        Utils.log(`Pré-carregando ${essentialAudios.length} áudios essenciais...`);
        
        const loadPromises = essentialAudios.map(url => this.loadAudio(url));
        await Promise.allSettled(loadPromises);
        
        Utils.log('Áudios essenciais pré-carregados');
    }

    async loadAudio(url) {
        // Verificar se já está carregado
        if (this.audioCache.has(url)) {
            return this.audioCache.get(url);
        }

        // Verificar se já está sendo carregado
        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url);
        }

        // Criar promise de carregamento
        const loadPromise = this.loadAudioFile(url);
        this.loadingPromises.set(url, loadPromise);

        try {
            const audioData = await loadPromise;
            this.audioCache.set(url, audioData);
            this.loadingPromises.delete(url);
            this.loadedAudios++;
            
            Utils.log(`Áudio carregado: ${url}`);
            return audioData;
            
        } catch (error) {
            this.loadingPromises.delete(url);
            Utils.log(`Erro ao carregar áudio ${url}: ${error.message}`, 'error');
            throw error;
        }
    }

    async loadAudioFile(url) {
        try {
            // Fazer fetch do arquivo
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();

            // Se Web Audio API disponível, decodificar
            if (this.audioContext) {
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                return { type: 'webaudio', buffer: audioBuffer, url };
            } else {
                // Fallback para HTML5 Audio
                const audio = new Audio();
                audio.src = url;
                return { type: 'html5', audio, url };
            }

        } catch (error) {
            Utils.log(`Erro ao carregar arquivo ${url}: ${error.message}`, 'error');
            throw error;
        }
    }

    async playAudio(url, options = {}) {
        if (!this.soundEnabled) {
            Utils.log('Som desabilitado, ignorando reprodução');
            return null;
        }

        try {
            // Carregar áudio se necessário
            const audioData = await this.loadAudio(url);
            
            // Determinar configurações
            const audioType = this.getAudioType(url);
            const config = { ...this.audioConfig[audioType], ...options };
            
            // Reproduzir baseado no tipo de dados
            if (audioData.type === 'webaudio') {
                return this.playWebAudio(audioData, config);
            } else {
                return this.playHTML5Audio(audioData, config);
            }

        } catch (error) {
            Utils.log(`Erro ao reproduzir áudio ${url}: ${error.message}`, 'error');
            return null;
        }
    }

    playWebAudio(audioData, config) {
        if (!this.audioContext) return null;

        try {
            // Criar source
            const source = this.audioContext.createBufferSource();
            source.buffer = audioData.buffer;

            // Criar gain node para volume
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = config.volume * this.masterVolume;

            // Conectar nodes
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Configurar loop
            source.loop = config.loop || false;

            // Gerar ID único para o áudio
            const audioId = Utils.generateId();
            
            // Armazenar referência
            const audioInstance = {
                id: audioId,
                source,
                gainNode,
                url: audioData.url,
                config,
                startTime: this.audioContext.currentTime,
                paused: false
            };

            this.activeAudios.set(audioId, audioInstance);

            // Event listener para fim do áudio
            source.onended = () => {
                this.activeAudios.delete(audioId);
                this.emit('audioEnded', audioId);
            };

            // Iniciar reprodução
            source.start(0);
            
            Utils.log(`Reproduzindo áudio Web Audio: ${audioData.url}`);
            return audioId;

        } catch (error) {
            Utils.log(`Erro na reprodução Web Audio: ${error.message}`, 'error');
            return null;
        }
    }

    playHTML5Audio(audioData, config) {
        try {
            // Clonar elemento de áudio para permitir múltiplas reproduções
            const audio = audioData.audio.cloneNode();
            
            // Configurar propriedades
            audio.volume = config.volume * this.masterVolume;
            audio.loop = config.loop || false;

            // Gerar ID único
            const audioId = Utils.generateId();

            // Armazenar referência
            const audioInstance = {
                id: audioId,
                audio,
                url: audioData.url,
                config,
                paused: false
            };

            this.activeAudios.set(audioId, audioInstance);

            // Event listeners
            audio.addEventListener('ended', () => {
                this.activeAudios.delete(audioId);
                this.emit('audioEnded', audioId);
            });

            audio.addEventListener('error', (e) => {
                Utils.log(`Erro no áudio HTML5: ${e.message}`, 'error');
                this.activeAudios.delete(audioId);
            });

            // Iniciar reprodução
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    Utils.log(`Erro ao iniciar reprodução: ${error.message}`, 'error');
                    this.activeAudios.delete(audioId);
                });
            }

            Utils.log(`Reproduzindo áudio HTML5: ${audioData.url}`);
            return audioId;

        } catch (error) {
            Utils.log(`Erro na reprodução HTML5: ${error.message}`, 'error');
            return null;
        }
    }

    stopAudio(audioId) {
        const audioInstance = this.activeAudios.get(audioId);
        if (!audioInstance) return false;

        try {
            if (audioInstance.source) {
                // Web Audio
                audioInstance.source.stop();
            } else if (audioInstance.audio) {
                // HTML5 Audio
                audioInstance.audio.pause();
                audioInstance.audio.currentTime = 0;
            }

            this.activeAudios.delete(audioId);
            Utils.log(`Áudio parado: ${audioId}`);
            return true;

        } catch (error) {
            Utils.log(`Erro ao parar áudio: ${error.message}`, 'error');
            return false;
        }
    }

    pauseAudio(audioId) {
        const audioInstance = this.activeAudios.get(audioId);
        if (!audioInstance || audioInstance.paused) return false;

        try {
            if (audioInstance.audio) {
                audioInstance.audio.pause();
                audioInstance.paused = true;
                Utils.log(`Áudio pausado: ${audioId}`);
                return true;
            }
            // Web Audio não suporta pause nativo, precisaria reimplementar
            return false;

        } catch (error) {
            Utils.log(`Erro ao pausar áudio: ${error.message}`, 'error');
            return false;
        }
    }

    resumeAudio(audioId) {
        const audioInstance = this.activeAudios.get(audioId);
        if (!audioInstance || !audioInstance.paused) return false;

        try {
            if (audioInstance.audio) {
                const playPromise = audioInstance.audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        Utils.log(`Erro ao retomar áudio: ${error.message}`, 'error');
                    });
                }
                audioInstance.paused = false;
                Utils.log(`Áudio retomado: ${audioId}`);
                return true;
            }
            return false;

        } catch (error) {
            Utils.log(`Erro ao retomar áudio: ${error.message}`, 'error');
            return false;
        }
    }

    stopAll() {
        const audioIds = Array.from(this.activeAudios.keys());
        audioIds.forEach(id => this.stopAudio(id));
        Utils.log('Todos os áudios parados');
    }

    pauseAll() {
        this.activeAudios.forEach((instance, id) => {
            if (!instance.paused) {
                this.pauseAudio(id);
            }
        });
        Utils.log('Todos os áudios pausados');
    }

    resumeAll() {
        this.activeAudios.forEach((instance, id) => {
            if (instance.paused) {
                this.resumeAudio(id);
            }
        });
        Utils.log('Todos os áudios retomados');
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        
        // Atualizar volume de áudios ativos
        this.activeAudios.forEach(instance => {
            if (instance.gainNode) {
                instance.gainNode.gain.value = instance.config.volume * this.masterVolume;
            } else if (instance.audio) {
                instance.audio.volume = instance.config.volume * this.masterVolume;
            }
        });

        Utils.log(`Volume master definido para: ${this.masterVolume}`);
    }

    getMasterVolume() {
        return this.masterVolume;
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
        
        if (!enabled) {
            this.stopAll();
        }
        
        Utils.log(`Som ${enabled ? 'habilitado' : 'desabilitado'}`);
    }

    isSoundEnabled() {
        return this.soundEnabled;
    }

    getAudioType(url) {
        if (url.includes('/call/')) return 'call';
        if (url.includes('/effects/')) return 'effects';
        if (url.includes('/ambient/')) return 'ambient';
        if (url.includes('/music/')) return 'music';
        return 'effects'; // default
    }

    getActiveAudios() {
        return Array.from(this.activeAudios.values()).map(instance => ({
            id: instance.id,
            url: instance.url,
            paused: instance.paused,
            type: this.getAudioType(instance.url)
        }));
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

    // Carregar todos os áudios do jogo
    async preloadAllAudios() {
        const allAudios = [
            // Ligações
            'sounds/call/dustin-intro.wav',
            'sounds/call/dustin-missao-1-completa.wav',
            'sounds/call/dustin-missao-2-completa.wav',
            'sounds/call/dustin-missao-3-completa.wav',
            'sounds/call/dustin-missao-4-completa.wav',
            'sounds/call/dustin-missao-5-completa.wav',
            'sounds/call/dustin-missao-6-completa.wav',
            'sounds/call/dustin-missao-7-completa.wav',
            'sounds/call/dustin-missao-8-completa.wav',
            'sounds/call/dustin-missao-falha.wav',
            
            // Efeitos
            'sounds/effects/radio-static.wav',
            'sounds/effects/demogorgon-approach.wav',
            'sounds/effects/demogorgon-roar.wav',
            'sounds/effects/lights-flicker.wav',
            'sounds/effects/portal-open.wav',
            
            // Música
            'sounds/music/main-theme.mp3',
            'sounds/music/upside-down.mp3',
            'sounds/music/suspense.mp3',
            'sounds/music/victory.mp3',
            'sounds/music/lab-them.mp3',
            
            // Ambiente
            'sounds/ambient/forest.mp3',
            'sounds/ambient/hawkins.mp3',
            'sounds/ambient/lab.mp3',
            'sounds/ambient/upside-down.mp3'
        ];

        this.totalAudios = allAudios.length;
        this.loadedAudios = 0;

        Utils.log(`Iniciando carregamento de ${this.totalAudios} áudios...`);

        const loadPromises = allAudios.map(async (url) => {
            try {
                await this.loadAudio(url);
                this.emit('audioLoadProgress', {
                    loaded: this.loadedAudios,
                    total: this.totalAudios,
                    progress: this.loadedAudios / this.totalAudios,
                    currentFile: url
                });
            } catch (error) {
                Utils.log(`Falha ao carregar ${url}: ${error.message}`, 'warn');
            }
        });

        await Promise.allSettled(loadPromises);
        
        Utils.log(`Carregamento de áudios concluído: ${this.loadedAudios}/${this.totalAudios}`);
        this.emit('audioLoadComplete', {
            loaded: this.loadedAudios,
            total: this.totalAudios,
            success: this.loadedAudios > 0
        });
    }

    // Obter estatísticas de áudio
    getStats() {
        return {
            totalCached: this.audioCache.size,
            activeAudios: this.activeAudios.size,
            masterVolume: this.masterVolume,
            soundEnabled: this.soundEnabled,
            contextState: this.audioContext?.state || 'unavailable',
            loadedAudios: this.loadedAudios,
            totalAudios: this.totalAudios
        };
    }

    // Limpeza de recursos
    cleanup() {
        // Parar todos os áudios
        this.stopAll();
        
        // Limpar cache
        this.audioCache.clear();
        this.activeAudios.clear();
        this.loadingPromises.clear();
        
        // Limpar event listeners
        this.eventListeners.clear();
        
        // Fechar contexto de áudio
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        Utils.log('AudioManager limpo');
    }
}

// Exportar para uso global
window.AudioManager = AudioManager;