import { fetchMetadata } from './metadata.js';
import { initializeHLS, initializeAudioEvents } from './audio.js';
import { initializeRatingButtons } from './ratings.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Load initial metadata on page load
    fetchMetadata();
    
    // Initialize audio streaming
    initializeHLS();
    initializeAudioEvents();
    
    // Set up rating button event listeners
    initializeRatingButtons();
});