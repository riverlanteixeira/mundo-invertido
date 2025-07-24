// Utilitários gerais
class Utils {
    // Calcular distância entre duas coordenadas usando fórmula de Haversine
    static calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000; // Raio da Terra em metros
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lng2 - lng1) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // Distância em metros
    }

    // Calcular bearing (direção) entre duas coordenadas
    static calculateBearing(lat1, lng1, lat2, lng2) {
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δλ = (lng2 - lng1) * Math.PI / 180;

        const y = Math.sin(Δλ) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

        const θ = Math.atan2(y, x);
        return (θ * 180 / Math.PI + 360) % 360; // Normalizar para 0-360°
    }

    // Formatar distância para exibição
    static formatDistance(meters) {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        } else {
            return `${(meters / 1000).toFixed(1)}km`;
        }
    }

    // Vibrar dispositivo
    static vibrate(pattern = [200, 100, 200]) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    // Verificar se está em orientação retrato
    static isPortrait() {
        return window.innerHeight > window.innerWidth;
    }

    // Aguardar tempo específico
    static wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Gerar ID único
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Validar coordenadas GPS
    static isValidCoordinate(lat, lng) {
        return !isNaN(lat) && !isNaN(lng) && 
               lat >= -90 && lat <= 90 && 
               lng >= -180 && lng <= 180;
    }

    // Verificar se coordenadas estão dentro do bairro Pedra Branca
    static isInPedraBranca(lat, lng) {
        const bounds = {
            north: -27.620,
            south: -27.640,
            east: -48.670,
            west: -48.690
        };
        
        return lat >= bounds.south && lat <= bounds.north &&
               lng >= bounds.west && lng <= bounds.east;
    }

    // Interpolar entre dois valores
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // Normalizar ângulo para 0-360°
    static normalizeAngle(angle) {
        return ((angle % 360) + 360) % 360;
    }

    // Converter graus para radianos
    static toRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    // Converter radianos para graus
    static toDegrees(radians) {
        return radians * 180 / Math.PI;
    }

    // Debounce para otimizar performance
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle para otimizar performance
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Verificar suporte a recursos
    static checkSupport() {
        const support = {
            geolocation: 'geolocation' in navigator,
            camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
            vibration: 'vibrate' in navigator,
            serviceWorker: 'serviceWorker' in navigator,
            webgl: (() => {
                try {
                    const canvas = document.createElement('canvas');
                    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
                } catch (e) {
                    return false;
                }
            })(),
            deviceOrientation: 'DeviceOrientationEvent' in window
        };
        
        return support;
    }

    // Log com timestamp
    static log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${type.toUpperCase()}]`;
        
        switch (type) {
            case 'error':
                console.error(prefix, message);
                break;
            case 'warn':
                console.warn(prefix, message);
                break;
            default:
                console.log(prefix, message);
        }
    }

    // Salvar no localStorage
    static saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            Utils.log(`Erro ao salvar no localStorage: ${error.message}`, 'error');
            return false;
        }
    }

    // Carregar do localStorage
    static loadFromStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            Utils.log(`Erro ao carregar do localStorage: ${error.message}`, 'error');
            return defaultValue;
        }
    }

    // Remover do localStorage
    static removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            Utils.log(`Erro ao remover do localStorage: ${error.message}`, 'error');
            return false;
        }
    }
}

// Exportar para uso global
window.Utils = Utils;