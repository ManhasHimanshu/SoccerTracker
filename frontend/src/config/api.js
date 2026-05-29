import { fetchAuthSession } from 'aws-amplify/auth'
import axios from 'axios'
import { API_URL } from './amplify'

// Creates an axios instance with the Cognito JWT token automatically attached
const getAuthenticatedClient = async () => {
  const session = await fetchAuthSession()
  const token = session.tokens.idToken.toString()

  return axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json'
    }
  })
}

// GET /upload-url
export const getUploadUrl = async () => {
  const client = await getAuthenticatedClient()
  const response = await client.get('/upload-url')
  return response.data
}

// Upload video directly to S3 using pre-signed URL
export const uploadVideoToS3 = async (presignedUrl, file, onProgress) => {
  await axios.put(presignedUrl, file, {
    headers: { 'Content-Type': 'video/mp4' },
    onUploadProgress: (progressEvent) => {
      const percentage = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      )
      onProgress(percentage)
    }
  })
}

// GET /status/{videoId}
export const getVideoStatus = async (videoId) => {
  const client = await getAuthenticatedClient()
  const response = await client.get(`/status/${videoId}`)
  return response.data
}

// GET /results/{videoId}
export const getVideoResults = async (videoId) => {
  const client = await getAuthenticatedClient()
  const response = await client.get(`/results/${videoId}`)
  return response.data
}