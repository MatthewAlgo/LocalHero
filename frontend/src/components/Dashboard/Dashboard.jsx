import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

export default function Dashboard() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const totalLandmarks = locations.reduce((sum, loc) => sum + (loc.stats?.landmarkCount || 0), 0);
  const totalContent = locations.reduce((sum, loc) => sum + (loc.stats?.contentCount || 0), 0);
  const totalReviews = locations.reduce((sum, loc) => sum + (loc.stats?.reviewCount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your local SEO performance</p>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <div className="stat-value">{locations.length}</div>
            <div className="stat-label">Locations</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon accent">🏫</div>
          <div className="stat-content">
            <div className="stat-value">{totalLandmarks}</div>
            <div className="stat-label">Landmarks Cached</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-value">{totalContent}</div>
            <div className="stat-label">Content Generated</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon warning">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{totalReviews}</div>
            <div className="stat-label">Reviews Managed</div>
          </div>
        </div>
      </div>

      {/* Recent Locations */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Locations</h2>
          <Link to="/locations" className="btn btn-secondary btn-sm">
            View All
          </Link>
        </div>

        {locations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📍</div>
            <h3 className="empty-title">No locations yet</h3>
            <p className="empty-description">
              Add your first business location to start generating local content.
            </p>
            <Link to="/locations" className="btn btn-primary">
              Add Location
            </Link>
          </div>
        ) : (
          <div className="locations-grid">
            {locations.slice(0, 4).map(location => (
              <Link 
                key={location.id}
                to={`/locations/${location.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="location-card">
                  <div className="location-header">
                    <div>
                      <div className="location-name">{location.business_name}</div>
                      <div className="location-address">
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
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {locations.length > 0 && (
        <div className="card mt-6">
          <h2 className="card-title mb-4">Quick Actions</h2>
          <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
            <Link to={`/locations/${locations[0].id}/content`} className="btn btn-primary">
              Generate Content
            </Link>
            <Link to={`/locations/${locations[0].id}/reviews`} className="btn btn-secondary">
              Respond to Reviews
            </Link>
            <Link to="/locations" className="btn btn-secondary">
              Add New Location
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
