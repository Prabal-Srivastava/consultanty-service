# Student Management System

A comprehensive student management system with Django backend and Next.js frontend featuring real-time chat, payment integration, quizzes, and interview preparation.

## Features

### Backend (Django)
- **User Management**: Student, Tutor, and Admin roles with JWT authentication
- **Course Management**: Create courses, enroll students, track progress
- **Quiz System**: Create and take quizzes with automatic grading
- **Payment Integration**: Stripe payment processing with installment plans
- **Real-time Chat**: WebSocket-based messaging with Django Channels
- **Video Calls**: WebRTC-based one-on-one video calling
- **Interview Preparation**: Mock interviews with scheduling system
- **Money Back Guarantee**: 50% payment upfront, 50% after job offer

### Frontend (Next.js)
- **Modern UI**: Built with Tailwind CSS and React components
- **Real-time Updates**: WebSocket integration for chat and notifications
- **Payment Forms**: Stripe integration with secure checkout
- **Responsive Design**: Mobile-friendly interface
- **State Management**: React hooks and context API

## Technology Stack

### Backend
- Django 6.0
- Django REST Framework
- Django Channels
- SQLite (primary) / MongoDB (fallback)
- Stripe API
- JWT Authentication

### Frontend
- Next.js 14
- React 18
- Tailwind CSS
- Axios for API calls
- WebSocket for real-time features

## Setup Instructions

### Backend Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd student_management_system
```

2. **Create virtual environment**
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
```bash
# Copy .env.example to .env and update values
cp .env.example .env
# Edit .env file with your configuration
```

5. **Run migrations**
```bash
python manage.py makemigrations
python manage.py migrate
```

6. **Create superuser**
```bash
python manage.py createsuperuser
```

7. **Run the server**
```bash
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd ../student_management_frontend
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Configure environment variables**
```bash
# Create .env.local file
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

4. **Run the development server**
```bash
npm run dev
# or
yarn dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/verify-email/` - Email verification
- `GET /api/auth/profile/` - User profile

### Courses
- `GET /api/courses/courses/` - List courses
- `POST /api/courses/courses/` - Create course (tutors only)
- `POST /api/courses/courses/{id}/enroll/` - Enroll in course

### Quizzes
- `GET /api/quizzes/quizzes/` - List quizzes
- `POST /api/quizzes/quizzes/{id}/start/` - Start quiz
- `POST /api/quizzes/attempts/{id}/submit/` - Submit answer

### Payments
- `POST /api/payments/create-payment-intent/` - Create payment
- `POST /api/payments/confirm/` - Confirm payment
- `POST /api/payments/{id}/refund/` - Request refund

### Chat
- `GET /api/chat/rooms/` - List chat rooms
- `POST /api/chat/rooms/create/` - Create chat room
- WebSocket: `ws://localhost:8000/ws/chat/{room_name}/`

### Interviews
- `GET /api/interviews/mock-interviews/` - List interviews
- `POST /api/interviews/slots/available/` - Available slots
- `POST /api/interviews/slots/book/` - Book interview

## Payment Flow

1. Student enrolls in course
2. 50% payment required upfront via Stripe
3. Second 50% due after job offer
4. Money back guarantee if no job offer within 90 days
5. Refund processed automatically through Stripe

## Real-time Features

### Chat System
- WebSocket connections for instant messaging
- Support chat with tutors/admins
- Message history and read receipts

### Video Calls
- WebRTC for peer-to-peer video calling
- Screen sharing capabilities
- Call recording (optional)

## Deployment

### Backend Deployment
```bash
# Collect static files
python manage.py collectstatic

# Set DEBUG=False in production
# Configure production database
# Set up SSL certificates
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to production
```

## Testing

```bash
# Run backend tests
python manage.py test

# Run frontend tests
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.