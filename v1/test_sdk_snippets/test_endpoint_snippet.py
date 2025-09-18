# v1/test_sdk_snippets/run_endpoint.py
import os, requests

endpoint = os.environ.get("ENDPOINT")
if not endpoint:
    raise SystemExit("ENDPOINT env var is missing")

print(f"Running test for endpoint: {endpoint}")

API_URL = "https://spec.speakeasy.com/compasslabs/api/compass-api-with-code-samples"

# Example: fetch spec and just confirm this endpoint exists
spec = requests.get(API_URL, timeout=(5,30)).json()
if endpoint not in spec.get("paths", {}):
    raise SystemExit(f"❌ Endpoint {endpoint} not in spec")

print(f"✅ Found {endpoint} in spec")