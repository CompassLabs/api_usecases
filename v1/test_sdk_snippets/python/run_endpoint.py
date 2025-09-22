# v1/test_sdk_snippets/run_endpoint.py
import os
import sys
import requests
from dotenv import load_dotenv
import subprocess
import shlex

API_URL = "https://spec.speakeasy.com/compasslabs/api/compass-api-with-code-samples"

def load_api_key() -> str:
    load_dotenv()
    key = os.getenv("COMPASS_API_KEY")
    if not key:
        raise RuntimeError("COMPASS_API_KEY not set in environment")
    return key

def fetch_api_spec(url: str):
    r = requests.get(url, timeout=(5, 30))
    r.raise_for_status()
    return r.json()

def get_python_code_for_path(spec, path: str) -> str:
    """Return the FIRST Python code sample for the given path (checks get/post)."""
    methods = spec["paths"].get(path)
    if not methods:
        raise ValueError(f"Path not found in spec: {path!r}")
    for method in ("get", "post"):
        samples = (methods.get(method, {}) or {}).get("x-codeSamples") or []
        for s in samples:
            if (s.get("lang") or "").lower().startswith("python"):
                return s["source"]
    raise ValueError(f"No Python code sample found for path: {path!r}")

def replace_with_secret(snippet: str, api_key: str) -> str:
    return snippet.replace("<YOUR_API_KEY_HERE>", api_key)

def main():
    # Endpoint comes from env var ENDPOINT or first CLI arg
    endpoint = os.getenv("ENDPOINT") or (len(sys.argv) > 1 and sys.argv[1])
    if not endpoint:
        print("Usage: run_endpoint.py <endpoint> (or set ENDPOINT env var)", file=sys.stderr)
        sys.exit(2)

    api_key = load_api_key()
    spec = fetch_api_spec(API_URL)

    print(f"--- Running SDK snippet for {endpoint} ---")
    code = get_python_code_for_path(spec, endpoint)
    code = replace_with_secret(code, api_key)
    # Write snippet to a simple file and run it
    script_path = os.path.join(os.getcwd(), "snippet.py")
    with open(script_path, "w", encoding="utf-8") as f:
        f.write(code)   

    try:
        cmd = f"{shlex.quote(sys.executable)} {shlex.quote(script_path)}"
        subprocess.run(cmd, shell=True, check=True)
        print(f"✅ PASS: {endpoint}")
    except subprocess.CalledProcessError as e:
        print(f"❌ FAIL: {endpoint} – exit code {e.returncode}", file=sys.stderr)
        sys.exit(e.returncode)

if __name__ == "__main__":
    main()