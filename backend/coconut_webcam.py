import os
import sys
from dotenv import load_dotenv
from inference_sdk import InferenceHTTPClient
from inference_sdk.webrtc import WebcamSource, StreamConfig, VideoMetadata

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

api_key = os.environ.get("ROBOFLOW_API_KEY", "").strip()
if not api_key:
    print("FATAL ERROR: ROBOFLOW_API_KEY environment variable is not set or is empty.")
    sys.exit(1)

masked_key = f"{api_key[:3]}...{api_key[-4:]}" if len(api_key) >= 7 else "***"
print(f"Diagnostics: Using workspace 'pandi-bohtm', workflow 'find-coconut-5vsml', host 'https://serverless.roboflow.com'")
print(f"API Key masked: {masked_key}, length: {len(api_key)}")

client = InferenceHTTPClient.init(
    api_url="https://serverless.roboflow.com",
    api_key=api_key,
)

source = WebcamSource(resolution=(1280, 720))

config = StreamConfig(
    data_output=["predictions"],
    processing_timeout=3600,
    requested_plan="webrtc-gpu-medium",
    requested_region="us",
)

session = client.webrtc.stream(
    source=source,
    workflow="find-coconut-5vsml",
    workspace="pandi-bohtm",
    image_input="image",
    config=config,
)

@session.on_data("predictions")
def on_predictions(predictions, metadata: VideoMetadata):
    print(f"Frame {metadata.frame_id}: {predictions}")

@session.on_error
def on_error(errors, metadata: VideoMetadata):
    print(f"Frame {metadata.frame_id} failed: {errors}")

try:
    print("Starting session...")
    session.run()
except Exception as e:
    print("Exception", e)
    session.close()
