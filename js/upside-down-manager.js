// Gerenciador do sistema do mundo invertido
class UpsideDownManager {
    constructor() {
        this.isActive = false;
        this.particles = [];
        this.particleCount = 25; // Número de partículas simultâneas
        this.animationFrameId = null;
        
        // Elementos DOM
        this.elements = {
            filter: document.getElementById('upside-down-filter'),
            particlesOverlay: null,
            fog: null,
            distortion: null,
            indicator: null
        };
        
        // Configurações de partículas
        this.particleConfig = {
            types: ['spore', 'ash', 'ember'],
            spawnRate: 0.3, // Probabilidade de spawn por frame
            maxParticles: 30,
            driftRange: [-100, 100] // Variação horizontal em pixels
        };
        
        this.init();
    }

    init() {
        Utils.log('Inicializando UpsideDownManager...');
        
        try {
            this.createDOMElements();
            this.setupEventListeners();
            Utils.log('UpsideDownManager inicializado com sucesso');
        } catch (error) {
            Utils.log(`Erro ao inicializar UpsideDownManager: ${error.message}`, 'error');
        }
    }

    createDOMElements() {
        // Criar overlay de partículas se não existir
        if (!this.elements.particlesOverlay) {
            this.elements.particlesOverlay = document.createElement('div');
            this.elements.particlesOverlay.className = 'particles-overlay';
            this.elements.particlesOverlay.id = 'particles-overlay';
            
            // Adicionar ao filtro principal
            if (this.elements.filter) {
                this.elements.filter.appendChild(this.elements.particlesOverlay);
            }
        }
        
        // Criar efeito de névoa
        if (!this.elements.fog) {
            this.elements.fog = document.createElement('div');
            this.elements.fog.className = 'upside-down-fog';
            this.elements.fog.id = 'upside-down-fog';
            
            if (this.elements.filter) {
                this.elements.filter.appendChild(this.elements.fog);
            }
        }
        
        // Criar efeito de distorção
        if (!this.elements.distortion) {
            this.elements.distortion = document.createElement('div');
            this.elements.distortion.className = 'upside-down-distortion';
            this.elements.distortion.id = 'upside-down-distortion';
            
            if (this.elements.filter) {
                this.elements.filter.appendChild(this.elements.distortion);
            }
        }
        
        // Criar indicador
        if (!this.elements.indicator) {
            this.elements.indicator = document.createElement('div');
            this.elements.indicator.className = 'upside-down-indicator';
            this.elements.indicator.id = 'upside-down-indicator';
            this.elements.indicator.textContent = 'MUNDO INVERTIDO';
            
            document.body.appendChild(this.elements.indicator);
        }
        
        Utils.log('Elementos DOM do mundo invertido criados');
    }

    setupEventListeners() {
        // Listener para mudanças de visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isActive) {
                this.pauseParticles();
            } else if (!document.hidden && this.isActive) {
                this.resumeParticles();
            }
        });
        
        // Listener para mudanças de orientação
        window.addEventListener('orientationchange', () => {
            if (this.isActive) {
                setTimeout(() => {
                    this.adjustForOrientation();
                }, 500);
            }
        });
    }

    // Ativar o modo mundo invertido
    activate() {
        if (this.isActive) {
            Utils.log('Mundo invertido já está ativo');
            return;
        }
        
        Utils.log('Ativando modo mundo invertido...');
        
        try {
            this.isActive = true;
            
            // Mostrar filtro principal
            this.elements.filter.classList.remove('hidden');
            this.elements.filter.classList.add('active');
            
            // Ativar todos os efeitos
            this.activateFilter();
            this.activateParticles();
            this.activateFog();
            this.activateDistortion();
            this.showIndicator();
            
            // Vibrar dispositivo para feedback
            Utils.vibrate([300, 100, 300, 100, 300]);
            
            Utils.log('Modo mundo invertido ativado com sucesso');
            
        } catch (error) {
            Utils.log(`Erro ao ativar mundo invertido: ${error.message}`, 'error');
        }
    }

    // Desativar o modo mundo invertido (para debug ou reset)
    deactivate() {
        if (!this.isActive) {
            Utils.log('Mundo invertido já está inativo');
            return;
        }
        
        Utils.log('Desativando modo mundo invertido...');
        
        try {
            this.isActive = false;
            
            // Desativar todos os efeitos
            this.deactivateFilter();
            this.deactivateParticles();
            this.deactivateFog();
            this.deactivateDistortion();
            this.hideIndicator();
            
            // Ocultar filtro principal após transição
            setTimeout(() => {
                this.elements.filter.classList.add('hidden');
            }, 2000);
            
            Utils.log('Modo mundo invertido desativado');
            
        } catch (error) {
            Utils.log(`Erro ao desativar mundo invertido: ${error.message}`, 'error');
        }
    }

    activateFilter() {
        // O filtro principal já é ativado pela classe CSS
        Utils.log('Filtro esverdeado ativado');
    }

    deactivateFilter() {
        this.elements.filter.classList.remove('active');
        Utils.log('Filtro esverdeado desativado');
    }

    activateParticles() {
        if (!this.elements.particlesOverlay) return;
        
        this.elements.particlesOverlay.classList.add('active');
        this.startParticleSystem();
        Utils.log('Sistema de partículas ativado');
    }

    deactivateParticles() {
        if (!this.elements.particlesOverlay) return;
        
        this.elements.particlesOverlay.classList.remove('active');
        this.stopParticleSystem();
        Utils.log('Sistema de partículas desativado');
    }

    activateFog() {
        if (!this.elements.fog) return;
        
        this.elements.fog.classList.add('active');
        Utils.log('Efeito de névoa ativado');
    }

    deactivateFog() {
        if (!this.elements.fog) return;
        
        this.elements.fog.classList.remove('active');
        Utils.log('Efeito de névoa desativado');
    }

    activateDistortion() {
        if (!this.elements.distortion) return;
        
        this.elements.distortion.classList.add('active');
        Utils.log('Efeito de distorção ativado');
    }

    deactivateDistortion() {
        if (!this.elements.distortion) return;
        
        this.elements.distortion.classList.remove('active');
        Utils.log('Efeito de distorção desativado');
    }

    showIndicator() {
        if (!this.elements.indicator) return;
        
        this.elements.indicator.classList.add('show');
        this.elements.indicator.classList.remove('hide');
        
        // Ocultar indicador após alguns segundos
        setTimeout(() => {
            this.hideIndicator();
        }, 5000);
        
        Utils.log('Indicador do mundo invertido exibido');
    }

    hideIndicator() {
        if (!this.elements.indicator) return;
        
        this.elements.indicator.classList.add('hide');
        this.elements.indicator.classList.remove('show');
        Utils.log('Indicador do mundo invertido ocultado');
    }

    startParticleSystem() {
        if (this.animationFrameId) {
            this.stopParticleSystem();
        }
        
        this.particles = [];
        this.animateParticles();
        Utils.log('Sistema de partículas iniciado');
    }

    stopParticleSystem() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Limpar partículas existentes
        this.clearParticles();
        Utils.log('Sistema de partículas parado');
    }

    pauseParticles() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        Utils.log('Sistema de partículas pausado');
    }

    resumeParticles() {
        if (this.isActive && !this.animationFrameId) {
            this.animateParticles();
            Utils.log('Sistema de partículas retomado');
        }
    }

    animateParticles() {
        if (!this.isActive) return;
        
        // Criar novas partículas
        if (Math.random() < this.particleConfig.spawnRate && 
            this.particles.length < this.particleConfig.maxParticles) {
            this.createParticle();
        }
        
        // Atualizar partículas existentes
        this.updateParticles();
        
        // Continuar animação
        this.animationFrameId = requestAnimationFrame(() => {
            this.animateParticles();
        });
    }

    createParticle() {
        if (!this.elements.particlesOverlay) return;
        
        const particle = document.createElement('div');
        const type = this.particleConfig.types[
            Math.floor(Math.random() * this.particleConfig.types.length)
        ];
        
        particle.className = `particle ${type}`;
        
        // Posição inicial aleatória
        const startX = Math.random() * window.innerWidth;
        const drift = this.particleConfig.driftRange[0] + 
                     Math.random() * (this.particleConfig.driftRange[1] - this.particleConfig.driftRange[0]);
        
        particle.style.left = startX + 'px';
        particle.style.setProperty('--drift', drift + 'px');
        
        // Duração aleatória da animação
        const duration = 8 + Math.random() * 8; // 8-16 segundos
        particle.style.animationDuration = duration + 's';
        
        // Adicionar ao DOM
        this.elements.particlesOverlay.appendChild(particle);
        
        // Armazenar referência
        const particleData = {
            element: particle,
            startTime: Date.now(),
            duration: duration * 1000
        };
        
        this.particles.push(particleData);
        
        // Remover partícula após animação
        setTimeout(() => {
            this.removeParticle(particleData);
        }, particleData.duration);
    }

    updateParticles() {
        const now = Date.now();
        
        // Remover partículas expiradas
        this.particles = this.particles.filter(particleData => {
            if (now - particleData.startTime > particleData.duration) {
                this.removeParticle(particleData);
                return false;
            }
            return true;
        });
    }

    removeParticle(particleData) {
        if (particleData.element && particleData.element.parentNode) {
            particleData.element.parentNode.removeChild(particleData.element);
        }
    }

    clearParticles() {
        this.particles.forEach(particleData => {
            this.removeParticle(particleData);
        });
        this.particles = [];
        
        // Limpar qualquer partícula restante no DOM
        if (this.elements.particlesOverlay) {
            const remainingParticles = this.elements.particlesOverlay.querySelectorAll('.particle');
            remainingParticles.forEach(particle => {
                particle.remove();
            });
        }
    }

    adjustForOrientation() {
        // Reajustar partículas para nova orientação
        if (this.isActive) {
            this.clearParticles();
            // As novas partículas serão criadas automaticamente pelo loop de animação
        }
        
        Utils.log('Sistema ajustado para mudança de orientação');
    }

    // Verificar se o modo está ativo
    isUpsideDownActive() {
        return this.isActive;
    }

    // Obter estatísticas do sistema
    getStats() {
        return {
            isActive: this.isActive,
            particleCount: this.particles.length,
            maxParticles: this.particleConfig.maxParticles,
            animationActive: this.animationFrameId !== null
        };
    }

    // Método para debug
    toggleDebugMode() {
        const debugInfo = document.getElementById('upside-down-debug');
        
        if (debugInfo) {
            debugInfo.remove();
        } else {
            const debug = document.createElement('div');
            debug.id = 'upside-down-debug';
            debug.style.cssText = `
                position: fixed;
                top: 60px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: #00ff00;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 12px;
                z-index: 2000;
                border: 1px solid #00ff00;
            `;
            
            document.body.appendChild(debug);
            
            const updateDebug = () => {
                if (debug.parentNode) {
                    const stats = this.getStats();
                    debug.innerHTML = `
                        <div>Mundo Invertido: ${stats.isActive ? 'ATIVO' : 'INATIVO'}</div>
                        <div>Partículas: ${stats.particleCount}/${stats.maxParticles}</div>
                        <div>Animação: ${stats.animationActive ? 'SIM' : 'NÃO'}</div>
                    `;
                    setTimeout(updateDebug, 1000);
                }
            };
            
            updateDebug();
        }
    }

    // Limpar recursos
    destroy() {
        this.stopParticleSystem();
        this.clearParticles();
        
        // Remover elementos criados
        if (this.elements.indicator && this.elements.indicator.parentNode) {
            this.elements.indicator.parentNode.removeChild(this.elements.indicator);
        }
        
        Utils.log('UpsideDownManager destruído');
    }
}

// Exportar para uso global
window.UpsideDownManager = UpsideDownManager;