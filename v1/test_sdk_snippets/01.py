# v1/test_sdk_snippets/run_endpoint.py

from compass_api_sdk import CompassAPI, models


with CompassAPI(
    api_key_auth="Zp69nDSOYw9P02FiVnhZBaJkvkRcz0Pg1U7cjnhr",
) as compass_api:

    res = compass_api.aave_v3.aave_aave_supported_tokens(chain=models.V1AaveAaveSupportedTokensChain.ARBITRUM)

    # Handle response
    print(res)


import os
import sys
import requests
from dotenv import load_dotenv
import subprocess
import shlex

load_dotenv()

COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")
ENDPOINT = os.getenv("ENDPOINT")
print([ENDPOINT])
API_URL = "https://spec.speakeasy.com/compasslabs/api/compass-api-with-code-samples"
SPEC = requests.get(API_URL).json()

# get python code sample for given path
methods = SPEC["paths"].get(ENDPOINT)
if not methods:
    raise ValueError(f"Endpoint not found in spec: {ENDPOINT!r}")

SNIPPET = None
for method in ("get", "post"):
    samples = (methods.get(method, {}) or {}).get("x-codeSamples") or []
    for s in samples:
        if (s.get("lang") or "").lower().startswith("python"):
            SNIPPET = s["source"]
            break
    if SNIPPET:
        break

if not SNIPPET:
    raise ValueError(f"No Python code sample found for endpoint: {ENDPOINT!r}")


print(f"--- Running python SDK snippet for {ENDPOINT} ---")

SNIPPET = SNIPPET.replace("<YOUR_API_KEY_HERE>", COMPASS_API_KEY)
# Write snippet to a simple file and run it
script_path = os.path.join(os.getcwd(), "snippet.py")
with open(script_path, "w", encoding="utf-8") as f:
    f.write(SNIPPET)

try:
    cmd = f"{shlex.quote(sys.executable)} {shlex.quote(script_path)}"
    subprocess.run(cmd, shell=True, check=True)
    print(f"✅ PASS: {ENDPOINT}")
except subprocess.CalledProcessError as e:
    print(f"❌ FAIL: {ENDPOINT} – exit code {e.returncode}", file=sys.stderr)
    sys.exit(e.returncode)
