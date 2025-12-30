/**
 * API Service
 * Handles all API communication with the backend
 */

const API_BASE = '/api';

class ApiService {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Request failed');
    }

    return data;
  }

  // Auth endpoints
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async register(email, password, companyName) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, companyName })
    });
  }

  async getProfile() {
    return this.request('/auth/me');
  }

  async updateProfile(data) {
    return this.request('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Location endpoints
  async getLocations() {
    return this.request('/locations');
  }

  async getLocation(id) {
    return this.request(`/locations/${id}`);
  }

  async createLocation(data) {
    return this.request('/locations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateLocation(id, data) {
    return this.request(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteLocation(id) {
    return this.request(`/locations/${id}`, {
      method: 'DELETE'
    });
  }

  // Landmark endpoints
  async getLandmarks(locationId) {
    return this.request(`/locations/${locationId}/landmarks`);
  }

  async refreshLandmarks(locationId) {
    return this.request(`/locations/${locationId}/refresh-landmarks`, {
      method: 'POST'
    });
  }

  // Content endpoints
  async getContentHistory(locationId, type = null) {
    const query = type ? `?type=${type}` : '';
    return this.request(`/locations/${locationId}/content${query}`);
  }

  async generateGBPPost(locationId, options = {}) {
    return this.request(`/locations/${locationId}/content/gbp-post`, {
      method: 'POST',
      body: JSON.stringify(options)
    });
  }

  async generateLocationPage(locationId) {
    return this.request(`/locations/${locationId}/content/location-page`, {
      method: 'POST'
    });
  }

  async generateSocialPosts(locationId, count = 3) {
    return this.request(`/locations/${locationId}/content/social-posts`, {
      method: 'POST',
      body: JSON.stringify({ count })
    });
  }

  async deleteContent(id) {
    return this.request(`/content/${id}`, {
      method: 'DELETE'
    });
  }

  async updateContentStatus(id, status) {
    return this.request(`/content/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  // Review endpoints
  async getReviews(locationId, pending = false) {
    const query = pending ? '?pending=true' : '';
    return this.request(`/locations/${locationId}/reviews${query}`);
  }

  async addReview(locationId, data) {
    return this.request(`/locations/${locationId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async generateReviewResponse(locationId, reviewId, options = {}) {
    return this.request(`/locations/${locationId}/reviews/${reviewId}/generate-response`, {
      method: 'POST',
      body: JSON.stringify(options)
    });
  }

  async saveReviewResponse(locationId, reviewId, responseText) {
    return this.request(`/locations/${locationId}/reviews/${reviewId}/response`, {
      method: 'PUT',
      body: JSON.stringify({ responseText })
    });
  }

  async deleteReview(locationId, reviewId) {
    return this.request(`/locations/${locationId}/reviews/${reviewId}`, {
      method: 'DELETE'
    });
  }

  // Citation/Audit endpoints
  async getCitations(locationId) {
    return this.request(`/locations/${locationId}/citations`);
  }

  async updateCitation(locationId, citationId, data) {
    return this.request(`/locations/${locationId}/citations/${citationId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async getAuditSummary(locationId) {
    return this.request(`/locations/${locationId}/audit-summary`);
  }
}

export const api = new ApiService();
