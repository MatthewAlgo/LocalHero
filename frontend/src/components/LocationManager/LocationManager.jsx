import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

export default function LocationManager() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    serviceType: '',
    keywords: '',
    radiusMiles: 5
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const data = await api.getLocations();
      setLocations(data.locations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.createLocation(formData);
      setShowModal(false);
      setFormData({
        businessName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        serviceType: '',
        keywords: '',
        radiusMiles: 5
      });
      fetchLocations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    
    try {
      await api.deleteLocation(id);
      fetchLocations();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Locations</h1>
          <p className="page-subtitle">Manage your business locations</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          + Add Location
        </button>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {locations.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📍</div>
            <h3 className="empty-title">No locations yet</h3>
            <p className="empty-description">
              Add your first business location to start generating hyper-local content.
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              Add Your First Location
            </button>
          </div>
        </div>
      ) : (
        <div className="locations-grid">
          {locations.map(location => (
            <div key={location.id} className="location-card">
              <div className="location-header">
                <div>
                  <div className="location-name">{location.business_name}</div>
                  <div className="location-address">
                    {location.address}<br />
                    {location.city}, {location.state} {location.zip_code}
                  </div>
                </div>
                <span className="location-badge">{location.service_type}</span>
              </div>
              
              <div className="location-stats">
                <div className="location-stat">
                  <span className="location-stat-value">{location.stats?.landmarkCount || 0}</span>
                  <span className="location-stat-label"> landmarks</span>
                </div>
                <div className="location-stat">
                  <span className="location-stat-value">{location.stats?.contentCount || 0}</span>
                  <span className="location-stat-label"> posts</span>
                </div>
                <div className="location-stat">
                  <span className="location-stat-value">{location.stats?.reviewCount || 0}</span>
                  <span className="location-stat-label"> reviews</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Link 
                  to={`/locations/${location.id}`}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                >
                  View Details
                </Link>
                <Link 
                  to={`/locations/${location.id}/content`}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                >
                  Generate Content
                </Link>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleDelete(location.id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Location Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Location</h2>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Business Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="Acme Plumbing Services"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Service Type *</label>
                  <input
                    type="text"
                    className="form-input"
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleInputChange}
                    placeholder="Plumbing, HVAC, Roofing, etc."
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Street Address *</label>
                  <input
                    type="text"
                    className="form-input"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main Street"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      className="form-input"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Austin"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <input
                      type="text"
                      className="form-input"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="TX"
                      maxLength={2}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">ZIP *</label>
                    <input
                      type="text"
                      className="form-input"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      placeholder="78704"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Keywords (comma-separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    name="keywords"
                    value={formData.keywords}
                    onChange={handleInputChange}
                    placeholder="water heater repair, drain cleaning, emergency plumber"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Service Radius (miles)</label>
                  <input
                    type="number"
                    className="form-input"
                    name="radiusMiles"
                    value={formData.radiusMiles}
                    onChange={handleInputChange}
                    min={1}
                    max={50}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
