import os
import json
import boto3
import base64
import logging
from PIL import Image
from io import BytesIO

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

s3 = boto3.client('s3')
sagemaker = boto3.client('sagemaker-runtime')

# SageMaker endpoint name - we'll create this endpoint in a later step
SAGEMAKER_ENDPOINT = os.environ.get('SAGEMAKER_ENDPOINT', 'sbt-yolov8-endpoint')


def lambda_handler(event, context):
    """
    Triggered by Step Functions. Receives a list of frame S3 keys,
    sends each frame to YOLOv8 on SageMaker, and returns all detections.
    """
    logger.info(f"Received event: {json.dumps(event)}")

    # Get frame details from the previous step's output
    video_id = event['videoId']
    bucket = event['bucket']
    frame_keys = event['frameKeys']

    logger.info(f"Running inference on {len(frame_keys)} frames")

    all_detections = []

    for i, frame_key in enumerate(frame_keys):
        logger.info(f"Processing frame {i + 1}/{len(frame_keys)}: {frame_key}")

        # Download frame from S3
        response = s3.get_object(Bucket=bucket, Key=frame_key)
        image_bytes = response['Body'].read()

        # Convert image to base64 so it can be sent as JSON
        image_b64 = base64.b64encode(image_bytes).decode('utf-8')

        # Send frame to SageMaker endpoint for inference
        sagemaker_response = sagemaker.invoke_endpoint(
            EndpointName=SAGEMAKER_ENDPOINT,
            ContentType='application/json',
            Body=json.dumps({'image': image_b64})
        )

        # Parse the response from YOLOv8
        result = json.loads(sagemaker_response['Body'].read().decode('utf-8'))

        # Store this frame's detections
        frame_detection = {
            'frameKey': frame_key,
            'frameIndex': i,
            'detections': result['detections']
        }
        all_detections.append(frame_detection)

    logger.info(f"Completed inference on all {len(frame_keys)} frames")

    # Pass everything to the next step
    return {
        'videoId': video_id,
        'bucket': bucket,
        'frameCount': len(frame_keys),
        'detections': all_detections
    }