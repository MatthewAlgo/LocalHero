import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';

export default function ReviewResponder() {
  const { id } = useParams();
  const [location, setLocation] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [generating, setGenerating] = useState(false);

  // Form state for adding review
  const [reviewForm, setReviewForm] = useState({
    reviewerName: '',
    rating: 5,
    reviewText: ''
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [locationData, reviewsData] = await Promise.all([
        api.getLocation(id),
        api.getReviews(id)
      ]);
      setLocation(locationData.location);
      setReviews(reviewsData.reviews || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    try {
      await api.addReview(id, reviewForm);
      setShowAddModal(false);
      setReviewForm({ reviewerName: '', rating: 5, reviewText: '' });
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGenerateResponse = async (review) => {
    setSelectedReview(review);
    setGenerating(true);
    setGeneratedResponse('');

    try {
      const result = await api.generateReviewResponse(id, review.id, { tone: 'professional' });
      setGeneratedResponse(result.response);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveResponse = async () => {
    if (!selectedReview || !generatedResponse) return;

    try {
      await api.saveReviewResponse(id, selectedReview.id, generatedResponse);
      setSelectedReview(null);
      setGeneratedResponse('');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Delete this review?')) return;
    
    try {
      await api.deleteReview(id, reviewId);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
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

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-4 mb-4">
          <Link to={`/locations/${id}`} className="btn btn-ghost btn-sm">
            ← Back
          </Link>
        </div>
        <h1 className="page-title">Review Responder</h1>
        <p className="page-subtitle">
          Manage and respond to reviews for {location.business_name}
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Reviews List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Reviews</h3>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setShowAddModal(true)}
            >
              + Add Review
            </button>
          </div>

          {reviews.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-icon">💬</div>
              <h4 className="empty-title">No reviews yet</h4>
              <p className="empty-description text-sm">
                Add customer reviews to generate personalized responses.
              </p>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddModal(true)}
              >
                Add First Review
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map(review => (
                <div 
                  key={review.id}
                  className={`review-card ${selectedReview?.id === review.id ? 'selected' : ''}`}
                  style={{
                    border: selectedReview?.id === review.id 
                      ? '2px solid var(--primary-500)' 
                      : '1px solid var(--border-default)'
                  }}
                >
                  <div className="review-header">
                    <span className="review-author">{review.reviewer_name || 'Anonymous'}</span>
                    <span className="review-rating">{renderStars(review.rating)}</span>
                  </div>
                  <p className="review-text">"{review.review_text}"</p>
                  
                  {review.response_text ? (
                    <div className="review-response">
                      <div className="text-sm text-muted mb-2">Your Response:</div>
                      <p className="text-sm">{review.response_text}</p>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-4">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleGenerateResponse(review)}
                        disabled={generating && selectedReview?.id === review.id}
                      >
                        {generating && selectedReview?.id === review.id 
                          ? 'Generating...' 
                          : '✨ Generate Response'}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDeleteReview(review.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Response Generator */}
        <div className="card">
          <h3 className="card-title mb-4">Response Generator</h3>

          {selectedReview ? (
            <>
              <div className="alert alert-info mb-4">
                <span>💬</span>
                <div>
                  <strong>Responding to {selectedReview.reviewer_name || 'Anonymous'}:</strong><br />
                  "{selectedReview.review_text.substring(0, 100)}..."
                </div>
              </div>

              {generating ? (
                <div className="flex items-center justify-center" style={{ padding: '3rem' }}>
                  <div className="loading-spinner" />
                  <span className="ml-4">Generating personalized response...</span>
                </div>
              ) : generatedResponse ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Generated Response</label>
                    <textarea
                      className="form-input form-textarea"
                      value={generatedResponse}
                      onChange={(e) => setGeneratedResponse(e.target.value)}
                      rows={6}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-primary"
                      onClick={handleSaveResponse}
                    >
                      ✓ Save Response
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleGenerateResponse(selectedReview)}
                    >
                      🔄 Regenerate
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        setSelectedReview(null);
                        setGeneratedResponse('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <div className="empty-icon">💬</div>
              <h4 className="empty-title">Select a review</h4>
              <p className="empty-description text-sm">
                Click "Generate Response" on a review to create a personalized reply.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Review Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Review</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleAddReview}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Reviewer Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={reviewForm.reviewerName}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, reviewerName: e.target.value }))}
                    placeholder="John D."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <select
                    className="form-input form-select"
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 stars)</option>
                    <option value={4}>⭐⭐⭐⭐☆ (4 stars)</option>
                    <option value={3}>⭐⭐⭐☆☆ (3 stars)</option>
                    <option value={2}>⭐⭐☆☆☆ (2 stars)</option>
                    <option value={1}>⭐☆☆☆☆ (1 star)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Review Text *</label>
                  <textarea
                    className="form-input form-textarea"
                    value={reviewForm.reviewText}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, reviewText: e.target.value }))}
                    placeholder="Paste the customer review here..."
                    required
                    rows={4}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
