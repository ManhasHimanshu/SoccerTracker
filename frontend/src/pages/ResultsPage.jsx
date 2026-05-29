import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getVideoResults } from '../config/api'
import LoadingSpinner from '../components/LoadingSpinner'

function DetectionBox({ detection }) {
  const { x, y, width, height, confidence } = detection
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <div className="text-sm text-gray-600">
        Position: <span className="font-mono text-gray-800">
          ({Math.round(x)}, {Math.round(y)})
        </span>
      </div>
      <div className="text-sm text-gray-600">
        Size: <span className="font-mono text-gray-800">
          {Math.round(width)}×{Math.round(height)}
        </span>
      </div>
      <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        confidence > 0.8
          ? 'bg-green-100 text-green-700'
          : confidence > 0.5
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-red-100 text-red-700'
      }`}>
        {Math.round(confidence * 100)}%
      </div>
    </div>
  )
}

function FrameCard({ frame, index }) {
  const [expanded, setExpanded] = useState(false)
  const detections = frame.detections?.detections || []
  const hasball = detections.length > 0

  return (
    <div className={`border rounded-lg overflow-hidden ${
      hasball ? 'border-green-200' : 'border-gray-200'
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-gray-500">
            #{String(index + 1).padStart(4, '0')}
          </span>
          <span className="text-sm font-medium text-gray-700">
            {frame.frameId}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasball ? (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              ⚽ {detections.length} detection{detections.length !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              No ball
            </span>
          )}
          <span className="text-gray-400 text-xs">
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {expanded && hasball && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          {detections.map((det, i) => (
            <DetectionBox key={i} detection={det} />
          ))}
        </div>
      )}

      {expanded && !hasball && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-sm text-gray-400 text-center">
            Ball not detected in this frame
          </p>
        </div>
      )}
    </div>
  )
}

function ResultsPage() {
  const { videoId } = useParams()
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await getVideoResults(videoId)
        setResults(data)
      } catch (err) {
        setError('Failed to load results. Please try again.')
      }
    }
    fetchResults()
  }, [videoId])

  if (!results && !error) {
    return <LoadingSpinner message="Loading results..." />
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
          <div className="text-4xl mb-2">❌</div>
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => navigate('/upload')}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            Upload another video
          </button>
        </div>
      </div>
    )
  }

  const framesWithBall = results.frames.filter(
    f => (f.detections?.detections || []).length > 0
  ).length

  const detectionRate = Math.round((framesWithBall / results.frameCount) * 100)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Summary card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          Results
        </h1>
        <p className="text-gray-500 text-sm font-mono mb-6">{videoId}</p>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">
              {results.frameCount}
            </div>
            <div className="text-xs text-gray-500 mt-1">Total frames</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {framesWithBall}
            </div>
            <div className="text-xs text-gray-500 mt-1">Ball detected</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {detectionRate}%
            </div>
            <div className="text-xs text-gray-500 mt-1">Detection rate</div>
          </div>
        </div>
      </div>

      {/* Frame list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Frame by Frame
        </h2>
        <div className="space-y-2">
          {results.frames.map((frame, index) => (
            <FrameCard key={frame.frameId} frame={frame} index={index} />
          ))}
        </div>
      </div>

      {/* Upload another */}
      <div className="text-center mt-6">
        <button
          onClick={() => navigate('/upload')}
          className="text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-6 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          Upload another video
        </button>
      </div>
    </div>
  )
}

export default ResultsPage