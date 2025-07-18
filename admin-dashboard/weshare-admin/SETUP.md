# WeShare Admin Dashboard Setup Guide

This guide will help you set up the WeShare Admin Dashboard with real backend integration.

## Prerequisites

- Node.js 18+ installed
- WeShare backend server running on port 5005
- MongoDB database running
- Git repository cloned

## Step 1: Backend Setup

### 1.1 Update User Model
The user model has been updated to support `super_admin` role and `status` field. Make sure the changes are applied:

```javascript
// In weshare-server/src/models/user.js
role: { type: String, enum: ['user', 'agency_employee', 'super_admin'], default: 'user' },
status: { type: String, enum: ['active', 'suspended'], default: 'active' },
```

### 1.2 Create Super Admin User
Run the super admin creation script:

```bash
cd weshare-server
node scripts/createSuperAdmin.js
```

This will create a super admin user with these credentials:
- **Email**: admin@weshare.com
- **Password**: admin123456
- **Contact**: +250780000000

### 1.3 Verify Backend Routes
Make sure these routes are available in your backend:
- `POST /api/auth/login` - Admin login
- `GET /api/admin/users` - Fetch all users
- `PUT /api/admin/users/:id/status` - Update user status
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/stats` - Get system statistics

## Step 2: Frontend Setup

### 2.1 Install Dependencies
```bash
cd admin-dashboard/weshare-admin
npm install
```

### 2.2 Environment Configuration
Create a `.env.local` file in the admin dashboard root:

```env
NEXT_PUBLIC_API_URL=http://localhost:5005/api
```

### 2.3 Start Development Server
```bash
npm run dev
```

The admin dashboard will be available at: http://localhost:3000

## Step 3: First Login

1. Open http://localhost:3000 in your browser
2. You'll be redirected to the login page
3. Use the super admin credentials:
   - **Email**: admin@weshare.com
   - **Password**: admin123456
4. Click "Sign in"
5. You'll be redirected to the admin dashboard

## Step 4: Verify Functionality

### 4.1 User Management
- View all users in the table
- Check user statistics in the cards
- Verify user roles and statuses

### 4.2 Firebase Monitoring
- Click on Firebase monitoring links
- Verify they open the correct dashboards

### 4.3 Authentication
- Try accessing `/admin` directly without login (should redirect to login)
- Test logout functionality
- Verify token persistence across page refreshes

## Troubleshooting

### Common Issues

1. **Login Fails**
   - Check if super admin user exists: `node scripts/createSuperAdmin.js`
   - Verify backend is running on port 5005
   - Check browser console for errors

2. **API Errors**
   - Verify `NEXT_PUBLIC_API_URL` in `.env.local`
   - Check backend server logs
   - Ensure CORS is configured properly

3. **No Users Displayed**
   - Check if users exist in the database
   - Verify admin routes are working
   - Check browser network tab for API calls

4. **CORS Errors**
   - Ensure backend CORS configuration allows requests from `http://localhost:3000`
   - Check if backend is running and accessible

### Debug Mode

Enable debug logging by adding to `.env.local`:
```env
NEXT_PUBLIC_DEBUG=true
```

### Backend Logs

Check backend server logs for any errors:
```bash
cd weshare-server
npm start
```

## Security Notes

1. **Change Default Password**: After first login, change the super admin password
2. **Environment Variables**: Never commit `.env.local` to version control
3. **HTTPS**: Use HTTPS in production
4. **Token Security**: JWT tokens expire after 1 hour
5. **Access Control**: Only super admin users can access the dashboard

## Production Deployment

1. **Build the Application**:
   ```bash
   npm run build
   ```

2. **Set Production Environment**:
   ```env
   NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
   ```

3. **Start Production Server**:
   ```bash
   npm start
   ```

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify backend server logs
3. Ensure all prerequisites are met
4. Check network connectivity between frontend and backend

## Next Steps

After successful setup, you can:
- Customize the dashboard design
- Add more admin features
- Implement user search and filtering
- Add bulk operations
- Create audit logs
- Add more statistics and analytics 