// Aplicação principal
class StrangerThingsApp {
    constructor() {
        this.game = null;
        this.serviceWorkerRegistered = false;
        this.assetsLoaded = false;
    }

    async init() {
        console.log('Stranger Things AR: Inicializando aplicação...');
        
        try {
            // Registrar Service Worker
            await this.registerServiceWorker();
            
            // Inicializar interface
            this.setupEventListeners();
            
            // Mostrar tela de carregamento
            this.showScreen('loading-screen');
            
            // Carregar assets essenciais
            await this.loadEssentialAssets();
            
            // Mostrar menu principal
            this.showScreen('main-menu');
            
            console.log('Aplicação inicializada com sucesso');
            
        } catch (error) {
            console.error('Erro ao inicializar aplicação:', error);
            this.showError('Erro ao inicializar o jogo. Verifique sua conexão e tente novamente.');
        }
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registrado:', registration);
                this.serviceWorkerRegistered = true;
                
                // Aguardar ativação
                if (registration.installing) {
                    await new Promise((resolve) => {
                        registration.installing.addEventListener('statechange', (e) => {
                            if (e.target.state === 'activated') {
                                resolve();
                            }
                        });
                    });
                }
                
            } catch (error) {
                console.warn('Falha ao registrar Service Worker:', error);
            }
        }
    }

    async loadEssentialAssets() {
        const loadingProgress = document.getElementById('loading-progress');
        const loadingText = document.getElementById('loading-text');
        
        // Simular carregamento de assets essenciais
        const essentialAssets = [
            'css/style.css',
            'fonts/stranger-things.ttf',
            'js/game.js',
            'js/utils.js'
        ];
        
        for (let i = 0; i < essentialAssets.length; i++) {
            loadingText.textContent = `Carregando ${essentialAssets[i]}...`;
            loadingProgress.style.width = `${((i + 1) / essentialAssets.length) * 100}%`;
            
            // Simular tempo de carregamento
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        loadingText.textContent = 'Assets essenciais carregados!';
        this.assetsLoaded = true;
    }

    setupEventListeners() {
        // Botão iniciar jogo
        const startButton = document.getElementById('start-game');
        startButton.addEventListener('click', () => this.startGame());
        
        // Botão tentar novamente
        const retryButton = document.getElementById('retry-button');
        retryButton.addEventListener('click', () => this.init());
        
        // Prevenir zoom
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        });
        
        // Prevenir scroll
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    async startGame() {
        try {
            this.showScreen('loading-screen');
            const loadingText = document.getElementById('loading-text');
            const loadingProgress = document.getElementById('loading-progress');
            
            loadingText.textContent = 'Carregando assets do jogo...';
            loadingProgress.style.width = '0%';
            
            // Carregar todos os assets de mídia
            await this.loadGameAssets();
            
            // Inicializar jogo
            this.game = new StrangerThingsGame();
            await this.game.init();
            
            // Mostrar tela do jogo
            this.showScreen('game-screen');
            
            // Iniciar primeira sequência
            this.game.startIntroSequence();
            
        } catch (error) {
            console.error('Erro ao iniciar jogo:', error);
            this.showError('Erro ao iniciar o jogo. Verifique as permissões do dispositivo.');
        }
    }

    async loadGameAssets() {
        const loadingProgress = document.getElementById('loading-progress');
        const loadingText = document.getElementById('loading-text');
        
        // Carregar assets via Service Worker se disponível
        if (this.serviceWorkerRegistered) {
            try {
                await this.loadAssetsViaServiceWorker();
            } catch (error) {
                console.warn('Falha no carregamento via Service Worker, tentando método alternativo');
            }
        }
        
        // Carregar áudios essenciais diretamente
        loadingText.textContent = 'Carregando áudios...';
        
        if (this.game && this.game.audioManager) {
            // Configurar listener de progresso de áudio
            this.game.audioManager.on('audioLoadProgress', (progress) => {
                const totalProgress = 50 + (progress.progress * 50); // 50% para outros assets, 50% para áudios
                loadingProgress.style.width = `${totalProgress}%`;
                loadingText.textContent = `Carregando áudios... ${progress.loaded}/${progress.total}`;
            });
            
            this.game.audioManager.on('audioLoadComplete', (result) => {
                loadingProgress.style.width = '100%';
                loadingText.textContent = 'Todos os assets carregados!';
            });
            
            // Pré-carregar áudios essenciais
            await this.game.audioManager.preloadEssentialAudios();
        }
    }

    async loadAssetsViaServiceWorker() {
        return new Promise((resolve, reject) => {
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event) => {
                const data = event.data;
                
                if (data.type === 'CACHE_PROGRESS') {
                    const progress = data.progress * 50; // 50% para Service Worker assets
                    document.getElementById('loading-progress').style.width = `${progress}%`;
                    document.getElementById('loading-text').textContent = 
                        `Carregando assets... ${data.cached}/${data.total}`;
                }
                
                if (data.type === 'CACHE_COMPLETE') {
                    if (data.success) {
                        resolve();
                    } else {
                        reject(new Error('Falha ao carregar assets'));
                    }
                }
            };
            
            navigator.serviceWorker.controller.postMessage({
                type: 'CACHE_ASSETS_WITH_PROGRESS'
            }, [messageChannel.port2]);
        });
    }

    showScreen(screenId) {
        // Ocultar todas as telas
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));
        
        // Mostrar tela específica
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }

    showError(message) {
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = message;
        this.showScreen('error-screen');
    }
}

// Inicializar aplicação quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const app = new StrangerThingsApp();
    app.init();
});

// Tratar erros globais
window.addEventListener('error', (event) => {
    console.error('Erro global:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rejeitada:', event.reason);
});