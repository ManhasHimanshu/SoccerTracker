import os
import json
import boto3
import logging
from datetime import datetime, timezone, timedelta

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

dynamodb = boto3.resource('dynamodb')

# DynamoDB table name injected via environment variable
TABLE_NAME = os.environ.get('TRACKING_TABLE', 'sbt-tracking-dev')


def lambda_handler(event, context):
    """
    Triggered by Step Functions. Receives all detections from the inference
    step and writes each frame's results to DynamoDB.
    """
    logger.info(f"Received event: {json.dumps(event)}")

    # Get detection results from the previous step's output
    video_id = event['videoId']
    frame_count = event['frameCount']
    detections = event['detections']

    logger.info(f"Storing results for {frame_count} frames of video {video_id}")

    table = dynamodb.Table(TABLE_NAME)

    # Results expire after 7 days to keep storage costs low
    expiry_time = int(
        (datetime.now(timezone.utc) + timedelta(days=7)).timestamp()
    )

    # Write each frame's results to DynamoDB
    # Use batch_writer for efficiency - groups writes into batches of 25
    with table.batch_writer() as batch:
        for frame_detection in detections:
            frame_index = frame_detection['frameIndex']
            frame_key = frame_detection['frameKey']
            frame_detections = frame_detection['detections']

            # Find the ball detection with highest confidence
            ball_detection = None
            for detection in frame_detections:
                if detection['class_name'] == 'sports ball':
                    if ball_detection is None or detection['confidence'] > ball_detection['confidence']:
                        ball_detection = detection

            # Build the DynamoDB item for this frame
            item = {
                'videoId': video_id,
                'frameId': f"frame_{frame_index:04d}",
                'frameKey': frame_key,
                'frameIndex': frame_index,
                'allDetections': frame_detections,
                'ballDetected': ball_detection is not None,
                'expiresAt': expiry_time
            }

            # Add ball coordinates if detected
            if ball_detection:
                item['ballBbox'] = ball_detection['bbox']
                item['ballConfidence'] = str(ball_detection['confidence'])

            batch.put_item(Item=item)

    logger.info(f"Successfully stored results for all {frame_count} frames")

    # Return final pipeline summary
    return {
        'videoId': video_id,
        'frameCount': frame_count,
        'status': 'COMPLETE',
        'completedAt': datetime.now(timezone.utc).isoformat()
    }