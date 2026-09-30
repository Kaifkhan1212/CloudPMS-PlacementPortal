# CloudPMS Frontend Specification

## 1. Project Overview
**CloudPMS** (Cloud-Based Campus Placement Management System) is a comprehensive web application designed to streamline the campus recruitment process. The frontend is built as a Single Page Application (SPA) utilizing modern web technologies and a custom design system.

## 2. Technology Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS (Utility-first) + Custom CSS (`index.css`)
- **State Management**: React Context API (`AuthContext`)
- **API Client**: Axios (with centralized instance and interceptors)
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Authentication**: JWT (JSON Web Tokens) + Google OAuth (`@react-oauth/google`)

## 3. Design System & Aesthetics
The application implements a premium, high-contrast, and professional aesthetic suitable for educational institutions and corporate placements. It features a complete **Light and Dark Mode** system backed by CSS variables (`--bg-primary`, `--text-primary`, etc.) and a React context for state persistence.

### Color Palette
- **Primary Navy**: `#172B4D` (Trust, corporate professionalism)
- **Accent Orange**: `#F28C00` (Energy, action, highlights)
- **Background Cream**: `#FAF8F2` (Warmth, readability, reducing eye strain)
- **Pure White**: `#FFFFFF` (Card backgrounds, clear separation)
- **Ink/Text**: `#1A1A1A` (Primary text color)

### Typography
- **Headings**: `Playfair Display` (Serif font for elegance and authority in large headers)
- **Body/UI**: `DM Sans` (Clean, highly readable sans-serif for forms, buttons, and data)
- **Data/Stats**: `DM Mono` (Monospace for numbers, tags, and specific data points)

### Component Patterns
- **Cards (`cpm-card`)**: White background, subtle 1px border, gentle shadow, used for enclosing forms, data tables, and application details.
- **Buttons (`btn-primary`, `btn-secondary`)**: Sharp corners (small border-radius), distinct hover states, micro-interactions on click.
- **Status Badges**: Color-coded pills indicating application states (e.g., Applied, Shortlisted, Selected, Rejected).

## 4. Application Architecture
The frontend is logically divided into specialized portals based on user roles:

### 4.1. Public/Auth Portal
- **Login (`/login`)**: Custom split-screen design. Left panel features branding and system highlights. Right panel contains the auth form.
- **Register (`/register`)**: Similar split-screen design. Form includes role selection (Student, Placement Cell).

### 4.2. Student Portal
- **Dashboard/Profile (`/student/profile`)**: Displays student details, resume status, and key metrics.
- **Drives (`/student/drives`)**: List of all available and upcoming placement drives with the ability to apply.
- **Applications (`/student/applications`)**: Tracker for the student's submitted applications, showing status updates.

### 4.3. Placement Cell Portal
- **Manage Drives (`/placement/drives`)**: Dashboard to create, edit, and monitor placement drives.
- **Drive Applicants (`/placement/drives/:driveId/applicants`)**: Detailed view of all students who applied to a specific drive, with the ability to update their statuses (e.g., Shortlist, Reject).

### 4.4. Admin Portal
- **Admin Dashboard (`/admin/dashboard`)**: High-level metrics and system overview.
- **Users Management (`/admin/users`)**: Table view to manage, verify, or block system users.

## 5. Routing & Layout
- **AppLayout**: A wrapper component applied to all protected routes. It includes the top `Navbar` and the bottom `Footer`.
- **PublicRoute**: Prevents authenticated users from accessing Login/Register pages.
- **ProtectedRoute**: Secures routes based on user roles. If a student tries to access a placement cell route, they are redirected.
- **Full-Screen Auth**: The `Navbar` and `Footer` are deliberately excluded from public authentication pages to maintain an immersive, distraction-free login experience.

## 6. API Integration Strategy
- **Axios Instance**: Located in `src/api/axiosInstance.js`. It automatically attaches the JWT `Authorization` header to every outgoing request.
- **Response Interceptor**: Global error handling. If a 401 Unauthorized error occurs (token expiration), the interceptor can attempt to refresh the token or redirect the user to the login page.
- **Environment Variables**: API base URL is configured via `import.meta.env.VITE_API_URL`.
