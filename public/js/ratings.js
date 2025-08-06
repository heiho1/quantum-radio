import { DOM } from './dom.js';
import { currentTrackId } from './metadata.js';

// Global state
let trackRatings = {};
let trackStats = {};

const RATING_TEXTS = {
    FEEDBACK: {
        love: "You loved this track! 😍",
        happy: "You liked this track! 😊", 
        sad: "You didn't like this track 😢",
        angry: "You hated this track 😠"
    },
    CONFIRMATION: {
        love: "Thanks for the love! 😍",
        happy: "Glad you like it! 😊",
        sad: "Sorry you didn't enjoy it 😢",
        angry: "We'll note your feedback 😠"
    }
};

export function clearRatingSelection() {
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
}

export function showPreviousRating(rating) {
    clearRatingSelection();
    const btn = document.querySelector(`[data-rating="${rating}"]`);
    if (btn) {
        btn.classList.add('selected');
        DOM.ratingFeedback.textContent = RATING_TEXTS.FEEDBACK[rating];
    }
}

export async function updateRatingStats() {
    if (!currentTrackId) {
        DOM.totalRatings.textContent = '0 ratings';
        DOM.loveCount.textContent = '😍 0';
        DOM.happyCount.textContent = '😊 0';
        DOM.sadCount.textContent = '😢 0';
        DOM.angryCount.textContent = '😠 0';
        return;
    }
    
    try {
        const response = await fetch(`/api/ratings/${encodeURIComponent(currentTrackId)}`);
        const data = await response.json();
        
        if (response.ok) {
            const stats = data.stats;
            const total = data.total;
            
            DOM.totalRatings.textContent = `${total} rating${total !== 1 ? 's' : ''}`;
            DOM.loveCount.textContent = `😍 ${stats.love}`;
            DOM.happyCount.textContent = `😊 ${stats.happy}`;
            DOM.sadCount.textContent = `😢 ${stats.sad}`;
            DOM.angryCount.textContent = `😠 ${stats.angry}`;
            
            // Store stats locally for quick reference
            trackStats[currentTrackId] = stats;
        } else {
            console.error('Failed to fetch ratings:', data.error);
        }
    } catch (error) {
        console.error('Error fetching ratings:', error);
        // Fallback to showing 0s
        DOM.totalRatings.textContent = '0 ratings';
        DOM.loveCount.textContent = '😍 0';
        DOM.happyCount.textContent = '😊 0';
        DOM.sadCount.textContent = '😢 0';
        DOM.angryCount.textContent = '😠 0';
    }
}

export async function loadUserRating() {
    if (!currentTrackId) return;
    
    try {
        const response = await fetch(`/api/ratings/${encodeURIComponent(currentTrackId)}/user`);
        const data = await response.json();
        
        if (response.ok && data.rating) {
            showPreviousRating(data.rating);
            trackRatings[currentTrackId] = data.rating;
        }
    } catch (error) {
        console.error('Error loading user rating:', error);
    }
}

export async function rateTrack(rating) {
    if (!currentTrackId) return;
    
    try {
        // Get current track metadata from the DOM
        const artist = DOM.trackArtist.textContent;
        const title = DOM.trackTitle.textContent;
        const album = DOM.trackAlbum.textContent;
        
        if (!artist || !title) {
            console.error('Missing track information');
            return;
        }
        
        // Send rating to server (server handles user identification via fingerprinting)
        const response = await fetch('/api/ratings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                trackId: currentTrackId,
                artist: artist,
                title: title,
                album: album || null,
                rating: rating
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store the new rating locally
            trackRatings[currentTrackId] = rating;
            
            // Update UI
            clearRatingSelection();
            const btn = document.querySelector(`[data-rating="${rating}"]`);
            if (btn) {
                btn.classList.add('selected');
            }
            
            // Show feedback
            DOM.ratingFeedback.textContent = RATING_TEXTS.CONFIRMATION[rating];
            
            // Update stats display
            await updateRatingStats();
            
            console.log(`Successfully rated "${currentTrackId}" as ${rating} (fingerprint: ${data.userFingerprint})`);
        } else {
            console.error('Failed to save rating:', data.error);
            DOM.ratingFeedback.textContent = 'Failed to save rating. Please try again.';
        }
    } catch (error) {
        console.error('Error saving rating:', error);
        DOM.ratingFeedback.textContent = 'Network error. Please try again.';
    }
}

export function initializeRatingButtons() {
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const rating = btn.getAttribute('data-rating');
            rateTrack(rating);
        });
    });
}