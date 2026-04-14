import { Detection } from '../types/api'
import './DetectionResults.css'

interface DetectionResultsProps {
  detections: Detection[]
  renderedImage: string | null
  loading: boolean
}

function DetectionResults({ detections, renderedImage, loading }: DetectionResultsProps) {
  if (loading) {
    return (
      <div className="results-card">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Processing image...</p>
        </div>
      </div>
    )
  }

  if (!renderedImage && detections.length === 0) {
    return (
      <div className="results-card">
        <div className="empty-state">
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <h3>No Results Yet</h3>
          <p>Upload an image and click "Detect Objects" to see results</p>
        </div>
      </div>
    )
  }

  return (
    <div className="results-card">
      <h2>Detection Results</h2>

      {renderedImage && (
        <div className="result-image-container">
          <img src={renderedImage} alt="Detection results" className="result-image" />
          <div className="detection-count-badge">
            {detections.length} {detections.length === 1 ? 'object' : 'objects'} detected
          </div>
        </div>
      )}

      {detections.length > 0 && (
        <div className="detections-table-container">
          <h3>Detections</h3>
          <table className="detections-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Class</th>
                <th>Confidence</th>
                <th>Bounding Box</th>
              </tr>
            </thead>
            <tbody>
              {detections.map((detection, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <span className="class-badge">{detection.class_name}</span>
                  </td>
                  <td>
                    <span className="confidence-value">
                      {(detection.confidence * 100).toFixed(1)}%
                    </span>
                    <div className="confidence-bar">
                      <div
                        className="confidence-fill"
                        style={{ width: `${detection.confidence * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="bbox-cell">
                    <code>
                      [{detection.bbox.map(v => v.toFixed(1)).join(', ')}]
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detections.length === 0 && renderedImage && (
        <div className="no-detections">
          <p>No objects detected with current confidence threshold.</p>
          <small>Try lowering the confidence threshold in settings.</small>
        </div>
      )}
    </div>
  )
}

export default DetectionResults
