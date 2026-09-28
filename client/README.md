# CloudPMS Frontend (Client)

This directory contains the React-based frontend application for the **CloudPMS** (Cloud-Based Campus Placement Management System). 

## Technology Stack
- **Framework:** React 18
- **Build Tool:** Vite
- **Routing:** React Router v6
- **Styling:** Tailwind CSS + Custom CSS (`index.css`)
- **API Client:** Axios
- **State Management:** React Context API
- **Icons:** Lucide React
- **Notifications:** React Hot Toast
- **Auth:** Google OAuth (`@react-oauth/google`)

## Features & Portals
The application is split into role-specific portals with Protected Routes ensuring security:

1. **Public Portal**: Custom split-screen UI for Secure Login and Registration.
2. **Student Portal**: Manage profiles, upload resumes to AWS S3, apply for drives, and track application status.
3. **Placement Cell Portal**: Create and manage campus placement drives, review student applications, and change applicant statuses.
4. **Admin Portal**: Complete oversight, user verification, and role management.

## Setup Instructions

### 1. Environment Variables
Copy the `.env.example` file to a new `.env` file (if not already done).
```bash
cp .env.example .env
```
Ensure your `.env` contains the required variables:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
The application will be accessible at `http://localhost:5173`.

## Design System
The frontend follows a strictly defined design system outlined in the [`CloudPMS_Frontend_Specification_for_AI_Tool.md`](../CloudPMS_Frontend_Specification_for_AI_Tool.md) document in the project root. It heavily utilizes CSS custom properties and tailwind utility classes for a cohesive look featuring our signature Navy (`#172B4D`) and Orange (`#F28C00`) color palette.
