import os
import json
import boto3
import logging
import subprocess
import urllib.parse

# Set up logging so we can see what's happening in CloudWatch
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

s3 = boto3.client('s3')


def lambda_handler(event, context):
    """
    Triggered by Step Functions. Receives a videoId and S3 location,
    extracts every frame from the video, and saves them back to S3.
    """
    logger.info(f"Received event: {json.dumps(event)}")

    # Get the video details from the Step Functions input
    video_id = event['videoId']
    bucket = event['bucket']
    video_key = event['videoKey']

    # Download the video from S3 to Lambda's temporary storage
    local_video_path = f"/tmp/{video_id}.mp4"
    logger.info(f"Downloading video from s3://{bucket}/{video_key}")
    s3.download_file(bucket, video_key, local_video_path)

    # Create a folder in /tmp to store extracted frames
    frames_dir = f"/tmp/{video_id}_frames"
    os.makedirs(frames_dir, exist_ok=True)

    # Use ffmpeg to extract one frame per second from the video
    # ffmpeg is pre-installed on AWS Lambda
    ffmpeg_cmd = [
        "ffmpeg",
        "-i", local_video_path,        # input video
        "-vf", "fps=1",                 # extract 1 frame per second
        "-q:v", "2",                    # high quality
        f"{frames_dir}/frame_%04d.jpg"  # output pattern: frame_0001.jpg, frame_0002.jpg, etc.
    ]

    logger.info("Extracting frames with ffmpeg...")
    result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)

    if result.returncode != 0:
        raise Exception(f"ffmpeg failed: {result.stderr}")

    # Get list of extracted frames
    frames = sorted(os.listdir(frames_dir))
    logger.info(f"Extracted {len(frames)} frames")

    # Upload each frame back to S3
    frame_keys = []
    for frame_filename in frames:
        frame_path = os.path.join(frames_dir, frame_filename)
        frame_key = f"frames/{video_id}/{frame_filename}"

        s3.upload_file(frame_path, bucket, frame_key)
        frame_keys.append(frame_key)

    logger.info(f"Uploaded {len(frame_keys)} frames to S3")

    # Return the frame locations so Step Functions can pass them to the next step
    return {
        "videoId": video_id,
        "bucket": bucket,
        "frameKeys": frame_keys,
        "frameCount": len(frame_keys)
    }