# scripts/discover_endpoints.py
import json, os, requests

API_URL = "https://spec.speakeasy.com/compasslabs/api/compass-api-with-code-samples"

spec = requests.get(API_URL, timeout=(5, 30)).json()

# Collect all paths that have at least one Python sample
paths = []
for p, methods in spec.get("paths", {}).items():
    for m in ("get", "post"):
        samples = (methods.get(m, {}) or {}).get("x-codeSamples") or []
        if any((s.get("lang") or "").lower().startswith("python") for s in samples):
            paths.append(p)
            break

matrix = {"item": paths}
print("Discovered:", matrix)

with open(os.environ["GITHUB_OUTPUT"], "a") as fh:
    fh.write(f"items={json.dumps(matrix)}\n")
