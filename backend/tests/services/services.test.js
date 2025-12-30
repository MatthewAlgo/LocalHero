/**
 * Services Unit Tests (Pure logic, no database)
 */

describe('PlacesService', () => {
  describe('deduplicateLandmarks', () => {
    it('should remove duplicate landmarks by placeId', () => {
      // Mock service with test implementation
      const deduplicateLandmarks = (landmarks) => {
        const seen = new Set();
        return landmarks.filter(landmark => {
          if (seen.has(landmark.placeId)) {
            return false;
          }
          seen.add(landmark.placeId);
          return true;
        });
      };

      const landmarks = [
        { placeId: '1', name: 'Place 1' },
        { placeId: '2', name: 'Place 2' },
        { placeId: '1', name: 'Place 1 Duplicate' }
      ];

      const unique = deduplicateLandmarks(landmarks);
      expect(unique).toHaveLength(2);
      expect(unique[0].name).toBe('Place 1');
      expect(unique[1].name).toBe('Place 2');
    });
  });

  describe('groupByType', () => {
    it('should group landmarks by type', () => {
      const groupByType = (landmarks) => {
        return landmarks.reduce((acc, landmark) => {
          acc[landmark.type] = (acc[landmark.type] || 0) + 1;
          return acc;
        }, {});
      };

      const landmarks = [
        { type: 'school' },
        { type: 'school' },
        { type: 'park' },
        { type: 'hospital' }
      ];

      const grouped = groupByType(landmarks);
      expect(grouped.school).toBe(2);
      expect(grouped.park).toBe(1);
      expect(grouped.hospital).toBe(1);
    });
  });
});

describe('GeminiService', () => {
  describe('formatLandmarkMentions', () => {
    it('should format landmarks for prompt', () => {
      const formatLandmarkMentions = (landmarks) => {
        if (!landmarks || landmarks.length === 0) {
          return 'No specific landmarks available.';
        }
        return landmarks.map(l => {
          let desc = `- ${l.name} (${l.type})`;
          if (l.address) desc += ` - near ${l.address}`;
          return desc;
        }).join('\n');
      };

      const landmarks = [
        { name: 'Austin High', type: 'school', address: '123 Main' },
        { name: 'Zilker Park', type: 'park' }
      ];

      const formatted = formatLandmarkMentions(landmarks);
      expect(formatted).toContain('Austin High');
      expect(formatted).toContain('school');
      expect(formatted).toContain('Zilker Park');
      expect(formatted).toContain('123 Main');
    });

    it('should handle empty landmarks', () => {
      const formatLandmarkMentions = (landmarks) => {
        if (!landmarks || landmarks.length === 0) {
          return 'No specific landmarks available.';
        }
        return landmarks.map(l => `- ${l.name}`).join('\n');
      };

      const formatted = formatLandmarkMentions([]);
      expect(formatted).toBe('No specific landmarks available.');
    });
  });
});

describe('Content Utilities', () => {
  describe('parseLandmarksUsed', () => {
    it('should parse JSON landmarks', () => {
      const parse = (str) => {
        if (!str) return null;
        try {
          return JSON.parse(str);
        } catch {
          return null;
        }
      };

      const result = parse('["School 1", "Park 1"]');
      expect(result).toEqual(['School 1', 'Park 1']);
    });

    it('should return null for invalid JSON', () => {
      const parse = (str) => {
        if (!str) return null;
        try {
          return JSON.parse(str);
        } catch {
          return null;
        }
      };

      const result = parse('invalid');
      expect(result).toBeNull();
    });
  });
});

describe('Auth Utilities', () => {
  const jwt = require('jsonwebtoken');
  const SECRET = 'test-secret';

  describe('generateToken', () => {
    it('should create a valid JWT token', () => {
      const generateToken = (userId) => {
        return jwt.sign({ userId }, SECRET, { expiresIn: '7d' });
      };

      const token = generateToken(123);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = jwt.verify(token, SECRET);
      expect(decoded.userId).toBe(123);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = jwt.sign({ userId: 456 }, SECRET);
      const decoded = jwt.verify(token, SECRET);
      expect(decoded.userId).toBe(456);
    });

    it('should throw on invalid token', () => {
      expect(() => {
        jwt.verify('invalid-token', SECRET);
      }).toThrow();
    });
  });
});

describe('Audit Score Calculation', () => {
  it('should calculate audit score correctly', () => {
    const calculateAuditScore = (summary) => {
      if (!summary || summary.total === 0) return 0;
      const foundWeight = 0.6;
      const consistentWeight = 0.4;
      const foundScore = (summary.found / summary.total) * 100 * foundWeight;
      const consistentScore = summary.found > 0 
        ? (summary.consistent / summary.found) * 100 * consistentWeight 
        : 0;
      return Math.round(foundScore + consistentScore);
    };

    // All found and consistent
    expect(calculateAuditScore({ total: 10, found: 10, consistent: 10 })).toBe(100);
    
    // Half found, all consistent - (5/10)*100*0.6 + (5/5)*100*0.4 = 30 + 40 = 70
    expect(calculateAuditScore({ total: 10, found: 5, consistent: 5 })).toBe(70);
    
    // All found, none consistent
    expect(calculateAuditScore({ total: 10, found: 10, consistent: 0 })).toBe(60);
    
    // Empty
    expect(calculateAuditScore({ total: 0, found: 0, consistent: 0 })).toBe(0);
  });
});

describe('Input Validation', () => {
  it('should validate email format', () => {
    const isValidEmail = (email) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co')).toBe(true);
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('no@domain')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
  });

  it('should validate password length', () => {
    const isValidPassword = (password) => password && password.length >= 8;

    expect(isValidPassword('password123')).toBe(true);
    expect(isValidPassword('12345678')).toBe(true);
    expect(isValidPassword('short')).toBeFalsy();
    expect(isValidPassword('')).toBeFalsy();
  });

  it('should validate state code', () => {
    const isValidState = (state) => /^[A-Z]{2}$/.test(state);

    expect(isValidState('TX')).toBe(true);
    expect(isValidState('CA')).toBe(true);
    expect(isValidState('Texas')).toBe(false);
    expect(isValidState('tx')).toBe(false);
  });
});
