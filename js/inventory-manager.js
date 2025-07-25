// Gerenciador de inventário
class InventoryManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.eventListeners = new Map();
        this.inventoryPanel = null;
        this.inventoryItems = null;
        this.isVisible = false;
        
        // Configuração dos itens disponíveis
        this.itemConfig = {
            'taco': {
                name: 'Taco de Baseball',
                image: 'assets/img/taco.png',
                description: 'Arma improvisada para combate',
                type: 'weapon'
            },
            'gasolina': {
                name: 'Gasolina',
                image: 'assets/img/gasolina.png',
                description: 'Combustível inflamável',
                type: 'consumable'
            },
            'bicicleta-will': {
                name: 'Bicicleta do Will',
                image: 'assets/img/taco.png', // Placeholder - usar ícone do taco por enquanto
                description: 'Pista importante encontrada na floresta',
                type: 'clue'
            }
        };
    }

    async init() {
        Utils.log('Inicializando InventoryManager...');
        
        try {
            // Encontrar elementos DOM
            this.inventoryPanel = document.querySelector('.inventory-panel');
            this.inventoryItems = document.querySelector('.inventory-items');
            
            if (!this.inventoryPanel || !this.inventoryItems) {
                throw new Error('Elementos do inventário não encontrados no DOM');
            }
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Carregar inventário salvo
            this.loadInventory();
            
            // Atualizar interface inicial
            this.updateUI();
            
            Utils.log('InventoryManager inicializado com sucesso');
            
        } catch (error) {
            Utils.log(`Erro ao inicializar InventoryManager: ${error.message}`, 'error');
            throw error;
        }
    }

    setupEventListeners() {
        // Escutar mudanças no estado do inventário
        this.gameState.on?.('inventoryChanged', () => {
            this.updateUI();
        });
        
        // Clique no painel do inventário para mostrar/ocultar
        this.inventoryPanel.addEventListener('click', () => {
            this.toggleVisibility();
        });
        
        // Clique em itens individuais
        this.inventoryItems.addEventListener('click', (event) => {
            const itemElement = event.target.closest('.inventory-item');
            if (itemElement) {
                const itemId = itemElement.dataset.itemId;
                this.handleItemClick(itemId);
            }
        });
        
        Utils.log('Event listeners do inventário configurados');
    }

    // Adicionar item ao inventário
    addItem(itemId) {
        if (!this.itemConfig[itemId]) {
            Utils.log(`Item desconhecido: ${itemId}`, 'warn');
            return false;
        }
        
        const added = this.gameState.addToInventory(itemId);
        
        if (added) {
            Utils.log(`Item adicionado ao inventário: ${itemId}`);
            this.updateUI();
            this.showItemAddedFeedback(itemId);
            this.emit('itemAdded', { itemId, item: this.itemConfig[itemId] });
            return true;
        }
        
        return false;
    }

    // Remover item do inventário
    removeItem(itemId) {
        const removed = this.gameState.removeFromInventory(itemId);
        
        if (removed) {
            Utils.log(`Item removido do inventário: ${itemId}`);
            this.updateUI();
            this.emit('itemRemoved', { itemId, item: this.itemConfig[itemId] });
            return true;
        }
        
        return false;
    }

    // Verificar se tem item
    hasItem(itemId) {
        return this.gameState.hasInInventory(itemId);
    }

    // Obter todos os itens
    getItems() {
        return this.gameState.getInventory();
    }

    // Obter informações de um item
    getItemInfo(itemId) {
        return this.itemConfig[itemId] || null;
    }

    // Usar item (para combate, etc.)
    useItem(itemId) {
        if (!this.hasItem(itemId)) {
            Utils.log(`Tentativa de usar item não possuído: ${itemId}`, 'warn');
            return false;
        }
        
        const itemInfo = this.getItemInfo(itemId);
        if (!itemInfo) {
            Utils.log(`Informações do item não encontradas: ${itemId}`, 'error');
            return false;
        }
        
        Utils.log(`Usando item: ${itemId}`);
        this.emit('itemUsed', { itemId, item: itemInfo });
        
        // Remover item se for consumível
        if (itemInfo.type === 'consumable') {
            this.removeItem(itemId);
        }
        
        return true;
    }

    // Atualizar interface do inventário
    updateUI() {
        if (!this.inventoryItems) return;
        
        const inventory = this.getItems();
        
        // Limpar itens existentes
        this.inventoryItems.innerHTML = '';
        
        // Adicionar cada item
        inventory.forEach(itemId => {
            const itemInfo = this.getItemInfo(itemId);
            if (itemInfo) {
                const itemElement = this.createItemElement(itemId, itemInfo);
                this.inventoryItems.appendChild(itemElement);
            }
        });
        
        // Atualizar contador de itens
        this.updateItemCounter(inventory.length);
        
        // Mostrar/ocultar painel baseado se tem itens
        if (inventory.length > 0) {
            this.show();
        } else {
            this.hide();
        }
        
        Utils.log(`Interface do inventário atualizada: ${inventory.length} itens`);
    }

    // Criar elemento visual do item
    createItemElement(itemId, itemInfo) {
        const itemElement = document.createElement('div');
        itemElement.className = 'inventory-item';
        itemElement.dataset.itemId = itemId;
        itemElement.title = `${itemInfo.name}\n${itemInfo.description}`;
        
        // Configurar imagem de fundo
        itemElement.style.backgroundImage = `url(${itemInfo.image})`;
        itemElement.style.backgroundSize = 'contain';
        itemElement.style.backgroundRepeat = 'no-repeat';
        itemElement.style.backgroundPosition = 'center';
        
        // Adicionar animação de entrada
        itemElement.classList.add('item-appear');
        
        // Remover animação após completar
        setTimeout(() => {
            itemElement.classList.remove('item-appear');
        }, 600);
        
        return itemElement;
    }

    // Atualizar contador de itens
    updateItemCounter(count) {
        let counterElement = this.inventoryPanel.querySelector('.item-counter');
        
        if (!counterElement) {
            counterElement = document.createElement('div');
            counterElement.className = 'item-counter';
            this.inventoryPanel.appendChild(counterElement);
        }
        
        counterElement.textContent = count.toString();
        
        // Animar contador quando muda
        counterElement.classList.add('counter-update');
        setTimeout(() => {
            counterElement.classList.remove('counter-update');
        }, 300);
    }

    // Mostrar feedback quando item é adicionado
    showItemAddedFeedback(itemId) {
        const itemInfo = this.getItemInfo(itemId);
        if (!itemInfo) return;
        
        // Criar elemento de feedback
        const feedback = document.createElement('div');
        feedback.className = 'item-added-feedback';
        feedback.innerHTML = `
            <div class="feedback-icon">+</div>
            <div class="feedback-text">${itemInfo.name}</div>
        `;
        
        // Adicionar ao DOM
        document.body.appendChild(feedback);
        
        // Animar entrada
        setTimeout(() => {
            feedback.classList.add('show');
        }, 10);
        
        // Remover após animação
        setTimeout(() => {
            feedback.classList.add('hide');
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 500);
        }, 2000);
    }

    // Manipular clique em item
    handleItemClick(itemId) {
        const itemInfo = this.getItemInfo(itemId);
        if (!itemInfo) return;
        
        Utils.log(`Item clicado: ${itemId}`);
        
        // Mostrar detalhes do item
        this.showItemDetails(itemId, itemInfo);
        
        // Emitir evento
        this.emit('itemClicked', { itemId, item: itemInfo });
    }

    // Mostrar detalhes do item
    showItemDetails(itemId, itemInfo) {
        // Criar modal de detalhes
        const modal = document.createElement('div');
        modal.className = 'item-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${itemInfo.name}</h3>
                    <button class="close-button">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="item-image">
                        <img src="${itemInfo.image}" alt="${itemInfo.name}">
                    </div>
                    <div class="item-description">
                        <p>${itemInfo.description}</p>
                        <p class="item-type">Tipo: ${this.getTypeLabel(itemInfo.type)}</p>
                    </div>
                </div>
                <div class="modal-actions">
                    ${itemInfo.type === 'weapon' || itemInfo.type === 'consumable' ? 
                        `<button class="use-button" data-item-id="${itemId}">Usar</button>` : ''}
                    <button class="close-modal-button">Fechar</button>
                </div>
            </div>
        `;
        
        // Adicionar ao DOM
        document.body.appendChild(modal);
        
        // Configurar event listeners do modal
        const closeButton = modal.querySelector('.close-button');
        const closeModalButton = modal.querySelector('.close-modal-button');
        const useButton = modal.querySelector('.use-button');
        
        const closeModal = () => {
            modal.classList.add('hide');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        };
        
        closeButton.addEventListener('click', closeModal);
        closeModalButton.addEventListener('click', closeModal);
        
        if (useButton) {
            useButton.addEventListener('click', () => {
                this.useItem(itemId);
                closeModal();
            });
        }
        
        // Fechar ao clicar fora
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });
        
        // Animar entrada
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    // Obter label do tipo de item
    getTypeLabel(type) {
        const labels = {
            'weapon': 'Arma',
            'consumable': 'Consumível',
            'clue': 'Pista',
            'key': 'Chave',
            'tool': 'Ferramenta'
        };
        return labels[type] || 'Desconhecido';
    }

    // Mostrar inventário
    show() {
        if (this.inventoryPanel) {
            this.inventoryPanel.classList.remove('hidden');
            this.isVisible = true;
        }
    }

    // Ocultar inventário
    hide() {
        if (this.inventoryPanel) {
            this.inventoryPanel.classList.add('hidden');
            this.isVisible = false;
        }
    }

    // Alternar visibilidade
    toggleVisibility() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    // Carregar inventário do estado salvo
    loadInventory() {
        const savedInventory = this.getItems();
        Utils.log(`Inventário carregado: ${savedInventory.length} itens`);
        
        // Validar itens salvos
        const validItems = savedInventory.filter(itemId => this.itemConfig[itemId]);
        
        if (validItems.length !== savedInventory.length) {
            Utils.log('Alguns itens salvos são inválidos e foram removidos', 'warn');
            // Limpar inventário e adicionar apenas itens válidos
            this.gameState.clearInventory();
            validItems.forEach(itemId => this.gameState.addToInventory(itemId));
        }
    }

    // Limpar inventário
    clear() {
        this.gameState.clearInventory();
        this.updateUI();
        Utils.log('Inventário limpo');
        this.emit('inventoryCleared');
    }

    // Obter estatísticas do inventário
    getStats() {
        const inventory = this.getItems();
        const stats = {
            total: inventory.length,
            weapons: 0,
            consumables: 0,
            clues: 0,
            other: 0
        };
        
        inventory.forEach(itemId => {
            const itemInfo = this.getItemInfo(itemId);
            if (itemInfo) {
                switch (itemInfo.type) {
                    case 'weapon':
                        stats.weapons++;
                        break;
                    case 'consumable':
                        stats.consumables++;
                        break;
                    case 'clue':
                        stats.clues++;
                        break;
                    default:
                        stats.other++;
                }
            }
        });
        
        return stats;
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

    // Limpeza
    cleanup() {
        this.eventListeners.clear();
        
        // Remover event listeners do DOM
        if (this.inventoryPanel) {
            this.inventoryPanel.removeEventListener('click', this.toggleVisibility);
        }
        
        if (this.inventoryItems) {
            this.inventoryItems.removeEventListener('click', this.handleItemClick);
        }
        
        Utils.log('InventoryManager limpo');
    }
}

// Exportar para uso global
window.InventoryManager = InventoryManager;