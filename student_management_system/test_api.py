import requests
import json

# Base URL
BASE_URL = 'http://localhost:8000'

def test_api():
    print("Testing Student Management System API")
    print("=" * 50)
    
    # Test 1: Register a new user
    print("\n1. Testing User Registration...")
    register_data = {
        "username": "teststudent2",
        "email": "teststudent2@example.com",
        "password": "testpassword123",
        "password_confirm": "testpassword123",
        "first_name": "Test",
        "last_name": "Student",
        "user_type": "student",
        "phone": "1234567890"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/register/", json=register_data)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 201:
            print("✓ Registration successful")
            user_data = response.json()
            print(f"User created: {user_data['user']['username']}")
        else:
            print(f"✗ Registration failed: {response.text}")
    except Exception as e:
        print(f"✗ Registration error: {e}")
    
    # Test 2: Login with admin user
    print("\n2. Testing Admin Login...")
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
        else:
            print(f"✗ Login failed: {response.text}")
            access_token = None
    except Exception as e:
        print(f"✗ Login error: {e}")
        access_token = None
    
    # Test 3: Get subjects (if logged in)
    if access_token:
        print("\n3. Testing Subject List...")
        headers = {'Authorization': f'Bearer {access_token}'}
        
        try:
            response = requests.get(f"{BASE_URL}/api/courses/subjects/", headers=headers)
            print(f"Status Code: {response.status_code}")
            if response.status_code == 200:
                print("✓ Subjects retrieved successfully")
                subjects = response.json()
                print(f"Found {len(subjects)} subjects")
            else:
                print(f"✗ Failed to get subjects: {response.text}")
        except Exception as e:
            print(f"✗ Subjects error: {e}")
    
    # Test 4: Get courses
    print("\n4. Testing Course List...")
    try:
        response = requests.get(f"{BASE_URL}/api/courses/courses/")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("✓ Courses retrieved successfully")
            courses = response.json()
            print(f"Found {len(courses)} courses")
        else:
            print(f"✗ Failed to get courses: {response.text}")
    except Exception as e:
        print(f"✗ Courses error: {e}")
    
    print("\n" + "=" * 50)
    print("API Testing Complete!")

if __name__ == "__main__":
    test_api()