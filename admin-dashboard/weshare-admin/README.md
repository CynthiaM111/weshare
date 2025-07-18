# WeShare Admin Dashboard

A modern admin dashboard for managing WeShare users and system activity, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **🔐 Authentication System**: Secure login for super admin users
- **👥 User Management**: View all users with detailed information
- **📊 Statistics Dashboard**: Real-time stats for total users, active users, suspended users, and agency employees
- **🔥 Firebase Monitoring**: Quick access to Crashlytics, Performance, and Analytics dashboards
- **🛡️ Protected Routes**: Automatic authentication checks and redirects
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **⚡ Loading States**: Smooth loading animations and error handling
- **🔗 Real API Integration**: Connected to WeShare backend with authentication

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons (SVG)
- **State Management**: React Context API
- **Authentication**: JWT tokens with localStorage
- **API**: Fetch API with automatic token handling

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- WeShare backend server running on port 5005

### Installation

1. Navigate to the admin dashboard directory:
   ```bash
   cd admin-dashboard/weshare-admin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   # Create .env.local file
   echo "NEXT_PUBLIC_API_URL=http://localhost:5005/api" > .env.local
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

The app will automatically redirect to `/login` where you can sign in with super admin credentials.

## Authentication

### Super Admin Access

The admin dashboard requires super admin privileges. Users must have the `super_admin` role to access the dashboard.

### Login Flow

1. **Login Page**: Users enter email and password
2. **Role Check**: System verifies the user has `super_admin` role
3. **Token Storage**: JWT token is stored in localStorage
4. **Protected Routes**: All admin pages check for valid authentication
5. **Auto Logout**: Expired tokens automatically redirect to login

### Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Only super admin users can access
- **Automatic Token Refresh**: Handles expired tokens gracefully
- **Secure Storage**: Tokens stored in localStorage with automatic cleanup

## API Integration

The dashboard is fully integrated with the WeShare backend API:

### Required Backend Endpoints

The dashboard expects these endpoints from your WeShare backend:

- `POST /api/auth/login` - Admin login
- `GET /api/admin/users` - Fetch all users
- `PUT /api/admin/users/:id/status` - Update user status
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/stats` - Get system statistics

### Authentication Headers

All API requests include:
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <jwt_token>'
}
```

### User Data Structure

```typescript
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'agency_employee' | 'super_admin';
  status: 'active' | 'suspended';
  contact_number?: string;
  createdAt?: string;
}
```

## Project Structure

```
src/
├── app/
│   ├── admin/
│   │   └── page.tsx          # Main admin dashboard page
│   ├── login/
│   │   └── page.tsx          # Login page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout with AuthProvider
│   └── page.tsx              # Home page (redirects to login)
├── components/
│   └── ProtectedRoute.tsx    # Authentication wrapper
├── contexts/
│   └── AuthContext.tsx       # Authentication state management
├── lib/
│   └── api.ts               # API utilities and authentication
└── types/                   # TypeScript type definitions
```

## Features in Detail

### User Table
- **User ID**: Unique identifier for each user
- **Name**: Full name of the user
- **Email**: User's email address
- **Contact**: Phone number (if available)
- **Role**: User role (User, Agency Employee, or Super Admin)
- **Status**: Account status (Active or Suspended)
- **Created**: Account creation date

### Statistics Cards
- **Total Users**: Count of all registered users
- **Active Users**: Count of users with active status
- **Suspended Users**: Count of users with suspended status
- **Agency Employees**: Count of users with agency_employee role

### Firebase Monitoring
- **Crashlytics**: Direct link to Firebase Crashlytics dashboard
- **Performance**: Direct link to Firebase Performance monitoring
- **Analytics**: Direct link to Google Analytics dashboard

### Loading and Error States
- **Loading**: Spinner animation while fetching data
- **Error**: User-friendly error messages with retry functionality
- **Empty State**: Helpful message when no users are found
- **Authentication Errors**: Automatic redirect to login on token expiry

## Environment Configuration

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:5005/api
```

## Development

### Adding New Features

1. **New Pages**: Create new directories in `src/app/`
2. **Components**: Create reusable components in `src/components/`
3. **API Functions**: Add new functions to `src/lib/api.ts`
4. **Types**: Define TypeScript interfaces in `src/types/`

### Authentication Flow

1. **Login**: User enters credentials on `/login`
2. **Validation**: Backend validates credentials and role
3. **Token**: JWT token returned and stored
4. **Protection**: All admin routes wrapped with `ProtectedRoute`
5. **Auto-logout**: Expired tokens trigger automatic logout

### Styling

The project uses Tailwind CSS for styling. All components follow a consistent design system:

- **Colors**: Blue primary (#0a2472), gray neutrals
- **Spacing**: Consistent padding and margins
- **Shadows**: Subtle shadows for depth
- **Responsive**: Mobile-first responsive design

## Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Environment Variables

For production, set the environment variable to your production API URL:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

## Backend Requirements

Your WeShare backend must support:

1. **Super Admin Role**: User model with `super_admin` role
2. **JWT Authentication**: Token-based authentication system
3. **Admin Endpoints**: Protected routes for admin operations
4. **CORS**: Allow requests from admin dashboard domain

## Future Enhancements

- [ ] User search and filtering
- [ ] Bulk user operations
- [ ] User activity logs
- [ ] Real-time notifications
- [ ] Export functionality
- [ ] Advanced analytics
- [ ] User profile management
- [ ] Password reset functionality
- [ ] Two-factor authentication
- [ ] Audit logs

## Troubleshooting

### Common Issues

1. **Login Fails**: Check if user has `super_admin` role
2. **API Errors**: Verify backend server is running on correct port
3. **CORS Errors**: Ensure backend allows requests from admin dashboard
4. **Token Expiry**: Tokens automatically refresh, but manual logout may be needed

### Debug Mode

Enable debug logging by adding to `.env.local`:
```env
NEXT_PUBLIC_DEBUG=true
```

## Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for new features
3. Include loading and error states
4. Test authentication flows
5. Update documentation as needed

## License

This project is part of the WeShare ecosystem and follows the same licensing terms.
