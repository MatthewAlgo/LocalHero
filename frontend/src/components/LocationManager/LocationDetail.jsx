import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import AuditWidget from '../AuditWidget/AuditWidget';

export default function LocationDetail() {
  const { id } = useParams();
  const [location, setLocation] = useState(null);
  const [landmarks, setLandmarks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchLocation();
  }, [id]);

  const fetchLocation = async () => {
    try {
      const data = await api.getLocation(id);
      setLocation(data.location);
      setLandmarks(data.landmarks?.items || []);
      setStats(data.stats || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshLandmarks = async () => {
    setRefreshing(true);
    setError('');
    
    try {
      const data = await api.refreshLandmarks(id);
      setLandmarks(data.landmarks || []);
      fetchLocation();
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!location) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-icon">❌</div>
          <h3 className="empty-title">Location not found</h3>
          <Link to="/locations" className="btn btn-primary">
            Back to Locations
          </Link>
        </div>
      </div>
    );
  }

  // Group landmarks by type
  const landmarksByType = landmarks.reduce((acc, landmark) => {
    const type = landmark.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(landmark);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/locations" className="btn btn-ghost btn-sm">
            ← Back
          </Link>
        </div>
        <h1 className="page-title">{location.business_name}</h1>
        <p className="page-subtitle">
          {location.address}, {location.city}, {location.state} {location.zip_code}
        </p>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏫</div>
          <div className="stat-content">
            <div className="stat-value">{landmarks.length}</div>
            <div className="stat-label">Landmarks</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon accent">📝</div>
          <div className="stat-content">
            <div className="stat-value">{stats.contentCount || 0}</div>
            <div className="stat-label">Posts Generated</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{stats.reviewCount || 0}</div>
            <div className="stat-label">Reviews</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="card mb-6">
        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={handleRefreshLandmarks}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <span className="loading-spinner" style={{ width: 16, height: 16 }} />
                <span>Fetching...</span>
              </>
            ) : (
              '🔄 Refresh Landmarks'
            )}
          </button>
          <Link to={`/locations/${id}/content`} className="btn btn-primary">
            ✨ Generate Content
          </Link>
          <Link to={`/locations/${id}/reviews`} className="btn btn-secondary">
            💬 Manage Reviews
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'landmarks' ? 'active' : ''}`}
          onClick={() => setActiveTab('landmarks')}
        >
          Landmarks ({landmarks.length})
        </button>
        <button 
          className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          Citation Audit
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="card">
          <h3 className="card-title mb-4">Business Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div>
              <div className="text-sm text-muted">Service Type</div>
              <div className="font-semibold">{location.service_type}</div>
            </div>
            <div>
              <div className="text-sm text-muted">Keywords</div>
              <div className="font-semibold">{location.keywords || 'None set'}</div>
            </div>
            <div>
              <div className="text-sm text-muted">Service Radius</div>
              <div className="font-semibold">{location.radius_miles || 5} miles</div>
            </div>
            <div>
              <div className="text-sm text-muted">Coordinates</div>
              <div className="font-semibold">
                {location.latitude && location.longitude 
                  ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                  : 'Not geocoded'}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'landmarks' && (
        <div className="card">
          {landmarks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏫</div>
              <h3 className="empty-title">No landmarks cached</h3>
              <p className="empty-description">
                Fetch landmarks from Google Places to enable hyper-local content generation.
              </p>
              <button 
                className="btn btn-primary"
                onClick={handleRefreshLandmarks}
                disabled={refreshing}
              >
                {refreshing ? 'Fetching...' : 'Fetch Landmarks'}
              </button>
            </div>
          ) : (
            <div>
              {Object.entries(landmarksByType).map(([type, items]) => (
                <div key={type} style={{ marginBottom: '2rem' }}>
                  <h4 className="font-semibold mb-4" style={{ textTransform: 'capitalize' }}>
                    {type.replace(/_/g, ' ')} ({items.length})
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
                    {items.map(landmark => (
                      <div 
                        key={landmark.id}
                        style={{ 
                          padding: '0.75rem',
                          background: 'var(--bg-tertiary)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div className="font-semibold text-sm">{landmark.name}</div>
                        {landmark.address && (
                          <div className="text-sm text-muted">{landmark.address}</div>
                        )}
                        {landmark.rating && (
                          <div className="text-sm" style={{ color: 'var(--warning-400)' }}>
                            ⭐ {landmark.rating} ({landmark.user_ratings_total || 0} reviews)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <AuditWidget locationId={id} />
      )}
    </div>
  );
}
