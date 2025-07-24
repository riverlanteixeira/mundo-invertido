// Gerenciador de permissões do dispositivo
class PermissionHandler {
    constructor() {
        this.permissions = {
            camera: false,
            location: false,
            vibration: false
        };
        
        this.permissionCallbacks = new Map();
    }

    // Solicitar permissão de câmera
    async requestCameraPermission() {
        Utils.log('Solicitando permissão de câmera...');
        
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('getUserMedia não suportado');
            }

            // Tentar acessar a câmera
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Câmera traseira
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            // Parar o stream imediatamente (só testando permissão)
            stream.getTracks().forEach(track => track.stop());
            
            this.permissions.camera = true;
            Utils.log('Permissão de câmera concedida');
            return true;

        } catch (error) {
            Utils.log(`Erro ao solicitar permissão de câmera: ${error.message}`, 'error');
            this.permissions.camera = false;
            
            // Mostrar modal de erro
            this.showPermissionError('camera', error.message);
            return false;
        }
    }

    // Solicitar permissão de geolocalização
    async requestLocationPermission() {
        Utils.log('Solicitando permissão de geolocalização...');
        
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                Utils.log('Geolocalização não suportada', 'error');
                this.showPermissionError('location', 'Geolocalização não suportada neste dispositivo');
                resolve(false);
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.permissions.location = true;
                    Utils.log('Permissão de geolocalização concedida');
                    resolve(true);
                },
                (error) => {
                    this.permissions.location = false;
                    Utils.log(`Erro de geolocalização: ${error.message}`, 'error');
                    this.showLocationError(error);
                    resolve(false);
                },
                options
            );
        });
    }

    // Solicitar permissão de vibração
    async requestVibrationPermission() {
        Utils.log('Verificando suporte à vibração...');
        
        if ('vibrate' in navigator) {
            // Testar vibração
            navigator.vibrate(100);
            this.permissions.vibration = true;
            Utils.log('Vibração suportada');
            return true;
        } else {
            this.permissions.vibration = false;
            Utils.log('Vibração não suportada', 'warn');
            return false;
        }
    }

    // Verificar status de uma permissão
    hasPermission(type) {
        return this.permissions[type] || false;
    }

    // Verificar todas as permissões necessárias
    hasAllRequiredPermissions() {
        return this.permissions.camera && this.permissions.location;
    }

    // Mostrar erro de permissão
    showPermissionError(type, message) {
        const errorMessages = {
            camera: {
                title: 'Câmera Necessária',
                message: 'Este jogo precisa acessar sua câmera para funcionar. Por favor, permita o acesso à câmera.',
                instructions: [
                    '1. Clique no ícone de câmera na barra de endereços',
                    '2. Selecione "Permitir"',
                    '3. Recarregue a página'
                ]
            },
            location: {
                title: 'Localização Necessária',
                message: 'Este jogo usa sua localização para ativar missões. Por favor, permita o acesso à localização.',
                instructions: [
                    '1. Clique no ícone de localização na barra de endereços',
                    '2. Selecione "Permitir"',
                    '3. Certifique-se que o GPS está ativado'
                ]
            }
        };

        const errorInfo = errorMessages[type];
        if (!errorInfo) return;

        this.showPermissionModal(errorInfo.title, errorInfo.message, errorInfo.instructions);
    }

    // Mostrar erro específico de localização
    showLocationError(error) {
        let message = 'Erro ao acessar localização: ';
        let instructions = [];

        switch (error.code) {
            case error.PERMISSION_DENIED:
                message += 'Permissão negada pelo usuário.';
                instructions = [
                    '1. Clique no ícone de localização na barra de endereços',
                    '2. Selecione "Permitir"',
                    '3. Recarregue a página'
                ];
                break;
            case error.POSITION_UNAVAILABLE:
                message += 'Localização indisponível.';
                instructions = [
                    '1. Verifique se o GPS está ativado',
                    '2. Certifique-se de estar ao ar livre',
                    '3. Tente novamente em alguns segundos'
                ];
                break;
            case error.TIMEOUT:
                message += 'Tempo limite excedido.';
                instructions = [
                    '1. Verifique sua conexão com a internet',
                    '2. Certifique-se de estar ao ar livre',
                    '3. Tente novamente'
                ];
                break;
            default:
                message += 'Erro desconhecido.';
                instructions = [
                    '1. Recarregue a página',
                    '2. Verifique as configurações do navegador',
                    '3. Tente em outro navegador'
                ];
        }

        this.showPermissionModal('Erro de Localização', message, instructions);
    }

    // Mostrar modal de permissão
    showPermissionModal(title, message, instructions) {
        // Remover modal existente se houver
        const existingModal = document.getElementById('permission-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Criar modal
        const modal = document.createElement('div');
        modal.id = 'permission-modal';
        modal.className = 'permission-modal';
        modal.innerHTML = `
            <div class="permission-modal-content">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="permission-instructions">
                    <h4>Como resolver:</h4>
                    <ul>
                        ${instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                    </ul>
                </div>
                <div class="permission-modal-buttons">
                    <button class="permission-button retry-button">Tentar Novamente</button>
                    <button class="permission-button close-button">Fechar</button>
                </div>
            </div>
        `;

        // Adicionar estilos
        const style = document.createElement('style');
        style.textContent = `
            .permission-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            
            .permission-modal-content {
                background: #1a1a1a;
                border: 2px solid #ff6b6b;
                border-radius: 15px;
                padding: 2rem;
                max-width: 90%;
                width: 400px;
                text-align: center;
            }
            
            .permission-modal-content h3 {
                color: #ff6b6b;
                margin-bottom: 1rem;
                font-size: 1.5rem;
            }
            
            .permission-modal-content p {
                color: #ccc;
                margin-bottom: 1.5rem;
                line-height: 1.5;
            }
            
            .permission-instructions {
                text-align: left;
                margin-bottom: 2rem;
            }
            
            .permission-instructions h4 {
                color: #fff;
                margin-bottom: 0.5rem;
            }
            
            .permission-instructions ul {
                color: #ccc;
                padding-left: 1rem;
            }
            
            .permission-instructions li {
                margin-bottom: 0.5rem;
            }
            
            .permission-modal-buttons {
                display: flex;
                gap: 1rem;
                justify-content: center;
            }
            
            .permission-button {
                background: #ff6b6b;
                border: none;
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1rem;
                transition: background 0.3s ease;
            }
            
            .permission-button:hover {
                background: #ff5252;
            }
            
            .close-button {
                background: #666 !important;
            }
            
            .close-button:hover {
                background: #555 !important;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.retry-button').addEventListener('click', () => {
            modal.remove();
            // Recarregar página para tentar novamente
            location.reload();
        });

        modal.querySelector('.close-button').addEventListener('click', () => {
            modal.remove();
        });

        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Verificar se o dispositivo está em orientação retrato
    checkOrientation() {
        const isPortrait = window.innerHeight > window.innerWidth;
        
        if (!isPortrait) {
            Utils.log('Dispositivo não está em orientação retrato', 'warn');
            return false;
        }
        
        return true;
    }

    // Verificar suporte geral do dispositivo
    checkDeviceSupport() {
        const support = Utils.checkSupport();
        const issues = [];

        if (!support.geolocation) {
            issues.push('Geolocalização não suportada');
        }

        if (!support.camera) {
            issues.push('Câmera não suportada');
        }

        if (!support.webgl) {
            issues.push('WebGL não suportado (necessário para AR)');
        }

        if (!support.serviceWorker) {
            issues.push('Service Worker não suportado (funcionalidade offline limitada)');
        }

        if (issues.length > 0) {
            Utils.log(`Problemas de suporte detectados: ${issues.join(', ')}`, 'warn');
            
            // Mostrar aviso se houver problemas críticos
            const criticalIssues = issues.filter(issue => 
                issue.includes('Geolocalização') || 
                issue.includes('Câmera') || 
                issue.includes('WebGL')
            );

            if (criticalIssues.length > 0) {
                this.showDeviceCompatibilityWarning(criticalIssues);
                return false;
            }
        }

        return true;
    }

    // Mostrar aviso de compatibilidade
    showDeviceCompatibilityWarning(issues) {
        const message = `Seu dispositivo pode não ser totalmente compatível com este jogo:\n\n${issues.join('\n')}`;
        
        this.showPermissionModal(
            'Compatibilidade do Dispositivo',
            message,
            [
                '1. Tente usar um navegador mais recente (Chrome, Firefox, Safari)',
                '2. Certifique-se que seu dispositivo suporta WebGL',
                '3. Verifique se as permissões estão habilitadas',
                '4. Tente em outro dispositivo se os problemas persistirem'
            ]
        );
    }

    // Solicitar todas as permissões necessárias
    async requestAllPermissions() {
        Utils.log('Solicitando todas as permissões necessárias...');
        
        const results = {
            camera: await this.requestCameraPermission(),
            location: await this.requestLocationPermission(),
            vibration: await this.requestVibrationPermission()
        };

        const success = results.camera && results.location;
        
        if (success) {
            Utils.log('Todas as permissões necessárias foram concedidas');
        } else {
            Utils.log('Algumas permissões não foram concedidas', 'warn');
        }

        return results;
    }

    // Obter status de todas as permissões
    getPermissionStatus() {
        return { ...this.permissions };
    }
}

// Exportar para uso global
window.PermissionHandler = PermissionHandler;