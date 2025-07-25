# Stranger Things AR Game

Um jogo de realidade aumentada baseado na série Stranger Things, desenvolvido como Progressive Web App (PWA) para dispositivos móveis.

## 🚀 Deploy no GitHub Pages

Este projeto está configurado para deploy automático no GitHub Pages usando GitHub Actions.

### Configuração Inicial

1. **Fork ou clone este repositório**
2. **Ative o GitHub Pages**:
   - Vá em Settings > Pages
   - Source: GitHub Actions
   - O deploy será automático a cada push na branch main/master

### Build e Deploy Automático

O projeto usa GitHub Actions para:
- ✅ Executar testes automatizados
- ✅ Otimizar assets para produção
- ✅ Configurar PWA com Service Worker
- ✅ Deploy automático no GitHub Pages com HTTPS

### URLs de Acesso

- **Produção**: `https://[seu-usuario].github.io/[nome-do-repo]/`
- **Desenvolvimento local**: `http://localhost:8000`

## 🛠️ Desenvolvimento Local

### Pré-requisitos

- Node.js 18+
- Python 3.x (para servidor local)

### Comandos

```bash
# Instalar dependências de teste
cd tests && npm install

# Executar testes
npm test

# Build para produção
npm run build

# Servidor local de desenvolvimento
npm run dev
# ou
python -m http.server 8000
```

## 📱 Requisitos do Dispositivo

- **Dispositivo**: Samsung S20 FE (otimizado)
- **Orientação**: Retrato
- **Navegador**: Chrome/Edge mobile com suporte a WebXR
- **Permissões**: Câmera, Geolocalização, Vibração

## 🎮 Como Jogar

1. Acesse a URL do jogo no seu dispositivo móvel
2. Permita acesso à câmera e localização
3. Siga as instruções do Dustin
4. Navegue pelos locais do bairro Pedra Branca
5. Complete as 8 missões usando AR

## 🏗️ Arquitetura PWA

### Service Worker
- Cache offline de todos os assets
- Funcionamento sem internet após carregamento inicial
- Cache busting automático em builds

### Manifest.json
- Instalação como app nativo
- Ícones e configurações PWA
- Orientação retrato forçada

### Assets Otimizados
- Modelos 3D GLB comprimidos
- Áudios otimizados para mobile
- Imagens responsivas

## 🧪 Testes

### Testes Automatizados
- Testes unitários para geolocalização
- Testes de integração para fluxo de missões
- Testes de performance para Samsung S20 FE

### Executar Testes
```bash
cd tests
npm test
```

## 📦 Estrutura do Projeto

```
├── .github/workflows/    # GitHub Actions
├── assets/              # Imagens, modelos 3D, GIFs
├── css/                 # Estilos
├── js/                  # Código JavaScript
├── sounds/              # Áudios do jogo
├── tests/               # Testes automatizados
├── index.html           # Página principal
├── manifest.json        # Configuração PWA
├── sw.js               # Service Worker
└── build.js            # Script de build
```

## 🔧 Configuração de Deploy

### GitHub Actions Workflow

O arquivo `.github/workflows/deploy.yml` configura:

1. **Build Stage**:
   - Checkout do código
   - Setup Node.js 18
   - Instalação de dependências
   - Execução de testes
   - Otimização de assets
   - Geração de ícones PWA

2. **Deploy Stage**:
   - Upload para GitHub Pages
   - Configuração HTTPS automática
   - Cache busting do Service Worker

### Otimizações de Produção

- **Assets**: Cópia otimizada para `dist/`
- **Service Worker**: Cache busting com timestamp
- **PWA Icons**: Geração automática de ícones SVG
- **Paths**: Configuração para subdiretorios do GitHub Pages

## 🌐 HTTPS e Segurança

- **HTTPS**: Automático via GitHub Pages
- **Service Worker**: Funciona apenas com HTTPS
- **Geolocalização**: Requer HTTPS para funcionar
- **Camera API**: Requer HTTPS em produção

## 📊 Performance

### Otimizações Implementadas
- Lazy loading de assets de mídia
- Cache estratégico com Service Worker
- Modelos 3D otimizados para mobile
- Compressão de assets

### Métricas Alvo (Samsung S20 FE)
- **FPS**: 30+ durante AR
- **Carregamento**: < 10s para assets essenciais
- **Precisão GPS**: < 5m
- **Uso de Memória**: < 512MB

## 🐛 Troubleshooting

### Problemas Comuns

1. **Service Worker não atualiza**:
   - Limpe o cache do navegador
   - Force refresh (Ctrl+Shift+R)

2. **AR não funciona**:
   - Verifique se está em HTTPS
   - Confirme permissões de câmera
   - Teste em Chrome mobile

3. **Geolocalização imprecisa**:
   - Ative GPS de alta precisão
   - Teste em área aberta
   - Aguarde alguns segundos para calibração

4. **Assets não carregam**:
   - Verifique conexão de internet
   - Confirme se todos os arquivos estão no repositório
   - Verifique console do navegador para erros

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.