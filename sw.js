const CACHE_NAME = 'stranger-things-ar-v2';
const CACHE_VERSION = '1.0.0';

// Assets essenciais para cache
const ESSENTIAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './fonts/stranger-things.ttf',
  './js/app.js',
  './js/error-handler.js',
  './js/game.js',
  './js/game-state.js',
  './js/utils.js',
  './js/audio-manager.js',
  './js/location-manager.js',
  './js/ar-manager.js',
  './js/mission-manager.js',
  './js/permission-handler.js',
  './js/inventory-manager.js',
  './js/upside-down-manager.js'
];

// Assets de mídia para cache
const MEDIA_ASSETS = [
  // Imagens
  './assets/img/dustin-call.png',
  './assets/img/the-big-bang-theory.jpg',
  './assets/img/bloco-h.jpg',
  './assets/img/taco.png',
  './assets/img/gasolina.png',
  
  // GIFs
  './assets/gif/luzes-piscando.gif',
  './assets/gif/portal.gif',
  './assets/gif/demogorgon-attack.gif',
  
  // Modelos 3D
  './assets/models/bicicleta-will.glb',
  './src/models/castle_byers.glb',
  './src/models/demogorgon.glb',
  './src/models/portal.glb',
  
  // Áudios - Ligações
  './sounds/call/dustin-intro.wav',
  './sounds/call/dustin-missao-1-completa.wav',
  './sounds/call/dustin-missao-2-completa.wav',
  './sounds/call/dustin-missao-3-completa.wav',
  './sounds/call/dustin-missao-4-completa.wav',
  './sounds/call/dustin-missao-5-completa.wav',
  './sounds/call/dustin-missao-6-completa.wav',
  './sounds/call/dustin-missao-7-completa.wav',
  './sounds/call/dustin-missao-8-completa.wav',
  './sounds/call/dustin-missao-falha.wav',
  
  // Áudios - Efeitos
  './sounds/effects/demogorgon-approach.wav',
  './sounds/effects/demogorgon-roar.wav',
  './sounds/effects/lights-flicker.wav',
  './sounds/effects/portal-open.wav',
  './sounds/effects/radio-static.wav',
  
  // Áudios - Música
  './sounds/music/main-theme.mp3',
  './sounds/music/upside-down.mp3',
  './sounds/music/suspense.mp3',
  './sounds/music/victory.mp3',
  './sounds/music/lab-them.mp3',
  
  // Áudios - Ambiente
  './sounds/ambient/forest.mp3',
  './sounds/ambient/hawkins.mp3',
  './sounds/ambient/lab.mp3',
  './sounds/ambient/upside-down.mp3'
];

const ALL_ASSETS = [...ESSENTIAL_ASSETS, ...MEDIA_ASSETS];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching essential assets...');
        return cache.addAll(ESSENTIAL_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Essential assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Cache installation failed:', error);
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna do cache se disponível
        if (response) {
          return response;
        }
        
        // Senão, busca na rede
        return fetch(event.request)
          .then((response) => {
            // Verifica se é uma resposta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clona a resposta
            const responseToCache = response.clone();
            
            // Adiciona ao cache se for um asset conhecido
            const requestPath = event.request.url.replace(self.location.origin, '').replace(/^\/[^\/]*/, '.');
            if (ALL_ASSETS.some(asset => requestPath.endsWith(asset.replace('./', '')))) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return response;
          })
          .catch(() => {
            // Fallback para offline
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Mensagem para cache de assets de mídia
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_MEDIA_ASSETS') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('Service Worker: Caching media assets...');
          return cache.addAll(MEDIA_ASSETS);
        })
        .then(() => {
          console.log('Service Worker: Media assets cached');
          event.ports[0].postMessage({ success: true });
        })
        .catch((error) => {
          console.error('Service Worker: Media cache failed:', error);
          event.ports[0].postMessage({ success: false, error: error.message });
        })
    );
  }
});

// Progresso de cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_ASSETS_WITH_PROGRESS') {
    const assets = event.data.assets || MEDIA_ASSETS;
    let cached = 0;
    
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(async (cache) => {
          for (const asset of assets) {
            try {
              await cache.add(asset);
              cached++;
              
              // Envia progresso
              event.ports[0].postMessage({
                type: 'CACHE_PROGRESS',
                progress: cached / assets.length,
                cached,
                total: assets.length
              });
            } catch (error) {
              console.warn('Failed to cache:', asset, error);
            }
          }
          
          event.ports[0].postMessage({
            type: 'CACHE_COMPLETE',
            success: true
          });
        })
    );
  }
});