// Setup global para testes do Stranger Things AR Game
import '@testing-library/jest-dom';

// Mock das APIs do navegador
global.navigator = {
    userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G781B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    platform: 'Linux armv8l',
    language: 'pt-BR',
    languages: ['pt-BR', 'pt', 'en'],
    cookieEnabled: true,
    onLine: true,
    
    // Geolocation API
    geolocation: {
        getCurrentPosition: jest.fn(),
        watchPosition: jest.fn(),
        clearWatch: jest.fn()
    },
    
    // Media Devices API
    mediaDevices: {
        getUserMedia: jest.fn(),
        enumerateDevices: jest.fn()
    },
    
    // Permissions API
    permissions: {
        query: jest.fn()
    },
    
    // Vibration API
    vibrate: jest.fn(),
    
    // Service Worker API
    serviceWorker: {
        register: jest.fn(),
        ready: Promise.resolve({
            active: { postMessage: jest.fn() }
        })
    },
    
    // Connection API
    connection: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50
    },
    
    // Battery API
    getBattery: jest.fn(() => Promise.resolve({
        level: 0.8,
        charging: false,
        chargingTime: Infinity,
        dischargingTime: 3600
    }))
};

// Mock do localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
};
global.localStorage = localStorageMock;

// Mock do sessionStorage
global.sessionStorage = localStorageMock;

// Mock da Performance API
global.performance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    
    // Memory API (Chrome específico)
    memory: {
        usedJSHeapSize: 50 * 1024 * 1024,
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024
    },
    
    // Observer APIs
    PerformanceObserver: jest.fn().mockImplementation(() => ({
        observe: jest.fn(),
        disconnect: jest.fn()
    }))
};

// Mock do requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock do A-Frame
global.AFRAME = {
    registerComponent: jest.fn(),
    registerPrimitive: jest.fn(),
    registerShader: jest.fn(),
    registerSystem: jest.fn(),
    
    components: {
        arjs: {
            schema: {},
            init: jest.fn(),
            tick: jest.fn()
        }
    },
    
    systems: {
        arjs: {
            init: jest.fn(),
            tick: jest.fn()
        }
    },
    
    utils: {
        device: {
            isMobile: () => true,
            isTablet: () => false,
            checkHeadsetConnected: () => false
        },
        coordinates: {
            stringify: jest.fn(),
            parse: jest.fn()
        }
    }
};

// Mock do WebGL
const mockWebGLContext = {
    canvas: document.createElement('canvas'),
    drawingBufferWidth: 1080,
    drawingBufferHeight: 2400,
    getParameter: jest.fn(),
    getExtension: jest.fn(),
    createShader: jest.fn(),
    createProgram: jest.fn(),
    createBuffer: jest.fn(),
    createTexture: jest.fn(),
    bindBuffer: jest.fn(),
    bindTexture: jest.fn(),
    texImage2D: jest.fn(),
    useProgram: jest.fn(),
    drawArrays: jest.fn(),
    clear: jest.fn(),
    viewport: jest.fn()
};

HTMLCanvasElement.prototype.getContext = jest.fn((type) => {
    if (type === 'webgl' || type === 'webgl2') {
        return mockWebGLContext;
    }
    return null;
});

// Mock do Audio
global.Audio = jest.fn().mockImplementation(() => ({
    play: jest.fn(() => Promise.resolve()),
    pause: jest.fn(),
    load: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    currentTime: 0,
    duration: 100,
    volume: 1,
    muted: false,
    paused: true,
    ended: false,
    readyState: 4
}));

// Mock do AudioContext
global.AudioContext = jest.fn().mockImplementation(() => ({
    createOscillator: jest.fn(() => ({
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        frequency: { value: 440 }
    })),
    createGain: jest.fn(() => ({
        connect: jest.fn(),
        gain: { value: 1 }
    })),
    destination: {},
    currentTime: 0,
    sampleRate: 44100,
    state: 'running',
    suspend: jest.fn(),
    resume: jest.fn(),
    close: jest.fn()
}));

// Mock do MediaStream
global.MediaStream = jest.fn().mockImplementation(() => ({
    getTracks: jest.fn(() => []),
    getVideoTracks: jest.fn(() => []),
    getAudioTracks: jest.fn(() => []),
    addTrack: jest.fn(),
    removeTrack: jest.fn(),
    active: true,
    id: 'mock-stream-id'
}));

// Mock do MediaStreamTrack
global.MediaStreamTrack = jest.fn().mockImplementation(() => ({
    stop: jest.fn(),
    enabled: true,
    kind: 'video',
    label: 'mock camera',
    muted: false,
    readyState: 'live'
}));

// Mock das propriedades da tela
Object.defineProperty(window, 'screen', {
    value: {
        width: 1080,
        height: 2400,
        availWidth: 1080,
        availHeight: 2400,
        colorDepth: 24,
        pixelDepth: 24,
        orientation: {
            type: 'portrait-primary',
            angle: 0
        }
    }
});

Object.defineProperty(window, 'devicePixelRatio', {
    value: 3.0
});

Object.defineProperty(window, 'innerWidth', {
    value: 360,
    writable: true
});

Object.defineProperty(window, 'innerHeight', {
    value: 800,
    writable: true
});

// Mock dos eventos de orientação
global.DeviceOrientationEvent = jest.fn();
global.DeviceMotionEvent = jest.fn();

// Mock do Intersection Observer
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
}));

// Mock do Resize Observer
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
}));

// Mock do Mutation Observer
global.MutationObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: jest.fn(() => [])
}));

// Mock do Fetch API
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        blob: () => Promise.resolve(new Blob()),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
    })
);

// Mock do URL
global.URL = {
    createObjectURL: jest.fn(() => 'mock-object-url'),
    revokeObjectURL: jest.fn()
};

// Mock do Blob
global.Blob = jest.fn().mockImplementation((content, options) => ({
    size: content ? content.length : 0,
    type: options?.type || '',
    slice: jest.fn(),
    stream: jest.fn(),
    text: jest.fn(() => Promise.resolve('')),
    arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(0)))
}));

// Mock do FileReader
global.FileReader = jest.fn().mockImplementation(() => ({
    readAsDataURL: jest.fn(),
    readAsText: jest.fn(),
    readAsArrayBuffer: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    result: null,
    error: null,
    readyState: 0
}));

// Configurações de timeout para testes assíncronos
jest.setTimeout(10000);

// Configuração de console para testes
const originalConsoleError = console.error;
console.error = (...args) => {
    // Suprimir erros conhecidos do A-Frame e AR.js durante testes
    const message = args[0];
    if (
        typeof message === 'string' &&
        (message.includes('A-Frame') || 
         message.includes('AR.js') ||
         message.includes('WebGL') ||
         message.includes('three.js'))
    ) {
        return;
    }
    originalConsoleError(...args);
};

// Configuração de warnings para testes
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
    const message = args[0];
    if (
        typeof message === 'string' &&
        (message.includes('deprecated') || 
         message.includes('A-Frame') ||
         message.includes('AR.js'))
    ) {
        return;
    }
    originalConsoleWarn(...args);
};

// Utilitários de teste
global.testUtils = {
    // Simular posição GPS
    mockGPSPosition: (lat, lng, accuracy = 10) => ({
        coords: {
            latitude: lat,
            longitude: lng,
            accuracy: accuracy,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
        },
        timestamp: Date.now()
    }),
    
    // Simular stream de câmera
    mockCameraStream: () => ({
        getTracks: () => [{
            stop: jest.fn(),
            enabled: true,
            kind: 'video',
            label: 'mock camera'
        }]
    }),
    
    // Simular evento de orientação
    mockOrientationEvent: (alpha, beta, gamma) => ({
        alpha: alpha,
        beta: beta,
        gamma: gamma,
        absolute: true
    }),
    
    // Aguardar próximo tick
    nextTick: () => new Promise(resolve => setTimeout(resolve, 0)),
    
    // Aguardar animação
    waitForAnimation: () => new Promise(resolve => setTimeout(resolve, 100)),
    
    // Simular clique em elemento
    simulateClick: (element) => {
        const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        element.dispatchEvent(event);
    },
    
    // Simular toque em elemento
    simulateTouch: (element) => {
        const event = new TouchEvent('touchstart', {
            bubbles: true,
            cancelable: true,
            touches: [{
                clientX: 100,
                clientY: 100,
                target: element
            }]
        });
        element.dispatchEvent(event);
    }
};

// Configuração de matchers customizados
expect.extend({
    toBeWithinRange(received, floor, ceiling) {
        const pass = received >= floor && received <= ceiling;
        if (pass) {
            return {
                message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
                pass: true
            };
        } else {
            return {
                message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
                pass: false
            };
        }
    },
    
    toBeValidCoordinate(received) {
        const isValid = typeof received === 'object' &&
                       typeof received.lat === 'number' &&
                       typeof received.lng === 'number' &&
                       received.lat >= -90 && received.lat <= 90 &&
                       received.lng >= -180 && received.lng <= 180;
        
        if (isValid) {
            return {
                message: () => `expected ${JSON.stringify(received)} not to be a valid coordinate`,
                pass: true
            };
        } else {
            return {
                message: () => `expected ${JSON.stringify(received)} to be a valid coordinate`,
                pass: false
            };
        }
    }
});

// Limpeza após cada teste
afterEach(() => {
    // Limpar todos os mocks
    jest.clearAllMocks();
    
    // Limpar localStorage
    localStorage.clear();
    
    // Limpar DOM
    document.body.innerHTML = '';
    
    // Resetar console
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
});

// Setup antes de todos os testes
beforeAll(() => {
    // Configurar timezone para testes consistentes
    process.env.TZ = 'America/Sao_Paulo';
});

// Limpeza após todos os testes
afterAll(() => {
    // Restaurar console original
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
});