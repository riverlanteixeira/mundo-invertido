// Aplicação principal
class StrangerThingsApp {
    constructor() {
        this.game = null;
        this.serviceWorkerRegistered = false;
        this.assetsLoaded = false;
        this.errorHandler = null;
    }

    async init() {
        console.log('Stranger Things AR: Inicializando aplicação...');
        
        try {
            // Inicializar sistema de tratamento de erros primeiro
            this.errorHandler = new ErrorHandler();
            
            // Configurar tratamento de erros da aplicação
            this.setupAppErrorHandling();
            
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
            
            // Usar error handler se disponível
            if (this.errorHandler) {
                this.errorHandler.handleGlobalError({
                    type: 'app_initialization',
                    message: error.message,
                    timestamp: Date.now()
                });
            }
            
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

    setupAppErrorHandling() {
        if (!this.errorHandler) return;
        
        // Configurar callbacks para erros da aplicação
        this.errorHandler.onError('critical', (errorInfo) => {
            console.error('Erro crítico na aplicação:', errorInfo);
            this.handleCriticalAppError(errorInfo);
        });
        
        this.errorHandler.onError('degraded_mode', (data) => {
            console.warn('Modo degradado ativado na aplicação:', data);
            this.handleAppDegradedMode(data);
        });
        
        // Integrar com erros globais existentes
        window.removeEventListener('error', this.originalErrorHandler);
        window.removeEventListener('unhandledrejection', this.originalRejectionHandler);
        
        // Novos handlers que usam o error handler
        window.addEventListener('error', (event) => {
            console.error('Erro global:', event.error);
            
            if (this.errorHandler) {
                this.errorHandler.handleGlobalError({
                    type: 'javascript',
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error,
                    timestamp: Date.now()
                });
            }
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promise rejeitada:', event.reason);
            
            if (this.errorHandler) {
                this.errorHandler.handleGlobalError({
                    type: 'promise',
                    message: event.reason?.message || 'Promise rejeitada',
                    reason: event.reason,
                    timestamp: Date.now()
                });
            }
        });
        
        console.log('Sistema de tratamento de erros da aplicação configurado');
    }

    handleCriticalAppError(errorInfo) {
        // Parar o jogo se estiver rodando
        if (this.game) {
            try {
                if (this.game.arManager) {
                    this.game.arManager.stopCamera();
                }
                if (this.game.locationManager) {
                    this.game.locationManager.stopTracking();
                }
                if (this.game.audioManager) {
                    this.game.audioManager.stopAll();
                }
            } catch (error) {
                console.error('Erro ao parar sistemas do jogo:', error);
            }
        }
        
        // Mostrar interface de erro crítico
        this.showCriticalErrorInterface(errorInfo);
    }

    handleAppDegradedMode(data) {
        console.log('Aplicação entrando em modo degradado:', data.reason);
        
        // Aplicar configurações de modo degradado à aplicação
        document.body.classList.add('app-degraded-mode');
        
        // Simplificar interface se necessário
        this.simplifyAppInterface();
        
        // Mostrar notificação ao usuário
        this.showDegradedModeNotification(data);
    }

    showCriticalErrorInterface(errorInfo) {
        const errorScreen = document.createElement('div');
        errorScreen.id = 'app-critical-error-screen';
        errorScreen.className = 'critical-error-screen';
        errorScreen.innerHTML = `
            <div class="critical-error-content">
                <h2>⚠️ Erro Crítico da Aplicação</h2>
                <p>A aplicação encontrou um erro crítico e precisa ser reiniciada.</p>
                <div class="error-details">
                    <strong>Tipo:</strong> ${errorInfo.type}<br>
                    <strong>Erro:</strong> ${errorInfo.message}<br>
                    <strong>Horário:</strong> ${new Date(errorInfo.timestamp).toLocaleString()}
                </div>
                <div class="error-actions">
                    <button class="error-button primary" onclick="location.reload()">
                        Reiniciar Aplicação
                    </button>
                    <button class="error-button" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Continuar (Não Recomendado)
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorScreen);
    }

    simplifyAppInterface() {
        // Desabilitar animações complexas
        const style = document.createElement('style');
        style.id = 'app-degraded-styles';
        style.textContent = `
            .app-degraded-mode * {
                animation-duration: 0.1s !important;
                transition-duration: 0.1s !important;
            }
            
            .app-degraded-mode .complex-animation {
                display: none !important;
            }
            
            .app-degraded-mode .loading-fill {
                animation: none !important;
            }
            
            .app-degraded-mode .stranger-title {
                animation: none !important;
                text-shadow: 0 0 10px #ff6b6b !important;
            }
        `;
        document.head.appendChild(style);
    }

    showDegradedModeNotification(data) {
        const notification = document.createElement('div');
        notification.className = 'app-degraded-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h4>⚠️ Modo Limitado</h4>
                <p>A aplicação está funcionando com limitações devido a: ${data.reason}</p>
                <p>Algumas funcionalidades podem estar indisponíveis.</p>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    Entendi
                </button>
            </div>
        `;
        
        // Adicionar estilos se não existirem
        if (!document.getElementById('app-degraded-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'app-degraded-notification-styles';
            style.textContent = `
                .app-degraded-notification {
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    right: 20px;
                    background: rgba(255, 193, 7, 0.95);
                    color: #000;
                    border-radius: 10px;
                    padding: 0;
                    z-index: 10002;
                    animation: slideDown 0.3s ease;
                }
                
                .app-degraded-notification .notification-content {
                    padding: 1rem;
                    text-align: center;
                }
                
                .app-degraded-notification h4 {
                    margin: 0 0 0.5rem 0;
                    font-size: 1.1rem;
                }
                
                .app-degraded-notification p {
                    margin: 0.3rem 0;
                    font-size: 0.9rem;
                    line-height: 1.4;
                }
                
                .app-degraded-notification .notification-close {
                    background: #000;
                    color: #fff;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    margin-top: 0.5rem;
                }
                
                @keyframes slideDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto-remover após 8 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideDown 0.3s ease reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 8000);
    }

    // Método para obter estatísticas de erro da aplicação
    getAppErrorStats() {
        if (!this.errorHandler) return null;
        
        return {
            ...this.errorHandler.getErrorStats(),
            appInfo: {
                serviceWorkerRegistered: this.serviceWorkerRegistered,
                assetsLoaded: this.assetsLoaded,
                gameInitialized: !!this.game,
                currentScreen: this.getCurrentScreen()
            }
        };
    }

    getCurrentScreen() {
        const activeScreen = document.querySelector('.screen.active');
        return activeScreen ? activeScreen.id : 'unknown';
    }

    // Método para limpar recursos da aplicação
    cleanup() {
        if (this.game) {
            try {
                this.game.cleanup?.();
            } catch (error) {
                console.error('Erro ao limpar recursos do jogo:', error);
            }
        }
        
        if (this.errorHandler) {
            this.errorHandler.cleanup();
        }
        
        // Remover event listeners
        const startButton = document.getElementById('start-game');
        if (startButton) {
            startButton.removeEventListener('click', () => this.startGame());
        }
        
        const retryButton = document.getElementById('retry-button');
        if (retryButton) {
            retryButton.removeEventListener('click', () => this.init());
        }
        
        console.log('Recursos da aplicação limpos');
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