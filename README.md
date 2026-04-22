# SaaS License Management System

A comprehensive license management system built with React, Tailwind CSS, and Firebase. This system provides role-based access control (RBAC) with three distinct user roles: Super Admin, Admin, and User.

## 🚀 Features

### Role-Based Access Control (RBAC)
- **Super Admin**: Full system access, can create Admins and Users, manage licenses, view audit logs
- **Admin (Manager)**: Can create Users (clients), view their created users (restricted access)
- **User (Client)**: View-only access to their license dashboard

### Core Functionality
- ✅ Firebase Authentication with email/password
- ✅ Auto-generated Custom User IDs (format: `ABCD-1234-X`)
- ✅ Auto-generated License Keys (format: `XXXXX-XXXXX-XXXXX-XXXXX-XXXXX`)
- ✅ License expiry tracking with color-coded status badges
- ✅ Automatic login blocking for expired/suspended accounts
- ✅ Comprehensive audit logging system
- ✅ User suspension/activation functionality
- ✅ Responsive design with mobile sidebar

### Status Badges
- 🟢 **Active**: License is valid with > 7 days remaining
- 🟡 **Expiring Soon**: License expires in ≤ 7 days
- 🔴 **Expired**: License has expired
- ⚫ **Suspended**: Account manually suspended by Super Admin

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase Project (with Firestore and Authentication enabled)

## 🛠️ Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd saas-license-system
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Firebase:**
   - Open `src/utils/firebase.js`
   - Replace the placeholder values with your Firebase project credentials:
     ```javascript
     const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.appspot.com",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
     };
     ```

## 🔥 Firebase Setup

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Once created, click on "Web" icon (</>) to add a web app
4. Register your app and copy the configuration

### Step 2: Enable Authentication
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider
3. Click "Save"

### Step 3: Create Firestore Database
1. Go to **Firestore Database** → **Create database**
2. Select **Start in production mode** (we'll add custom rules)
3. Choose a location close to your users
4. Click "Done"

### Step 4: Set up Firestore Collections
The collections will be created automatically when you create your first user. The schema is:

**users** collection:
- `uid` (String)
- `email` (String)
- `role` (String: 'super_admin', 'admin', 'user')
- `firstName`, `lastName`, `companyName` (Strings)
- `customId` (String: e.g., ABCD-1234-X)
- `licenseKey` (String: 25 characters)
- `serverUrl` (String)
- `startDate`, `expiryDate` (Timestamps)
- `status` (String: 'active' or 'suspended')
- `createdBy` (UID of creator)
- `createdAt` (Timestamp)

**auditLogs** collection:
- `timestamp` (Timestamp)
- `action` (String)
- `performedBy` (String)
- `performedByEmail` (String)
- `targetUser` (String)
- `details` (String)
- `metadata` (Object)

### Step 5: Create First Super Admin (Manual)
Since there's no signup flow for Super Admins, you need to create the first one manually:

1. In Firebase Console, go to **Authentication** → **Users**
2. Click "Add user"
3. Enter email and password
4. Copy the User UID
5. Go to **Firestore Database** → **users** collection → "Add document"
6. Use the User UID as the Document ID
7. Add these fields:
   ```
   uid: [paste the UID]
   email: [your email]
   role: "super_admin"
   firstName: "Your First Name"
   lastName: "Your Last Name"
   companyName: "System"
   logoUrl: "https://via.placeholder.com/150"
   customId: "ADMIN-0000-S"
   licenseKey: "ADMIN-SUPER-ADMIN-00000"
   serverUrl: "https://admin.example.com"
   startDate: [current date as Timestamp]
   expiryDate: [future date as Timestamp, e.g., 1 year from now]
   status: "active"
   createdBy: [same UID]
   createdAt: [current timestamp]
   ```

### Step 6: Firestore Security Rules (Recommended)
In **Firestore Database** → **Rules**, add these rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Allow users to read their own document
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Allow super_admins to read and write all user documents
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
      
      // Allow admins to read and write users they created
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' &&
        resource.data.createdBy == request.auth.uid;
    }
    
    // Audit logs - only super_admins can read
    match /auditLogs/{logId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
      allow write: if request.auth != null;
    }
  }
}
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

### Production Build
```bash
npm run build
```
This creates an optimized build in the `dist` folder.

### Preview Production Build
```bash
npm run preview
```

## 📱 Using the System

### Login
1. Navigate to the login page
2. Enter email and password
3. The system will:
   - Check if license is expired
   - Check if account is suspended
   - Block access if either condition is true
   - Redirect to appropriate dashboard based on role

### Super Admin Actions
- Create Admin and User accounts
- Edit all user details (including license keys, expiry dates)
- Suspend/activate any user
- View all users in the system
- Access audit logs
- Manage license configurations

### Admin Actions
- Create User (client) accounts only
- View users they created
- Edit basic information (name, company) of their users
- **Cannot** edit license keys, expiry dates, or server URLs

### User (Client) Actions
- View their license information
- See license status and days remaining
- Copy license key to clipboard
- Access their server URL
- View company information

## 🎨 Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Backend**: Firebase (Authentication + Firestore)
- **Language**: JavaScript

## 📂 Project Structure

```
saas-license-system/
├── src/
│   ├── components/
│   │   ├── auth/          # Login, ProtectedRoute
│   │   ├── dashboard/     # Role-specific dashboards
│   │   ├── layout/        # Sidebar
│   │   └── users/         # User management components
│   ├── context/           # AuthContext
│   ├── utils/             # Firebase, helpers, generators
│   ├── App.jsx            # Main app with routing
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles + Tailwind
├── public/
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🔐 Security Features

- Email/password authentication via Firebase
- Role-based access control (RBAC)
- Protected routes based on user roles
- Automatic session management
- License expiry validation on login
- Account suspension functionality
- Audit logging for all critical actions

## 🎯 Key Business Logic

### License Expiry Check
- **Active**: > 7 days remaining
- **Expiring Soon**: ≤ 7 days remaining (yellow badge)
- **Expired**: Past expiry date (red badge, login blocked)

### Suspension Logic
- Super Admin can manually suspend any user
- Suspended users cannot login
- Status badge shows "Suspended"

### Auto-Generators
- **Custom ID**: `ABCD-1234-X` (4 letters, 4 digits, 1 letter)
- **License Key**: `XXXXX-XXXXX-XXXXX-XXXXX-XXXXX` (25 chars, unique)

## 📝 Notes

- The first Super Admin must be created manually in Firebase Console
- License keys are automatically generated and guaranteed unique
- All system actions are logged in the `auditLogs` collection
- Users can only see data relevant to their role
- Mobile-responsive sidebar with hamburger menu

## 🐛 Troubleshooting

### Firebase Connection Issues
- Verify your Firebase config in `src/utils/firebase.js`
- Check that Authentication and Firestore are enabled
- Ensure your Firebase project billing is active (if using Blaze plan)

### Login Issues
- Check that the user exists in Firebase Authentication
- Verify the user document exists in Firestore
- Ensure the user's role is set correctly
- Check if account is suspended or expired

### Build Issues
- Run `npm install` to ensure all dependencies are installed
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for console errors in browser developer tools

## 📄 License

This project is for educational and commercial use.

## 👨‍💻 Support

For issues or questions, please contact your system administrator.
