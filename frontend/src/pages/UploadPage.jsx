import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUploadUrl, uploadVideoToS3 } from '../config/api'

function UploadPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected && selected.type === 'video/mp4') {
      setFile(selected)
      setError(null)
    } else {
      setError('Please select an MP4 video file.')
      setFile(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)

    try {
      // Get pre-signed URL and videoId from your API
      const { uploadUrl, videoId } = await getUploadUrl()

      // Upload directly to S3
      await uploadVideoToS3(uploadUrl, file, setProgress)

      // Navigate to status page with the videoId
      navigate(`/status/${videoId}`)
    } catch (err) {
      setError('Upload failed. Please try again.')
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Upload a Video
        </h1>
        <p className="text-gray-500 mb-6">
          Upload an MP4 soccer video to track the ball frame by frame.
        </p>

        {/* File picker */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 transition-colors ${
            file
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            type="file"
            accept="video/mp4"
            onChange={handleFileChange}
            className="hidden"
            id="file-input"
            disabled={uploading}
          />
          <label htmlFor="file-input" className="cursor-pointer">
            <div className="text-4xl mb-2">🎬</div>
            {file ? (
              <div>
                <p className="font-medium text-green-700">{file.name}</p>
                <p className="text-sm text-green-600">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-gray-600">
                  Click to select a video
                </p>
                <p className="text-sm text-gray-400">MP4 files only</p>
              </div>
            )}
          </label>
        </div>

        {/* Progress bar */}
        {uploading && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
        >
          {uploading ? `Uploading... ${progress}%` : 'Upload Video'}
        </button>
      </div>
    </div>
  )
}

export default UploadPage