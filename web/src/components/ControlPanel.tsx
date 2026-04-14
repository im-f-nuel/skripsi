import './ControlPanel.css'

interface ControlPanelProps {
  onPredict: () => void
  onReset: () => void
  loading: boolean
  hasImage: boolean
}

function ControlPanel({
  onPredict,
  onReset,
  loading,
  hasImage,
}: ControlPanelProps) {
  return (
    <div className="control-panel-card">
      <div className="button-group">
        <button
          onClick={onPredict}
          disabled={!hasImage || loading}
          className="btn btn-primary"
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Detecting...
            </>
          ) : (
            'Detect Objects'
          )}
        </button>

        <button
          onClick={onReset}
          disabled={!hasImage || loading}
          className="btn btn-secondary"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

export default ControlPanel
