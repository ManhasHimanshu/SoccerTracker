import os
import json
import boto3
import logging
import urllib.parse
from datetime import datetime, timezone

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

stepfunctions = boto3.client('stepfunctions')

# State machine ARN injected via environment variable
STATE_MACHINE_ARN = os.environ.get('STATE_MACHINE_ARN')


def lambda_handler(event, context):
    """
    Triggered automatically by S3 when a new video is uploaded.
    Parses the S3 event and starts the Step Functions pipeline.
    """
    logger.info(f"Received S3 event: {json.dumps(event)}")

    # S3 can send multiple records in one event (e.g. batch uploads)
    # so we loop through all of them
    for record in event['Records']:

        # Extract bucket and key from the S3 event
        bucket = record['s3']['bucket']['name']
        # URL decode the key in case it has spaces or special characters
        video_key = urllib.parse.unquote_plus(
            record['s3']['object']['key']
        )

        # Only process files in the videos/ prefix
        # Ignore anything else that lands in the bucket (e.g. frames/)
        if not video_key.startswith('videos/'):
            logger.info(f"Skipping non-video key: {video_key}")
            continue

        # Generate a unique video ID from the filename
        # e.g. "videos/match_01.mp4" -> "match_01"
        video_filename = video_key.split('/')[-1]
        video_id = video_filename.rsplit('.', 1)[0]

        logger.info(f"Starting pipeline for video: {video_id}")

        # Build the input payload for Step Functions
        # This is exactly what extract_frames/lambda_function.py expects
        pipeline_input = {
            'videoId': video_id,
            'bucket': bucket,
            'videoKey': video_key,
            'triggeredAt': datetime.now(timezone.utc).isoformat()
        }

        # Start the Step Functions execution
        response = stepfunctions.start_execution(
            stateMachineArn=STATE_MACHINE_ARN,
            # Use videoId as execution name so it's easy to find in AWS Console
            name=f"{video_id}-{int(datetime.now(timezone.utc).timestamp())}",
            input=json.dumps(pipeline_input)
        )

        logger.info(f"Started execution: {response['executionArn']}")

    return {'status': 'OK'}