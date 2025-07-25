#!/usr/bin/env node

// Script para executar testes do Stranger Things AR Game
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configurações
const CONFIG = {
    testTypes: {
        unit: {
            name: 'Testes Unitários',
            pattern: 'tests/unit/**/*.test.js',
            timeout: 5000
        },
        integration: {
            name: 'Testes de Integração',
            pattern: 'tests/integration/**/*.test.js',
            timeout: 10000
        },
        performance: {
            name: 'Testes de Performance',
            pattern: 'tests/performance/**/*.test.js',
            timeout: 30000
        }
    },
    reports: {
        directory: 'tests/reports',
        formats: ['html', 'json', 'lcov']
    }
};

// Cores para output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Função para log colorido
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função para criar diretórios se não existirem
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        log(`📁 Diretório criado: ${dirPath}`, 'blue');
    }
}

// Função para executar comando e capturar output
function executeCommand(command, options = {}) {
    try {
        const result = execSync(command, {
            encoding: 'utf8',
            stdio: 'pipe',
            ...options
        });
        return { success: true, output: result };
    } catch (error) {
        return { 
            success: false, 
            output: error.stdout || error.message,
            error: error.stderr || error.message
        };
    }
}

// Função para verificar dependências
function checkDependencies() {
    log('🔍 Verificando dependências...', 'cyan');
    
    const dependencies = ['jest', 'babel-jest', 'jest-environment-jsdom'];
    const missing = [];
    
    dependencies.forEach(dep => {
        try {
            require.resolve(dep);
            log(`  ✅ ${dep}`, 'green');
        } catch (error) {
            missing.push(dep);
            log(`  ❌ ${dep}`, 'red');
        }
    });
    
    if (missing.length > 0) {
        log(`\n⚠️  Dependências faltando: ${missing.join(', ')}`, 'yellow');
        log('Execute: npm install --save-dev ' + missing.join(' '), 'yellow');
        return false;
    }
    
    return true;
}

// Função para executar tipo específico de teste
function runTestType(type, options = {}) {
    const config = CONFIG.testTypes[type];
    if (!config) {
        log(`❌ Tipo de teste inválido: ${type}`, 'red');
        return false;
    }
    
    log(`\n🧪 Executando ${config.name}...`, 'cyan');
    
    const jestCommand = [
        'npx jest',
        `--testPathPattern="${config.pattern}"`,
        `--testTimeout=${config.timeout}`,
        '--verbose',
        options.coverage ? '--coverage' : '',
        options.watch ? '--watch' : '',
        options.updateSnapshots ? '--updateSnapshot' : '',
        options.silent ? '--silent' : '',
        options.maxWorkers ? `--maxWorkers=${options.maxWorkers}` : ''
    ].filter(Boolean).join(' ');
    
    const result = executeCommand(jestCommand);
    
    if (result.success) {
        log(`✅ ${config.name} concluídos com sucesso!`, 'green');
        return true;
    } else {
        log(`❌ ${config.name} falharam:`, 'red');
        console.log(result.output);
        if (result.error) {
            console.log(result.error);
        }
        return false;
    }
}

// Função para executar todos os testes
function runAllTests(options = {}) {
    log('🚀 Iniciando execução de todos os testes...', 'bright');
    
    const results = {};
    let allPassed = true;
    
    // Executar cada tipo de teste
    Object.keys(CONFIG.testTypes).forEach(type => {
        const passed = runTestType(type, options);
        results[type] = passed;
        if (!passed) allPassed = false;
    });
    
    // Resumo final
    log('\n📊 Resumo dos Testes:', 'bright');
    Object.entries(results).forEach(([type, passed]) => {
        const config = CONFIG.testTypes[type];
        const status = passed ? '✅' : '❌';
        const color = passed ? 'green' : 'red';
        log(`  ${status} ${config.name}`, color);
    });
    
    if (allPassed) {
        log('\n🎉 Todos os testes passaram!', 'green');
    } else {
        log('\n💥 Alguns testes falharam!', 'red');
    }
    
    return allPassed;
}

// Função para gerar relatório de cobertura
function generateCoverageReport() {
    log('\n📈 Gerando relatório de cobertura...', 'cyan');
    
    const coverageCommand = [
        'npx jest',
        '--coverage',
        '--coverageReporters=html',
        '--coverageReporters=json',
        '--coverageReporters=lcov',
        '--coverageReporters=text',
        `--coverageDirectory=${CONFIG.reports.directory}/coverage`
    ].join(' ');
    
    const result = executeCommand(coverageCommand);
    
    if (result.success) {
        log('✅ Relatório de cobertura gerado!', 'green');
        log(`📁 Localização: ${CONFIG.reports.directory}/coverage/index.html`, 'blue');
        return true;
    } else {
        log('❌ Falha ao gerar relatório de cobertura:', 'red');
        console.log(result.output);
        return false;
    }
}

// Função para executar testes de performance específicos
function runPerformanceTests(device = 'samsung-s20fe') {
    log(`\n⚡ Executando testes de performance para ${device}...`, 'cyan');
    
    const perfCommand = [
        'npx jest',
        `--testPathPattern="tests/performance/${device}.test.js"`,
        '--testTimeout=60000',
        '--verbose',
        '--detectOpenHandles',
        '--forceExit'
    ].join(' ');
    
    const result = executeCommand(perfCommand);
    
    if (result.success) {
        log('✅ Testes de performance concluídos!', 'green');
        return true;
    } else {
        log('❌ Testes de performance falharam:', 'red');
        console.log(result.output);
        return false;
    }
}

// Função para executar testes em modo watch
function runWatchMode(pattern = '') {
    log('👀 Iniciando modo watch...', 'cyan');
    log('Pressione Ctrl+C para sair', 'yellow');
    
    const watchCommand = [
        'npx jest',
        '--watch',
        '--verbose',
        pattern ? `--testPathPattern="${pattern}"` : ''
    ].filter(Boolean).join(' ');
    
    try {
        execSync(watchCommand, { stdio: 'inherit' });
    } catch (error) {
        log('Watch mode interrompido', 'yellow');
    }
}

// Função para limpar cache e arquivos temporários
function cleanUp() {
    log('🧹 Limpando arquivos temporários...', 'cyan');
    
    const pathsToClean = [
        'tests/.jest-cache',
        'tests/coverage',
        'tests/reports',
        'node_modules/.cache/jest'
    ];
    
    pathsToClean.forEach(pathToClean => {
        if (fs.existsSync(pathToClean)) {
            try {
                fs.rmSync(pathToClean, { recursive: true, force: true });
                log(`  ✅ Removido: ${pathToClean}`, 'green');
            } catch (error) {
                log(`  ❌ Erro ao remover ${pathToClean}: ${error.message}`, 'red');
            }
        }
    });
}

// Função para mostrar ajuda
function showHelp() {
    log('🎮 Stranger Things AR - Test Runner', 'bright');
    log('\nComandos disponíveis:', 'cyan');
    log('  node tests/run-tests.js [comando] [opções]', 'blue');
    log('\nComandos:', 'cyan');
    log('  all              - Executar todos os testes', 'blue');
    log('  unit             - Executar apenas testes unitários', 'blue');
    log('  integration      - Executar apenas testes de integração', 'blue');
    log('  performance      - Executar apenas testes de performance', 'blue');
    log('  coverage         - Gerar relatório de cobertura', 'blue');
    log('  watch            - Executar em modo watch', 'blue');
    log('  clean            - Limpar cache e arquivos temporários', 'blue');
    log('  help             - Mostrar esta ajuda', 'blue');
    log('\nOpções:', 'cyan');
    log('  --coverage       - Incluir cobertura de código', 'blue');
    log('  --watch          - Executar em modo watch', 'blue');
    log('  --silent         - Executar em modo silencioso', 'blue');
    log('  --update         - Atualizar snapshots', 'blue');
    log('  --workers=N      - Número de workers paralelos', 'blue');
    log('\nExemplos:', 'cyan');
    log('  node tests/run-tests.js all --coverage', 'blue');
    log('  node tests/run-tests.js unit --watch', 'blue');
    log('  node tests/run-tests.js performance', 'blue');
}

// Função principal
function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';
    
    // Parse das opções
    const options = {
        coverage: args.includes('--coverage'),
        watch: args.includes('--watch'),
        silent: args.includes('--silent'),
        updateSnapshots: args.includes('--update'),
        maxWorkers: args.find(arg => arg.startsWith('--workers='))?.split('=')[1]
    };
    
    // Criar diretórios necessários
    ensureDirectoryExists(CONFIG.reports.directory);
    
    // Executar comando
    switch (command) {
        case 'all':
            if (!checkDependencies()) return;
            runAllTests(options);
            break;
            
        case 'unit':
            if (!checkDependencies()) return;
            runTestType('unit', options);
            break;
            
        case 'integration':
            if (!checkDependencies()) return;
            runTestType('integration', options);
            break;
            
        case 'performance':
            if (!checkDependencies()) return;
            runPerformanceTests();
            break;
            
        case 'coverage':
            if (!checkDependencies()) return;
            generateCoverageReport();
            break;
            
        case 'watch':
            if (!checkDependencies()) return;
            const pattern = args[1] || '';
            runWatchMode(pattern);
            break;
            
        case 'clean':
            cleanUp();
            break;
            
        case 'help':
        default:
            showHelp();
            break;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = {
    runAllTests,
    runTestType,
    runPerformanceTests,
    generateCoverageReport,
    cleanUp
};