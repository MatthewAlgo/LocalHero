/**
 * Test Setup
 * Configure test environment and utilities
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

// Create an in-memory mock database
const mockDb = {
  prepare: jest.fn(() => ({
    run: jest.fn(() => ({ lastInsertRowid: 1, changes: 1 })),
    get: jest.fn(),
    all: jest.fn(() => [])
  })),
  exec: jest.fn(),
  pragma: jest.fn(),
  transaction: jest.fn((fn) => fn)
};

// Mock the database module
jest.mock('../src/config/database', () => mockDb);

// Mock external APIs
jest.mock('../src/services/placesService', () => ({
  PlacesService: jest.fn().mockImplementation(() => ({
    geocodeAddress: jest.fn().mockResolvedValue({
      latitude: 30.2672,
      longitude: -97.7431,
      formattedAddress: '123 Main St, Austin, TX 78704'
    }),
    fetchAllLandmarks: jest.fn().mockResolvedValue({
      landmarks: [
        { placeId: 'place1', name: 'Austin High School', type: 'school', category: 'education' },
        { placeId: 'place2', name: 'Zilker Park', type: 'park', category: 'recreation' },
        { placeId: 'place3', name: 'Barton Springs Mall', type: 'shopping_mall', category: 'shopping' }
      ],
      stats: { total: 3, byType: { school: 1, park: 1, shopping_mall: 1 } },
      errors: null
    })
  })),
  createPlacesService: jest.fn().mockImplementation(() => ({
    geocodeAddress: jest.fn().mockResolvedValue({
      latitude: 30.2672,
      longitude: -97.7431,
      formattedAddress: '123 Main St, Austin, TX 78704'
    }),
    fetchAllLandmarks: jest.fn().mockResolvedValue({
      landmarks: [
        { placeId: 'place1', name: 'Austin High School', type: 'school', category: 'education' },
        { placeId: 'place2', name: 'Zilker Park', type: 'park', category: 'recreation' }
      ],
      stats: { total: 2 },
      errors: null
    })
  }))
}));

jest.mock('../src/services/geminiService', () => ({
  GeminiService: jest.fn().mockImplementation(() => ({
    generateGBPPost: jest.fn().mockResolvedValue({
      content: 'Test GBP post content mentioning local landmarks.',
      landmarksUsed: ['Austin High School', 'Zilker Park'],
      tokensUsed: 150
    }),
    generateLocationPage: jest.fn().mockResolvedValue({
      content: '# Plumbing in Austin, TX\n\nTest location page content.',
      landmarksUsed: ['Austin High School'],
      tokensUsed: 300
    }),
    generateReviewResponse: jest.fn().mockResolvedValue({
      response: 'Thank you for your kind review! We appreciate your business.',
      tokensUsed: 50
    }),
    generateSocialPosts: jest.fn().mockResolvedValue({
      posts: '1. Test social post #1\n2. Test social post #2\n3. Test social post #3',
      tokensUsed: 75
    })
  })),
  createGeminiService: jest.fn().mockImplementation(() => ({
    generateGBPPost: jest.fn().mockResolvedValue({
      content: 'Test GBP post content.',
      landmarksUsed: ['Test Landmark'],
      tokensUsed: 100
    }),
    generateLocationPage: jest.fn().mockResolvedValue({
      content: 'Test location page.',
      landmarksUsed: [],
      tokensUsed: 200
    }),
    generateReviewResponse: jest.fn().mockResolvedValue({
      response: 'Thank you for your review!',
      tokensUsed: 50
    }),
    generateSocialPosts: jest.fn().mockResolvedValue({
      posts: 'Test social posts list',
      tokensUsed: 75
    })
  }))
}));

// Export mock db for tests that need it
module.exports = { mockDb };
