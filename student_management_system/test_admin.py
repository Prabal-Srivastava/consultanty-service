import requests
import json

# Base URL
BASE_URL = 'http://localhost:8000'

def test_admin_login():
    print("Testing Admin Login")
    print("=" * 30)
    
    # Test login with admin credentials
    login_data = {
        "username": "arpit",
        "password": "testpassword"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login/", json=login_data)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("✓ Login successful")
            auth_data = response.json()
            access_token = auth_data['access']
            print("Access token obtained")
            
            # Test authenticated request
            headers = {'Authorization': f'Bearer {access_token}'}
            response = requests.get(f"{BASE_URL}/api/courses/courses/", headers=headers)
            print(f"Course List Status: {response.status_code}")
            if response.status_code == 200:
                print("✓ Authenticated request successful")
                courses = response.json()
                print(f"Found {len(courses)} courses")
            else:
                print(f"✗ Authenticated request failed: {response.text}")
                
        else:
            print(f"✗ Login failed: {response.text}")
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    test_admin_login()