// Configuração do Jest para testes do Stranger Things AR Game
module.exports = {
    // Ambiente de teste
    testEnvironment: 'jsdom',
    
    // Diretórios de teste
    testMatch: [
        '<rootDir>/**/*.test.js'
    ],
    
    // Setup files
    setupFilesAfterEnv: [
        '<rootDir>/setup.js'
    ],
    
    // Cobertura de código
    collectCoverage: true,
    collectCoverageFrom: [
        '../js/**/*.js',
        '!../js/vendor/**',
        '!../js/libs/**',
        '!**/node_modules/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: [
        'text',
        'lcov',
        'html',
        'json'
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 75,
            lines: 80,
            statements: 80
        }
    },
    
    // Transformações
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    
    // Módulos mock
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js'
    },
    
    // Configurações de timeout
    testTimeout: 5000,
    
    // Configurações de verbose
    verbose: true,
    
    // Configurações para CI/CD
    ci: process.env.CI === 'true',
    
    // Configurações de cache
    cache: true,
    cacheDirectory: '<rootDir>/.jest-cache',
    
    // Configurações de workers
    maxWorkers: '50%',
    
    // Configurações de relatórios
    reporters: [
        'default'
    ],
    
    // Configurações globais para testes
    globals: {
        'process.env.NODE_ENV': 'test',
        'process.env.GAME_VERSION': '1.0.0'
    },
    
    // Configurações de mock
    clearMocks: true,
    restoreMocks: true,
    
    // Configurações de notificação
    notify: false,
    notifyMode: 'failure-change',
    
    // Configurações de watch
    watchman: true,
    
    // Configurações de erro
    errorOnDeprecated: true,
    
    // Configurações de snapshot
    updateSnapshot: process.env.UPDATE_SNAPSHOTS === 'true'
};