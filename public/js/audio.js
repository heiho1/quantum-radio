import { CONFIG } from './config.js';
import { DOM } from './dom.js';
import { startMetadataUpdates, stopMetadataUpdates } from './metadata.js';

// Global state
let hls = null;

export function initializeHLS() {
    if (Hls.isSupported()) {
        hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
        });
        
        hls.loadSource(CONFIG.streamUrl);
        hls.attachMedia(DOM.audio);
        
        hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS error:', data);
            if (data.fatal) {
                switch(data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        hls.recoverMediaError();
                        break;
                    default:
                        hls.destroy();
                        setTimeout(initializeHLS, 3000);
                        break;
                }
            }
        });
        
    } else if (DOM.audio.canPlayType('application/vnd.apple.mpegurl')) {
        DOM.audio.src = CONFIG.streamUrl;
    }
}

export function initializeAudioEvents() {
    DOM.audio.addEventListener('play', () => {
        startMetadataUpdates();
    });

    DOM.audio.addEventListener('pause', () => {
        stopMetadataUpdates();
    });

    DOM.audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
    });

    DOM.audio.volume = CONFIG.defaultVolume;
}