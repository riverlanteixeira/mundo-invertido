# 🧪 Testes Automatizados - Stranger Things AR Game

Este diretório contém todos os testes automatizados para o jogo Stranger Things AR, incluindo testes unitários, de integração e de performance.

## 📁 Estrutura dos Testes

```
tests/
├── unit/                    # Testes unitários
│   ├── geolocation.test.js  # Testes de cálculos de geolocalização
│   └── missions.test.js     # Testes de lógica de missões
├── integration/             # Testes de integração
│   └── game-flow.test.js    # Testes do fluxo completo do jogo
├── performance/             # Testes de performance
│   └── samsung-s20fe.test.js # Testes específicos para Samsung S20 FE
├── __mocks__/               # Mocks para testes
│   └── fileMock.js          # Mock para arquivos estáticos
├── reports/                 # Relatórios de teste (gerado automaticamente)
├── jest.config.js           # Configuração do Jest
├── setup.js                 # Setup global para testes
├── run-tests.js             # Script para executar testes
├── package.json             # Dependências dos testes
└── README.md                # Este arquivo
```

## 🚀 Como Executar os Testes

### Pré-requisitos

1. **Node.js** (versão 16 ou superior)
2. **npm** ou **yarn**

### Instalação das Dependências

```bash
cd tests
npm install
```

### Comandos Disponíveis

#### Executar Todos os Testes
```bash
npm test
# ou
node run-tests.js all
```

#### Executar Tipos Específicos de Teste

**Testes Unitários:**
```bash
npm run test:unit
# ou
node run-tests.js unit
```

**Testes de Integração:**
```bash
npm run test:integration
# ou
node run-tests.js integration
```

**Testes de Performance:**
```bash
npm run test:performance
# ou
node run-tests.js performance
```

#### Gerar Relatório de Cobertura
```bash
npm run test:coverage
# ou
node run-tests.js coverage
```

#### Modo Watch (Desenvolvimento)
```bash
npm run test:watch
# ou
node run-tests.js watch
```

#### Limpar Cache e Arquivos Temporários
```bash
npm run test:clean
# ou
node run-tests.js clean
```

### Opções Avançadas

**Executar com cobertura:**
```bash
node run-tests.js all --coverage
```

**Executar em modo silencioso:**
```bash
node run-tests.js all --silent
```

**Atualizar snapshots:**
```bash
node run-tests.js all --update
```

**Especificar número de workers:**
```bash
node run-tests.js all --workers=4
```

## 📊 Tipos de Teste

### 🔬 Testes Unitários

Testam funções e componentes individuais em isolamento:

- **Cálculos de Geolocalização**: Distância, bearing, validação de coordenadas
- **Lógica de Missões**: Transições, validações, persistência
- **Gerenciamento de Estado**: GameState, inventário, permissões
- **Utilitários**: Formatação, validação, conversões

### 🔗 Testes de Integração

Testam a interação entre diferentes componentes:

- **Fluxo Completo do Jogo**: Da inicialização até a conclusão
- **Integração de Sistemas**: AR + Geolocalização + Áudio
- **Tratamento de Erros**: Fallbacks e recuperação
- **Persistência**: LocalStorage e estado do jogo

### ⚡ Testes de Performance

Testam performance específica para dispositivos alvo:

- **Samsung S20 FE**: Otimizações específicas do dispositivo
- **Renderização**: FPS, qualidade gráfica, LOD
- **Memória**: Uso, limpeza, otimização
- **Rede**: Carregamento de assets, cache
- **Bateria**: Otimizações de energia

## 📈 Relatórios

Os relatórios são gerados automaticamente em `tests/reports/`:

- **HTML Report**: `test-report.html` - Relatório visual dos testes
- **Coverage Report**: `coverage/index.html` - Relatório de cobertura de código
- **JUnit XML**: `junit.xml` - Para integração com CI/CD

## 🎯 Metas de Cobertura

- **Branches**: 70%
- **Functions**: 75%
- **Lines**: 80%
- **Statements**: 80%

## 🔧 Configuração para CI/CD

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd tests && npm install
      - run: cd tests && npm run test:ci
      - uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: tests/reports/
```

## 🐛 Debugging

### Executar Teste Específico
```bash
npx jest tests/unit/geolocation.test.js
```

### Debug com Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest tests/unit/geolocation.test.js --runInBand
```

### Logs Detalhados
```bash
DEBUG=* node run-tests.js unit
```

## 📝 Escrevendo Novos Testes

### Estrutura Básica

```javascript
describe('Nome do Componente', () => {
    let component;
    
    beforeEach(() => {
        component = new Component();
    });
    
    afterEach(() => {
        component.cleanup?.();
    });
    
    test('deve fazer algo específico', () => {
        // Arrange
        const input = 'valor de teste';
        
        // Act
        const result = component.doSomething(input);
        
        // Assert
        expect(result).toBe('resultado esperado');
    });
});
```

### Mocks Disponíveis

- **Navigator APIs**: Geolocation, MediaDevices, Permissions
- **DOM APIs**: LocalStorage, Performance, Audio
- **A-Frame**: Componentes e sistemas AR
- **WebGL**: Contexto e operações gráficas

### Utilitários de Teste

```javascript
// Simular posição GPS
const position = testUtils.mockGPSPosition(-27.630, -48.680);

// Simular stream de câmera
const stream = testUtils.mockCameraStream();

// Aguardar próximo tick
await testUtils.nextTick();

// Simular clique
testUtils.simulateClick(element);
```

## 🚨 Troubleshooting

### Problemas Comuns

**Erro: "Cannot find module"**
```bash
cd tests && npm install
```

**Timeout nos testes**
```bash
# Aumentar timeout
node run-tests.js all --timeout=30000
```

**Problemas de memória**
```bash
# Reduzir workers
node run-tests.js all --workers=1
```

**Cache corrompido**
```bash
npm run test:clean
```

### Logs de Debug

Para habilitar logs detalhados:
```bash
DEBUG=jest* npm test
```

## 📚 Recursos Adicionais

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [A-Frame Testing](https://aframe.io/docs/1.4.0/introduction/developing-with-aframe.html#testing)

## 🤝 Contribuindo

1. Escreva testes para novas funcionalidades
2. Mantenha cobertura acima das metas estabelecidas
3. Execute todos os testes antes de fazer commit
4. Documente casos de teste complexos

## 📞 Suporte

Para problemas com os testes, verifique:

1. **Logs de erro** nos relatórios
2. **Configuração** do ambiente
3. **Dependências** atualizadas
4. **Documentação** específica do Jest