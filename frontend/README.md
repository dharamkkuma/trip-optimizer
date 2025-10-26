# Trip Optimizer Frontend

This is the frontend application for the Trip Optimizer platform, built with Next.js and React.

## Quick Start

### 🚀 Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000

### 👤 Admin Access

An admin user is **automatically created** when you start the project. Use these credentials to access the admin panel and manage all users:

- **Username**: `admin`
- **Password**: `Admin123!`
- **Email**: `admin@tripoptimizer.com`
- **Role**: Administrator (full user management access)

**Admin Features**:
- ✅ View and manage all users
- ✅ Reset user passwords
- ✅ Change user roles and status
- ✅ Delete users (except self)
- ✅ Search and filter users
- ✅ Access user management interface

### 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── LoginForm.tsx   # User login form
│   ├── RegisterForm.tsx # User registration form
│   ├── UserProfile.tsx # User profile management
│   ├── UserManagement.tsx # Admin user management
│   └── FileUpload.tsx  # File upload component
├── pages/              # Next.js pages
│   ├── _app.tsx       # App wrapper
│   └── index.tsx      # Main page
├── styles/            # Global styles
│   └── globals.css    # Tailwind CSS imports
└── utils/             # Utility functions
    └── api.ts         # API client functions
```

### 🎨 Styling

This project uses Tailwind CSS for styling. The design system includes:

- **Primary Colors**: Blue-based color scheme
- **Components**: Custom button styles, form inputs, cards
- **Responsive**: Mobile-first responsive design
- **Dark Mode**: Not implemented yet

### 🔌 API Integration

The frontend communicates with multiple backend services:

- **Auth API** (Port 8003): Authentication and user management
- **Database API** (Port 8002): User data operations
- **Backend API** (Port 8000): Core business logic
- **Storage API** (Port 8001): File uploads and storage

### 🚀 Deployment

The frontend is containerized and can be deployed using Docker:

```bash
# Build the Docker image
docker build -t trip-optimizer-frontend .

# Run the container
docker run -p 3000:3000 trip-optimizer-frontend
```

### 📝 Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:8003
```

### 🐛 Troubleshooting

**Common Issues**:

1. **Port 3000 already in use**:
   ```bash
   # Kill process using port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **API connection issues**:
   - Ensure all backend services are running
   - Check environment variables
   - Verify API endpoints are accessible

3. **Build errors**:
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run build
   ```

### 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Trip Optimizer Main README](../README.md)
