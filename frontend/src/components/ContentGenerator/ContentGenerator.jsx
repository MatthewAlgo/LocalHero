import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';

export default function ContentGenerator() {
  const { id } = useParams();
  const [location, setLocation] = useState(null);
  const [contentType, setContentType] = useState('gbp_post');
  const [tone, setTone] = useState('professional');
  const [generatedContent, setGeneratedContent] = useState(null);
  const [contentHistory, setContentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [locationData, historyData] = await Promise.all([
        api.getLocation(id),
        api.getContentHistory(id)
      ]);
      setLocation(locationData.location);
      setContentHistory(historyData.content || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setGeneratedContent(null);

    try {
      let result;
      switch (contentType) {
        case 'gbp_post':
          result = await api.generateGBPPost(id, { tone });
          break;
        case 'location_page':
          result = await api.generateLocationPage(id);
          break;
        case 'social_posts':
          result = await api.generateSocialPosts(id, 3);
          break;
        default:
          throw new Error('Invalid content type');
      }
      setGeneratedContent(result.content);
      fetchData(); // Refresh history
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedContent) return;
    
    try {
      await navigator.clipboard.writeText(generatedContent.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-4 mb-4">
          <Link to={`/locations/${id}`} className="btn btn-ghost btn-sm">
            ← Back
          </Link>
        </div>
        <h1 className="page-title">Content Generator</h1>
        <p className="page-subtitle">
          Generate hyper-local content for {location.business_name}
        </p>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Generator Panel */}
        <div className="card">
          <h3 className="card-title mb-4">Generate New Content</h3>
          
          <div className="form-group">
            <label className="form-label">Content Type</label>
            <select
              className="form-input form-select"
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
            >
              <option value="gbp_post">Google Business Profile Post</option>
              <option value="location_page">Location Page (SEO)</option>
              <option value="social_posts">Social Media Posts</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tone</label>
            <select
              className="form-input form-select"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
            </select>
          </div>

          <div className="alert alert-info">
            <span>💡</span>
            <div>
              <strong>Local landmarks will be injected:</strong><br />
              Your content will mention nearby schools, parks, and landmarks to improve local SEO.
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg w-full mt-4"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <>
                <span className="loading-spinner" style={{ width: 20, height: 20 }} />
                <span>Generating...</span>
              </>
            ) : (
              '✨ Generate Content'
            )}
          </button>
        </div>

        {/* Output Panel */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Generated Content</h3>
            {generatedContent && (
              <button
                className={`btn btn-secondary btn-sm copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
              >
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            )}
          </div>

          {generatedContent ? (
            <>
              <div className="content-preview">
                {generatedContent.body}
              </div>
              {generatedContent.landmarks_used && generatedContent.landmarks_used.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm text-muted mb-2">Landmarks mentioned:</div>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {generatedContent.landmarks_used.map((landmark, i) => (
                      <span key={i} className="badge badge-primary">{landmark}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <div className="empty-icon">✨</div>
              <h4 className="empty-title">Ready to generate</h4>
              <p className="empty-description text-sm">
                Select your content type and click generate to create hyper-local content.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content History */}
      <div className="card mt-6">
        <h3 className="card-title mb-4">Recent Content</h3>
        
        {contentHistory.length === 0 ? (
          <p className="text-muted">No content generated yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {contentHistory.slice(0, 5).map(content => (
              <div 
                key={content.id}
                style={{
                  padding: '1rem',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="badge badge-primary">
                    {content.content_type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm text-muted">
                    {new Date(content.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div 
                  className="text-sm"
                  style={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {content.body}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
