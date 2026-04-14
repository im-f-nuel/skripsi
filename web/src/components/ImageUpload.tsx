import { useRef } from 'react'
import './ImageUpload.css'

interface ImageUploadProps {
  onFileSelect: (file: File) => void
  selectedFile: File | null
  previewUrl: string | null
}

function ImageUpload({ onFileSelect, selectedFile, previewUrl }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file)
    }
  }

  return (
    <div className="image-upload-card">
      <h2>Upload Image</h2>

      <div
        className="upload-zone"
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <div className="preview-container">
            <img src={previewUrl} alt="Preview" className="preview-image" />
            <div className="preview-overlay">
              <span>Click or drag to change</span>
            </div>
          </div>
        ) : (
          <div className="upload-placeholder">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p>Click or drag image here</p>
            <span>Supports: JPG, PNG, JPEG</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {selectedFile && (
        <div className="file-info">
          <strong>Selected:</strong> {selectedFile.name}
          <br />
          <small>Size: {(selectedFile.size / 1024).toFixed(2)} KB</small>
        </div>
      )}
    </div>
  )
}

export default ImageUpload
