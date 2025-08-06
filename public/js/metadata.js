import { CONFIG } from './config.js';
import { DOM } from './dom.js';
import { clearRatingSelection, updateRatingStats, loadUserRating } from './ratings.js';

// Global state
export let currentTrackId = null;
let metadataInterval = null;

export async function fetchMetadata() {
    try {
        const response = await fetch(CONFIG.metadataUrl + '?t=' + Date.now());
        const metadata = await response.json();
        
        // Update audio quality
        if (metadata.bit_depth && metadata.sample_rate) {
            DOM.audioQuality.textContent = `${metadata.bit_depth}-bit / ${metadata.sample_rate.toLocaleString()} Hz`;
        }
        
        // Update current track info
        if (metadata.artist && metadata.title) {
            const newTrackId = `${metadata.artist} - ${metadata.title}`;
            const isNewTrack = currentTrackId !== newTrackId;
            
            if (isNewTrack) {
                currentTrackId = newTrackId;
                clearRatingSelection();
                DOM.ratingFeedback.textContent = '';
                await updateRatingStats();
                await loadUserRating();
            }
            
            DOM.trackTitle.textContent = metadata.title;
            DOM.trackArtist.textContent = metadata.artist;
            DOM.trackAlbum.textContent = metadata.album || '';
            
            // Refresh album cover with cache busting to ensure it updates
            DOM.albumCover.src = CONFIG.albumCoverUrl + '?t=' + Date.now();
            DOM.albumCover.style.display = 'block';
            
        } else {
            DOM.trackTitle.textContent = 'No track information available';
            DOM.trackArtist.textContent = '';
            DOM.trackAlbum.textContent = '';
        }
        
        // Update previous tracks list
        updatePreviousTracks(metadata, metadata.bit_depth, metadata.sample_rate);
    } catch (error) {
        console.error('Failed to fetch metadata:', error);
        DOM.trackTitle.textContent = 'Unable to load track information';
        DOM.trackArtist.textContent = '';
        DOM.trackAlbum.textContent = '';
        DOM.previousTracksList.innerHTML = '<div class="loading-metadata">Unable to load previous tracks</div>';
    }
}

function updatePreviousTracks(metadata, bitDepth, sampleRate) {
    const audioQualityText = bitDepth && sampleRate ? `${bitDepth}-bit / ${sampleRate.toLocaleString()} Hz` : 'Unknown Quality';
    
    // Extract previous tracks from metadata structure (prev_artist_1, prev_title_1, etc.)
    const tracks = [];
    for (let i = 1; i <= 5; i++) {
        const artist = metadata[`prev_artist_${i}`];
        const title = metadata[`prev_title_${i}`];
        
        if (artist && title) {
            tracks.push({
                artist: artist,
                title: title,
                album: metadata[`prev_album_${i}`] || ''
            });
        }
    }
    
    if (tracks.length === 0) {
        DOM.previousTracksList.innerHTML = '<div class="loading-metadata">No previous tracks available</div>';
        return;
    }
    
    const tracksHtml = tracks.map(track => `
        <div class="track-item">
            <div class="track-item-title">${track.title}</div>
            <div class="track-item-artist">${track.artist}</div>
            <div class="track-item-album">${track.album || 'Unknown Album'} • ${audioQualityText}</div>
        </div>
    `).join('');
    
    DOM.previousTracksList.innerHTML = tracksHtml;
}

export function startMetadataUpdates() {
    fetchMetadata();
    metadataInterval = setInterval(fetchMetadata, CONFIG.metadataUpdateInterval);
}

export function stopMetadataUpdates() {
    if (metadataInterval) {
        clearInterval(metadataInterval);
        metadataInterval = null;
    }
}