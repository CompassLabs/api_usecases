# v1/test_sdk_snippets/run_endpoint.py
import os
import sys
import requests
from dotenv import load_dotenv
import subprocess
import shlex

load_dotenv()

COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")
SERVER_URL = os.getenv("SERVER_URL")
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
        if (s.get("lang") or "").lower().startswith("typescript"):
            SNIPPET = s["source"]
            break
    if SNIPPET:
        break

if not SNIPPET:
    raise ValueError(f"No Typescript code sample found for endpoint: {ENDPOINT!r}")


print(f"--- Running typescript SDK snippet for {ENDPOINT} ---")

SNIPPET = SNIPPET.replace(
    'apiKeyAuth: "<YOUR_API_KEY_HERE>",',
    f'apiKeyAuth: "{COMPASS_API_KEY}",\n  serverURL: "{SERVER_URL}",'
)
# Write snippet to a simple file and run it
script_path = os.path.join(os.getcwd(), "snippet.ts")
with open(script_path, "w", encoding="utf-8") as f:
    f.write(SNIPPET)

try:
    # Use tsx to run TS without config; -y auto-installs if needed in CI
    cmd = f"npx -y tsx {shlex.quote(script_path)}"
    subprocess.run(cmd, shell=True, check=True)
    print(f":white_check_mark: PASS: {ENDPOINT}")
except subprocess.CalledProcessError as e:
    print(f":x: FAIL: {ENDPOINT} – exit code {e.returncode}", file=sys.stderr)
    sys.exit(e.returncode)
