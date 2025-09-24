import os

def main():
    print("Hello from test!")
    
    # Load and print the API key
    api_key = os.getenv("COMPASS_API_KEY")
    if api_key:
        print(f"API Key loaded: {api_key[:10]}...")
    else:
        print("No API key found")


if __name__ == "__main__":
    main()
