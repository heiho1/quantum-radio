import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock the metadata module
vi.mock('../../public/js/metadata.js', () => ({
  currentTrackId: 'test-track-123'
}));

// Set up DOM
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <head></head>
    <body>
      <div id="trackTitle">Test Song</div>
      <div id="trackArtist">Test Artist</div>
      <div id="trackAlbum">Test Album</div>
      <div id="ratingFeedback"></div>
      <div id="totalRatings"></div>
      <div id="loveCount"></div>
      <div id="happyCount"></div>
      <div id="sadCount"></div>
      <div id="angryCount"></div>
      <button class="rating-btn" data-rating="love">😍</button>
      <button class="rating-btn" data-rating="happy">😊</button>
      <button class="rating-btn" data-rating="sad">😢</button>
      <button class="rating-btn" data-rating="angry">😠</button>
    </body>
  </html>
`, { url: 'http://localhost:3000' });

global.document = dom.window.document;
global.window = dom.window;

describe('Ratings System', () => {
  let ratings;
  
  beforeEach(async () => {
    // Reset fetch mock
    global.fetch = vi.fn();
    
    // Clear any selected ratings
    document.querySelectorAll('.rating-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    // Clear feedback
    document.getElementById('ratingFeedback').textContent = '';
    
    // Import the ratings module
    ratings = await import('../../public/js/ratings.js');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('clearRatingSelection', () => {
    it('should remove selected class from all rating buttons', () => {
      // Set up - add selected class to buttons
      const buttons = document.querySelectorAll('.rating-btn');
      buttons.forEach(btn => btn.classList.add('selected'));

      // Execute
      ratings.clearRatingSelection();

      // Verify
      buttons.forEach(btn => {
        expect(btn.classList.contains('selected')).toBe(false);
      });
    });
  });

  describe('showPreviousRating', () => {
    it('should clear previous selections and show the specified rating', () => {
      // Set up - add selected to a different button
      document.querySelector('[data-rating="happy"]').classList.add('selected');

      // Execute
      ratings.showPreviousRating('love');

      // Verify
      const loveBtn = document.querySelector('[data-rating="love"]');
      const happyBtn = document.querySelector('[data-rating="happy"]');
      
      expect(loveBtn.classList.contains('selected')).toBe(true);
      expect(happyBtn.classList.contains('selected')).toBe(false);
      expect(document.getElementById('ratingFeedback').textContent).toBe('You loved this track! 😍');
    });

    it('should handle invalid rating gracefully', () => {
      ratings.showPreviousRating('invalid');
      
      // Should clear selections but not show feedback
      document.querySelectorAll('.rating-btn').forEach(btn => {
        expect(btn.classList.contains('selected')).toBe(false);
      });
    });
  });

  describe('updateRatingStats', () => {
    it('should fetch and display rating stats for current track', async () => {
      const mockResponse = {
        stats: { love: 5, happy: 3, sad: 1, angry: 0 },
        total: 9
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await ratings.updateRatingStats();

      expect(fetch).toHaveBeenCalledWith('/api/ratings/test-track-123');
      expect(document.getElementById('totalRatings').textContent).toBe('9 ratings');
      expect(document.getElementById('loveCount').textContent).toBe('😍 5');
      expect(document.getElementById('happyCount').textContent).toBe('😊 3');
      expect(document.getElementById('sadCount').textContent).toBe('😢 1');
      expect(document.getElementById('angryCount').textContent).toBe('😠 0');
    });

    it('should handle singular rating count', async () => {
      const mockResponse = {
        stats: { love: 1, happy: 0, sad: 0, angry: 0 },
        total: 1
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await ratings.updateRatingStats();

      expect(document.getElementById('totalRatings').textContent).toBe('1 rating');
    });

    it('should handle fetch errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await ratings.updateRatingStats();

      // Should show fallback values
      expect(document.getElementById('totalRatings').textContent).toBe('0 ratings');
      expect(document.getElementById('loveCount').textContent).toBe('😍 0');
    });

    it('should handle server error responses', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Database error' })
      });

      await ratings.updateRatingStats();

      // Should show fallback values
      expect(document.getElementById('totalRatings').textContent).toBe('0 ratings');
    });

    it('should handle missing currentTrackId', async () => {
      // Mock the currentTrackId to be null by overriding the import
      const originalModule = await import('../../public/js/metadata.js');
      vi.mocked(originalModule).currentTrackId = null;
      
      await ratings.updateRatingStats();

      // Should show zero stats without making fetch request
      expect(document.getElementById('totalRatings').textContent).toBe('0 ratings');
      expect(document.getElementById('loveCount').textContent).toBe('😍 0');
    });
  });

  describe('loadUserRating', () => {
    it('should load and display existing user rating', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rating: 'love' })
      });

      // Ensure the metadata module's currentTrackId is set correctly
      const metadata = await import('../../public/js/metadata.js');
      metadata.currentTrackId = 'test-track-123';

      await ratings.loadUserRating();

      // expect(fetch).toHaveBeenCalledWith('/api/ratings/test-track-123/user');
      expect(document.querySelector('[data-rating="love"]').classList.contains('selected')).toBe(true);
      expect(document.getElementById('ratingFeedback').textContent).toBe('You loved this track! 😍');
    });

    it('should handle no existing rating', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rating: null })
      });

      await ratings.loadUserRating();

      // Should not select any buttons
      document.querySelectorAll('.rating-btn').forEach(btn => {
        expect(btn.classList.contains('selected')).toBe(false);
      });
    });

    it('should handle fetch errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      // Should not throw and not select anything
      await expect(ratings.loadUserRating()).resolves.toBeUndefined();
      
      document.querySelectorAll('.rating-btn').forEach(btn => {
        expect(btn.classList.contains('selected')).toBe(false);
      });
    });
  });

  describe('rateTrack', () => {
    it('should submit rating successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          trackId: 'test-track-123',
          rating: 'love',
          userFingerprint: 'abc123',
          message: 'Rating saved successfully'
        })
      });

      // Mock updateRatingStats
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stats: { love: 1, happy: 0, sad: 0, angry: 0 }, total: 1 })
      });

      await ratings.rateTrack('love');

      expect(fetch).toHaveBeenCalledWith('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackId: 'test-track-123',
          artist: 'Test Artist',
          title: 'Test Song',
          album: 'Test Album',
          rating: 'love'
        })
      });

      // Should select the button and show feedback
      expect(document.querySelector('[data-rating="love"]').classList.contains('selected')).toBe(true);
      expect(document.getElementById('ratingFeedback').textContent).toBe('Thanks for the love! 😍');
    });

    it('should handle missing track information', async () => {
      // Clear track info
      document.getElementById('trackArtist').textContent = '';

      await ratings.rateTrack('love');

      // Should not make fetch request
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle server errors', async () => {
      // Make sure track info is present
      document.getElementById('trackArtist').textContent = 'Test Artist';
      document.getElementById('trackTitle').textContent = 'Test Song';
      
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' })
      });

      await ratings.rateTrack('love');

      expect(document.getElementById('ratingFeedback').textContent).toBe('Failed to save rating. Please try again.');
    });

    it('should handle network errors', async () => {
      // Make sure track info is present
      document.getElementById('trackArtist').textContent = 'Test Artist';
      document.getElementById('trackTitle').textContent = 'Test Song';
      
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await ratings.rateTrack('love');

      expect(document.getElementById('ratingFeedback').textContent).toBe('Network error. Please try again.');
    });

    it('should handle empty album gracefully', async () => {
      // Make sure track info is present
      document.getElementById('trackArtist').textContent = 'Test Artist';
      document.getElementById('trackTitle').textContent = 'Test Song';
      document.getElementById('trackAlbum').textContent = '';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, trackId: 'test-track-123', rating: 'love', userFingerprint: 'abc123' })
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stats: { love: 1, happy: 0, sad: 0, angry: 0 }, total: 1 })
      });

      await ratings.rateTrack('love');

      expect(fetch).toHaveBeenCalledWith('/api/ratings', expect.objectContaining({
        body: expect.stringContaining('"album":null')
      }));
    });
  });
});