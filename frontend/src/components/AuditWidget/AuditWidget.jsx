import { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function AuditWidget({ locationId }) {
  const [citations, setCitations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCitations();
  }, [locationId]);

  const fetchCitations = async () => {
    try {
      const data = await api.getCitations(locationId);
      setCitations(data.citations || []);
      setSummary(data.summary);
      setScore(data.score || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (citationId, status, napConsistent = null) => {
    try {
      await api.updateCitation(locationId, citationId, { status, napConsistent });
      fetchCitations();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center" style={{ padding: '3rem' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="card-title mb-6">Citation Audit</h3>

      {/* Audit Score */}
      <div className="audit-score" style={{ '--score': score }}>
        <div className="audit-score-inner">
          <div className="audit-score-value">{score}</div>
          <div className="audit-score-label">Score</div>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="text-center">
            <div className="font-semibold" style={{ fontSize: '1.5rem', color: 'var(--accent-400)' }}>
              {summary.found || 0}
            </div>
            <div className="text-sm text-muted">Found</div>
          </div>
          <div className="text-center">
            <div className="font-semibold" style={{ fontSize: '1.5rem', color: 'var(--error-400)' }}>
              {summary.missing || 0}
            </div>
            <div className="text-sm text-muted">Missing</div>
          </div>
          <div className="text-center">
            <div className="font-semibold" style={{ fontSize: '1.5rem', color: 'var(--neutral-400)' }}>
              {summary.unchecked || 0}
            </div>
            <div className="text-sm text-muted">Unchecked</div>
          </div>
          <div className="text-center">
            <div className="font-semibold" style={{ fontSize: '1.5rem', color: 'var(--primary-400)' }}>
              {summary.consistent || 0}
            </div>
            <div className="text-sm text-muted">NAP OK</div>
          </div>
        </div>
      )}

      {/* Citation Checklist */}
      <div className="audit-list">
        {citations.map(citation => (
          <div key={citation.id} className="audit-item">
            <div 
              className={`audit-status ${citation.status}`}
              title={citation.status}
            >
              {citation.status === 'found' && '✓'}
              {citation.status === 'missing' && '✗'}
              {citation.status === 'unchecked' && '?'}
              {citation.status === 'pending' && '⋯'}
            </div>
            
            <div style={{ flex: 1 }}>
              <div className="font-semibold text-sm">{citation.directory_name}</div>
              {citation.directory_url && (
                <a 
                  href={citation.directory_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm"
                  style={{ color: 'var(--primary-400)' }}
                >
                  {citation.directory_url.replace(/^https?:\/\//, '').split('/')[0]}
                </a>
              )}
            </div>

            <div className="flex gap-2">
              <select
                className="form-input form-select"
                style={{ width: 'auto', padding: '0.25rem 2rem 0.25rem 0.5rem', fontSize: '0.75rem' }}
                value={citation.status}
                onChange={(e) => handleStatusChange(citation.id, e.target.value)}
              >
                <option value="unchecked">Unchecked</option>
                <option value="found">Found</option>
                <option value="missing">Missing</option>
                <option value="pending">Pending</option>
              </select>
              
              {citation.status === 'found' && (
                <button
                  className={`btn btn-sm ${citation.nap_consistent ? 'btn-accent' : 'btn-ghost'}`}
                  onClick={() => handleStatusChange(citation.id, citation.status, !citation.nap_consistent)}
                  title="NAP Consistent"
                  style={{ padding: '0.25rem 0.5rem' }}
                >
                  {citation.nap_consistent ? '✓ NAP' : 'NAP?'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {summary && summary.missing > 0 && (
        <div className="alert alert-warning mt-4">
          <span>⚠️</span>
          <div>
            <strong>Missing Citations</strong><br />
            You're missing from {summary.missing} directories. Adding your business to these can improve local rankings.
          </div>
        </div>
      )}
    </div>
  );
}
