# Student Management System - Frontend

A modern Next.js frontend for the Student Management System with real-time features, payment integration, and comprehensive dashboard functionality.

## Features

### Authentication & User Management
- User registration with role selection (Student, Tutor, Admin)
- JWT-based authentication with automatic token refresh
- Protected routes based on user roles
- Profile management with avatar upload

### Dashboard
- Role-specific dashboards (Student, Tutor, Admin)
- Real-time notifications and updates
- Progress tracking and analytics
- Quick access to enrolled courses and upcoming interviews

### Course Management
- Course browsing and enrollment
- Interactive course materials
- Progress tracking
- Course completion certificates

### Quiz System
- Interactive quiz interface
- Real-time scoring and feedback
- Multiple question types (MCQ, True/False, Short Answer)
- Performance analytics

### Payment Integration
- Stripe payment processing
- Installment payment system (50% upfront, 50% after job offer)
- Money-back guarantee management
- Payment history and receipts

### Real-time Communication
- WebSocket-based chat system
- One-on-one messaging
- Support chat with tutors/admins
- Real-time notifications

### Video Calling
- WebRTC-based video conferencing
- Screen sharing capabilities
- Call recording (optional)
- Interview preparation sessions

### Interview Preparation
- Mock interview scheduling
- Interview slot booking system
- Performance feedback and ratings
- Interview history and analytics

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API + Hooks
- **HTTP Client**: Axios
- **Real-time**: WebSocket API
- **Payments**: Stripe.js
- **UI Components**: Custom components with React Icons
- **Charts**: Recharts for data visualization
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Backend API running (see backend README)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd student_management_frontend
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
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

4. **Run development server**
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # App Router pages
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── dashboard/         # Dashboard pages
│   │   ├── student/       # Student dashboard
│   │   ├── tutor/         # Tutor dashboard
│   │   └── admin/         # Admin dashboard
│   ├── courses/           # Course pages
│   ├── quizzes/           # Quiz pages
│   ├── chat/              # Chat interface
│   ├── payments/          # Payment pages
│   └── interviews/        # Interview pages
├── components/            # Reusable components
│   ├── Layout/            # Layout components
│   ├── UI/                # UI components
│   ├── Chat/              # Chat components
│   ├── Payment/           # Payment components
│   └── Dashboard/         # Dashboard components
├── hooks/                 # Custom hooks
│   ├── useAuth.ts         # Authentication hook
│   ├── useWebSocket.ts    # WebSocket hook
│   └── usePayment.ts      # Payment hook
├── lib/                   # Utility functions
│   ├── api.ts             # API client
│   └── utils.ts           # Helper functions
└── styles/                # Global styles
```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Key Components

### Authentication Flow
- Protected routes with automatic redirection
- Token refresh mechanism
- Role-based access control
- Session management

### Real-time Features
- WebSocket connections for chat
- Real-time notifications
- Live progress updates
- Instant messaging

### Payment System
- Stripe integration for secure payments
- Installment payment processing
- Money-back guarantee handling
- Payment history tracking

### Responsive Design
- Mobile-first approach
- Responsive layouts for all screen sizes
- Touch-friendly interfaces
- Accessible components

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Deployment

### Production Deployment
1. Build the project
2. Deploy to your preferred hosting providerautomatically on pushes to main branch

### Manual Deployment
```bash
npm run build
npm run start
```

## API Integration

The frontend integrates with the Django REST API:
- Base URL: `http://localhost:8000/api`
- Authentication: JWT Bearer tokens
- Real-time: WebSocket connections
- Payments: Stripe API integration

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.