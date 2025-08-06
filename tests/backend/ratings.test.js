const request = require('supertest');
const { createTestApp } = require('../test-app');
const { seedTestData, closeTestDatabase } = require('../test-db');

describe('Ratings API', () => {
  let app;
  let server;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app.testDb) {
      await closeTestDatabase(app.testDb);
    }
  });

  describe('GET /api/ratings/:trackId', () => {
    beforeEach(async () => {
      // Seed test data before each test
      await seedTestData(app.testDb);
    });

    test('should return rating stats for existing track', async () => {
      const response = await request(app)
        .get('/api/ratings/track1')
        .expect(200);

      expect(response.body).toEqual({
        stats: {
          love: 1,
          happy: 1,
          sad: 0,
          angry: 0
        },
        total: 2
      });
    });

    test('should return zero stats for non-existent track', async () => {
      const response = await request(app)
        .get('/api/ratings/nonexistent')
        .expect(200);

      expect(response.body).toEqual({
        stats: {
          love: 0,
          happy: 0,
          sad: 0,
          angry: 0
        },
        total: 0
      });
    });

    test('should handle encoded track IDs', async () => {
      const trackId = 'track with spaces';
      // First, add a rating for this track
      await request(app)
        .post('/api/ratings')
        .send({
          trackId: trackId,
          artist: 'Test Artist',
          title: 'Test Title',
          rating: 'love'
        });

      const response = await request(app)
        .get(`/api/ratings/${encodeURIComponent(trackId)}`)
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.stats.love).toBe(1);
    });
  });

  describe('GET /api/ratings/:trackId/user', () => {
    test('should return null for user with no rating', async () => {
      const response = await request(app)
        .get('/api/ratings/track1/user')
        .expect(200);

      expect(response.body).toEqual({ rating: null });
    });

    test('should return user rating after submitting one', async () => {
      // Submit a rating first
      await request(app)
        .post('/api/ratings')
        .send({
          trackId: 'track1',
          artist: 'Test Artist',
          title: 'Test Title',
          rating: 'love'
        });

      // Then check user rating
      const response = await request(app)
        .get('/api/ratings/track1/user')
        .expect(200);

      expect(response.body).toEqual({ rating: 'love' });
    });
  });

  describe('POST /api/ratings', () => {
    test('should create new rating successfully', async () => {
      const ratingData = {
        trackId: 'new-track',
        artist: 'New Artist',
        title: 'New Title',
        album: 'New Album',
        rating: 'love'
      };

      const response = await request(app)
        .post('/api/ratings')
        .send(ratingData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        trackId: 'new-track',
        rating: 'love',
        message: 'Rating saved successfully'
      });
      expect(response.body.userFingerprint).toBeDefined();
    });

    test('should update existing rating', async () => {
      const trackId = 'update-track';
      
      // Create initial rating
      await request(app)
        .post('/api/ratings')
        .send({
          trackId: trackId,
          artist: 'Artist',
          title: 'Title',
          rating: 'happy'
        });

      // Update rating
      const response = await request(app)
        .post('/api/ratings')
        .send({
          trackId: trackId,
          artist: 'Artist',
          title: 'Title',
          rating: 'love'
        })
        .expect(200);

      expect(response.body.rating).toBe('love');

      // Verify the rating was updated
      const userRating = await request(app)
        .get(`/api/ratings/${trackId}/user`)
        .expect(200);
      
      expect(userRating.body.rating).toBe('love');
    });

    test('should require all mandatory fields', async () => {
      const testCases = [
        { trackId: 'test', artist: 'Artist', title: 'Title' }, // missing rating
        { artist: 'Artist', title: 'Title', rating: 'love' }, // missing trackId
        { trackId: 'test', title: 'Title', rating: 'love' }, // missing artist
        { trackId: 'test', artist: 'Artist', rating: 'love' } // missing title
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/ratings')
          .send(testCase)
          .expect(400);

        expect(response.body.error).toBe('trackId, artist, title, and rating are required');
      }
    });

    test('should validate rating values', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          trackId: 'test',
          artist: 'Artist',
          title: 'Title',
          rating: 'invalid'
        })
        .expect(400);

      expect(response.body.error).toBe('Rating must be one of: love, happy, sad, angry');
    });

    test('should allow all valid rating values', async () => {
      const validRatings = ['love', 'happy', 'sad', 'angry'];
      
      for (const rating of validRatings) {
        const response = await request(app)
          .post('/api/ratings')
          .send({
            trackId: `test-${rating}`,
            artist: 'Artist',
            title: 'Title',
            rating: rating
          })
          .expect(200);

        expect(response.body.rating).toBe(rating);
      }
    });

    test('should handle optional album field', async () => {
      // Test without album
      const response1 = await request(app)
        .post('/api/ratings')
        .send({
          trackId: 'no-album',
          artist: 'Artist',
          title: 'Title',
          rating: 'love'
        })
        .expect(200);

      expect(response1.body.success).toBe(true);

      // Test with album
      const response2 = await request(app)
        .post('/api/ratings')
        .send({
          trackId: 'with-album',
          artist: 'Artist',
          title: 'Title',
          album: 'Album Name',
          rating: 'love'
        })
        .expect(200);

      expect(response2.body.success).toBe(true);
    });
  });

  describe('DELETE /api/ratings/:trackId/user', () => {
    test('should delete existing rating', async () => {
      const trackId = 'delete-test';
      
      // Create rating first
      await request(app)
        .post('/api/ratings')
        .send({
          trackId: trackId,
          artist: 'Artist',
          title: 'Title',
          rating: 'love'
        });

      // Delete rating
      const response = await request(app)
        .delete(`/api/ratings/${trackId}/user`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        deleted: true,
        message: 'Rating deleted'
      });

      // Verify rating is gone
      const userRating = await request(app)
        .get(`/api/ratings/${trackId}/user`)
        .expect(200);
      
      expect(userRating.body.rating).toBe(null);
    });

    test('should handle deleting non-existent rating', async () => {
      const response = await request(app)
        .delete('/api/ratings/nonexistent/user')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        deleted: false,
        message: 'No rating found to delete'
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Close the database to simulate error
      await closeTestDatabase(app.testDb);
      
      const response = await request(app)
        .get('/api/ratings/test')
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });
});