# Student Management System API Documentation

## Base URL
`http://localhost:8000/api`

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Endpoints

### Authentication

#### Register User
**POST** `/auth/register/`
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "password_confirm": "string",
  "first_name": "string",
  "last_name": "string",
  "user_type": "student|tutor|admin",
  "phone": "string"
}
```

#### Login User
**POST** `/auth/login/`
```json
{
  "username": "string",
  "password": "string"
}
```

#### Verify Email
**POST** `/auth/verify-email/`
```json
{
  "token": "string"
}
```

#### Get Profile
**GET** `/auth/profile/`

#### Update Profile
**PUT/PATCH** `/auth/profile/`
```json
{
  "bio": "string",
  "avatar": "file",
  "date_of_birth": "YYYY-MM-DD",
  "address": "string"
}
```

#### List Users
**GET** `/auth/users/`
Query Parameters:
- `user_type`: student|tutor|admin

### Courses

#### List Courses
**GET** `/courses/courses/`
Query Parameters:
- `subject`: subject ID
- `tutor`: tutor ID

#### Create Course (Tutors only)
**POST** `/courses/courses/`
```json
{
  "title": "string",
  "subject_id": "integer",
  "fee": "decimal",
  "description": "string",
  "duration": "integer"
}
```

#### Get Course Details
**GET** `/courses/courses/{id}/`

#### Update Course (Course creator only)
**PUT/PATCH** `/courses/courses/{id}/`

#### Delete Course (Course creator only)
**DELETE** `/courses/courses/{id}/`

#### Enroll in Course
**POST** `/courses/courses/{id}/enroll/`

#### List My Enrollments (Students)
**GET** `/courses/my-enrollments/`

#### List My Courses (Tutors)
**GET** `/courses/my-courses/`

#### Update Progress
**POST** `/courses/enrollments/{id}/progress/`
```json
{
  "progress": "integer (0-100)"
}
```

### Subjects

#### List Subjects
**GET** `/courses/subjects/`

#### Create Subject (Admin only)
**POST** `/courses/subjects/`
```json
{
  "name": "string",
  "description": "string"
}
```

#### Get Subject Details
**GET** `/courses/subjects/{id}/`

#### Update Subject (Admin only)
**PUT/PATCH** `/courses/subjects/{id}/`

#### Delete Subject (Admin only)
**DELETE** `/courses/subjects/{id}/`

### Quizzes

#### List Quizzes
**GET** `/quizzes/quizzes/`
Query Parameters:
- `course`: course ID

#### Create Quiz (Tutors only)
**POST** `/quizzes/quizzes/`
```json
{
  "course": "integer",
  "title": "string",
  "description": "string",
  "duration": "integer",
  "questions_data": [
    {
      "text": "string",
      "question_type": "multiple_choice|true_false|short_answer",
      "marks": "integer",
      "order": "integer",
      "choices_data": [
        {
          "text": "string",
          "is_correct": "boolean",
          "order": "integer"
        }
      ]
    }
  ]
}
```

#### Get Quiz Details
**GET** `/quizzes/quizzes/{id}/`

#### Update Quiz (Quiz creator only)
**PUT/PATCH** `/quizzes/quizzes/{id}/`

#### Delete Quiz (Quiz creator only)
**DELETE** `/quizzes/quizzes/{id}/`

#### Start Quiz
**POST** `/quizzes/quizzes/{id}/start/`

#### Get Quiz Results
**GET** `/quizzes/quizzes/{id}/results/`

#### List Questions for Quiz
**GET** `/quizzes/quizzes/{id}/questions/`

#### Add Question to Quiz (Quiz creator only)
**POST** `/quizzes/quizzes/{id}/questions/`
```json
{
  "text": "string",
  "question_type": "string",
  "marks": "integer",
  "order": "integer",
  "choices_data": [
    {
      "text": "string",
      "is_correct": "boolean",
      "order": "integer"
    }
  ]
}
```

#### Submit Answer
**POST** `/quizzes/attempts/{id}/submit/`
```json
{
  "question_id": "integer",
  "choice_id": "integer (optional)",
  "short_answer": "string (optional)"
}
```

#### Complete Quiz
**POST** `/quizzes/attempts/{id}/complete/`

#### List My Quiz Attempts
**GET** `/quizzes/attempts/`

### Payments

#### List My Payments
**GET** `/payments/payments/`

#### Get Payment Details
**GET** `/payments/payments/{id}/`

#### Create Payment Intent
**POST** `/payments/create-payment-intent/`
```json
{
  "course_id": "integer",
  "payment_method": "stripe|razorpay",
  "installment_plan": "boolean"
}
```

#### Confirm Payment
**POST** `/payments/confirm/`
```json
{
  "payment_id": "integer",
  "payment_intent_id": "string"
}
```

#### Request Refund
**POST** `/payments/{id}/refund/`

#### Process Refund (Admin only)
**POST** `/refunds/{id}/process/`

#### List My Installments
**GET** `/payments/installments/`

#### Job Offer Received
**POST** `/payments/enrollments/{id}/job-offer/`

### Chat

#### List Chat Rooms
**GET** `/chat/rooms/`

#### Create Chat Room
**POST** `/chat/rooms/create/`
```json
{
  "name": "string",
  "room_type": "one_on_one|group|support",
  "participants": ["integer"] // user IDs
}
```

#### Get Room Details
**GET** `/chat/rooms/{id}/`

#### Update Room
**PUT/PATCH** `/chat/rooms/{id}/`

#### Delete Room
**DELETE** `/chat/rooms/{id}/`

#### List Messages in Room
**GET** `/chat/rooms/{id}/messages/`

#### Create Support Chat
**POST** `/chat/rooms/support/`

#### Start Video Call
**POST** `/chat/rooms/{id}/video-call/`

#### Accept Video Call
**POST** `/chat/video-calls/{id}/accept/`

#### End Video Call
**POST** `/chat/video-calls/{id}/end/`

#### Video Call History
**GET** `/chat/video-calls/history/`

#### Call Records
**GET** `/chat/call-records/`

### Interviews

#### List Mock Interviews
**GET** `/interviews/mock-interviews/`

#### Create Mock Interview
**POST** `/interviews/mock-interviews/`
```json
{
  "course": "integer",
  "interviewer": "integer",
  "interview_type": "technical|hr|behavioral|coding",
  "title": "string",
  "description": "string",
  "scheduled_at": "datetime",
  "duration": "integer",
  "questions_data": [
    {
      "question_text": "string",
      "expected_answer": "string",
      "marks": "integer",
      "order": "integer"
    }
  ]
}
```

#### Get Interview Details
**GET** `/interviews/mock-interviews/{id}/`

#### Update Interview
**PUT/PATCH** `/interviews/mock-interviews/{id}/`

#### Delete Interview
**DELETE** `/interviews/mock-interviews/{id}/`

#### Start Interview (Tutors only)
**POST** `/interviews/mock-interviews/{id}/start/`

#### Complete Interview (Tutors only)
**POST** `/interviews/mock-interviews/{id}/complete/`

#### Submit Interview Answer
**POST** `/interviews/answers/`
```json
{
  "question": "integer",
  "answer_text": "string"
}
```

#### Get Available Slots
**GET** `/interviews/slots/available/`
Query Parameters:
- `date`: YYYY-MM-DD
- `interviewer`: interviewer ID

#### Book Interview Slot
**POST** `/interviews/slots/book/`
```json
{
  "slot_id": "integer",
  "course_id": "integer"
}
```

#### My Interview Bookings
**GET** `/interviews/slots/my-bookings/`

#### Tutor Interview Slots
**GET** `/interviews/slots/tutor-slots/`

#### Create Interview Slots (Tutors only)
**POST** `/interviews/slots/create/`
```json
{
  "date": "YYYY-MM-DD",
  "start_time": "HH:MM",
  "end_time": "HH:MM",
  "duration": "integer (minutes)"
}
```

## WebSocket Endpoints

### Chat
`ws://localhost:8000/ws/chat/{room_name}/`

Message format:
```json
{
  "message": "string",
  "username": "string"
}
```

### Video Call
`ws://localhost:8000/ws/video-call/{call_id}/`

Message formats:
```json
// Offer
{
  "action": "offer",
  "offer": "RTCSessionDescription",
  "username": "string"
}

// Answer
{
  "action": "answer",
  "answer": "RTCSessionDescription",
  "username": "string"
}

// ICE Candidate
{
  "action": "ice-candidate",
  "candidate": "RTCIceCandidate",
  "username": "string"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "field_name": ["Error message"]
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

## Success Responses

### 200 OK
Standard successful response with requested data

### 201 Created
```json
{
  "id": "integer",
  "field_name": "value",
  ...
}
```

### 204 No Content
Successful deletion or update with no response body

## Rate Limiting
API requests are limited to 1000 requests per hour per IP address.

## Testing
Use the provided test scripts:
- `test_api.py` - Basic API functionality test
- `test_admin.py` - Admin authentication test
- `setup_test_users.py` - Setup test users