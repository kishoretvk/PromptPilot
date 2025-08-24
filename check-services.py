import requests
import time

def check_services():
    print("Checking if PromptPilot services are running...")
    
    # Check API server
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ API server is running")
            print(f"API response: {response.json()}")
        else:
            print(f"❌ API server returned status code: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ API server is not accessible")
    except Exception as e:
        print(f"❌ Error checking API server: {e}")
    
    # Check UI server
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ UI server is running")
            print(f"UI response status: {response.status_code}")
        else:
            print(f"❌ UI server returned status code: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ UI server is not accessible")
    except Exception as e:
        print(f"❌ Error checking UI server: {e}")

if __name__ == "__main__":
    check_services()