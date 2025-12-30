/**
 * API Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../src/services/api';

describe('API Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.setToken(null);
    global.fetch = vi.fn();
  });

  describe('setToken', () => {
    it('stores the token', () => {
      api.setToken('test-token');
      expect(api.token).toBe('test-token');
    });
  });

  describe('request', () => {
    it('includes authorization header when token is set', async () => {
      api.setToken('test-token');
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await api.request('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

    it('throws error on non-ok response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Test error' })
      });

      await expect(api.request('/test')).rejects.toThrow('Test error');
    });
  });

  describe('login', () => {
    it('makes POST request with credentials', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: 'jwt-token', user: { id: 1 } })
      });

      const result = await api.login('test@example.com', 'password');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'password' })
        })
      );
      expect(result.token).toBe('jwt-token');
    });
  });

  describe('getLocations', () => {
    it('fetches locations', async () => {
      const mockLocations = [{ id: 1, business_name: 'Test' }];
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ locations: mockLocations })
      });

      const result = await api.getLocations();

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/locations',
        expect.any(Object)
      );
      expect(result.locations).toEqual(mockLocations);
    });
  });

  describe('createLocation', () => {
    it('makes POST request with location data', async () => {
      const locationData = {
        businessName: 'Test Business',
        address: '123 Main St',
        city: 'Austin',
        state: 'TX',
        zipCode: '78704',
        serviceType: 'Plumbing'
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ location: { id: 1, ...locationData } })
      });

      await api.createLocation(locationData);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/locations',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(locationData)
        })
      );
    });
  });

  describe('generateGBPPost', () => {
    it('makes POST request to generate content', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: { body: 'Generated content' } })
      });

      await api.generateGBPPost(1, { tone: 'professional' });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/locations/1/content/gbp-post',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ tone: 'professional' })
        })
      );
    });
  });
});
