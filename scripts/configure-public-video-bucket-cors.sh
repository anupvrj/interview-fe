#!/usr/bin/env bash
# Configure CORS on the public marketing video bucket for browser playback + WebVTT.
# Run once after creating interview-trix-public (requires AWS CLI credentials).
#
# CloudFront (recommended): point NEXT_PUBLIC_VIDEO_CDN_BASE to your distribution
# origin path /videos, enable Origin Access Control, and cache with Range header
# forwarding so byte-range streaming works for <video> seeking.
#
# Usage:
#   AWS_REGION=ap-south-1 AWS_PROFILE=your-profile ./scripts/configure-public-video-bucket-cors.sh

set -euo pipefail

BUCKET="${PUBLIC_VIDEO_BUCKET:-interview-trix-public}"
REGION="${AWS_REGION:-ap-south-1}"

CORS_FILE="$(mktemp)"
trap 'rm -f "$CORS_FILE"' EXIT

cat > "$CORS_FILE" << 'EOF'
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedOrigins": [
        "https://interviewtrix.com",
        "https://www.interviewtrix.com",
        "https://stage.interviewtrix.com",
        "https://www.stage.interviewtrix.com",
        "http://localhost:3001",
        "http://localhost:3000"
      ],
      "ExposeHeaders": ["Accept-Ranges", "Content-Length", "Content-Range", "ETag"],
      "MaxAgeSeconds": 86400
    }
  ]
}
EOF

echo "Applying CORS to s3://${BUCKET} (${REGION})..."
aws s3api put-bucket-cors --bucket "$BUCKET" --cors-configuration "file://${CORS_FILE}" --region "$REGION"

echo "Verifying Accept-Ranges on sample object..."
aws s3api head-object \
  --bucket "$BUCKET" \
  --key "videos/ai_interview_demo_interview_trix.mp4" \
  --region "$REGION" \
  --query '{AcceptRanges:AcceptRanges,ContentType:ContentType}' \
  --output json

echo "Done. Set NEXT_PUBLIC_VIDEO_CDN_BASE in interview-fe when CloudFront is ready."
