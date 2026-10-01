# CloudPMS Frontend Specification

## 1. Project Overview
**CloudPMS** (Cloud-Based Campus Placement Management System) is a comprehensive web application designed to streamline the campus recruitment process. The frontend is a Single Page Application (SPA) built with React 19, Vite, and a fully tokenised premium SaaS design system featuring intentional Light and Dark modes.

---

## 2. Technology Stack
- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS v3 + global CSS token system (`index.css` v2)
- **State Management**: React Context API (`AuthContext`)
- **API Client**: Axios (centralised instance with JWT interceptors)
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Authentication**: JWT (access + refresh tokens) + Google OAuth (`@react-oauth/google`)

---

## 3. Design System & Aesthetics

### 3.1 Global Token System
All colours are defined as CSS custom properties in `index.css` under `:root` (light mode) and `.dark` (dark mode). Tailwind is configured in `tailwind.config.js` to consume these variables so every utility class is theme-aware.

| Token Group | Variables |
|---|---|
| Backgrounds | `--bg-page`, `--bg-surface`, `--bg-surface-2`, `--bg-input`, `--bg-elevated` |
| Borders | `--border`, `--border-strong` |
| Text | `--text`, `--text-muted`, `--text-subtle` |
| Accent | `--accent`, `--accent-hover`, `--accent-soft` |
| Semantic | `--success-*`, `--warning-*`, `--error-*`, `--info-*`, `--purple-*` |
| Shadows | `--shadow-xs/sm/md/lg`, `--nav-shadow` |
| Hero Band | `--hero-bg`, `--hero-text`, `--hero-muted` |

Dark mode is toggled by adding the `dark` class to `<html>` via `ThemeToggle.jsx`. Preference is persisted in `localStorage`.

### 3.2 Typography
- **Headings**: `Playfair Display` (Serif — elegance and authority)
- **UI / Body**: `Inter` (Clean, highly readable sans-serif)
- **Data / Stats**: `DM Mono` (Monospace for numbers, tags, roll numbers, CGPA)

### 3.3 Colour Palette
| Token | Light Value | Dark Value |
|---|---|---|
| `--bg-page` | `#F8F9FB` | `#0D1117` |
| `--bg-surface` | `#FFFFFF` | `#161B22` |
| `--bg-surface-2` | `#F1F3F7` | `#21262D` |
| `--text` | `#111827` | `#E6EDF3` |
| `--text-muted` | `#4B5563` | `#8B949E` |
| `--accent` | `#F97316` | `#F97316` |
| `--hero-bg` | `#172B4D` | `#161B22` |

### 3.4 Component Patterns
- **`cpm-card`**: Token-driven surface card — `--bg-surface` background, `--border` border, `--shadow-xs` by default, elevated on hover.
- **`btn-primary`**: Orange accent fill, `#fff` text, 6px radius.
- **`btn-secondary`**: `--bg-surface-2` background, `--text` colour, `--border` border.
- **`form-input` / `form-select` / `form-textarea`**: All consume `--bg-input`, `--text`, `--border`, and focus ring via `--accent`.
- **`cpm-table`**: Scoped table styles — `--bg-surface-2` headers, `--border` dividers, hover rows.
- **`StatusBadge`**: Semantic colour chips using `--success-*`, `--warning-*`, `--error-*`, `--purple-*`, `--info-*` tokens.
- **`Avatar`**: Deterministic HSL-coloured initials avatar.
- **`PageHero`**: Dark band at top of each page, always rendered with `--hero-bg` (intentionally dark in both themes).
- **`EmptyState`**: Centred icon + heading + body for empty list views.

### 3.5 Utility Helpers
- `filterTabClass(isActive)` / `filterTabStyle(isActive)` — filter pill button helpers, defined in `src/utils/uiHelpers.js` and re-exported from `src/components/common/UI.jsx`.

---

## 4. Application Architecture

### 4.1 Public/Auth Portal
- **Login (`/login`)**: Split-screen. Left brand panel uses hardcoded navy (`#172B4D`) so it is always dark regardless of the site's light/dark setting. Right panel contains email/password form and Google OAuth.
- **Register (`/register`)**: Similar split-screen with role selection.

### 4.2 Student Portal
- **Profile (`/student/profile`)**: Academic profile, resume upload status, key metrics.
- **Drives (`/student/drives`)**: Eligible drives with status filters and apply flow.
- **Applications (`/student/applications`)**: Application tracker with full status history.

### 4.3 Placement Cell Portal
- **Manage Drives (`/placement/drives`)**: Drive creation, editing, closing, and status filtering. Uses `getMyDrives` from `placementApi`.
- **Drive Pipeline (`/placement/drives/:driveId/applicants`)**: Horizontal recruiter pipeline workspace (`Applied → Shortlisted → Interview → Selected/Rejected`) with candidate cards, action buttons, and a detail side-drawer.
- **Interviews (`/placement/interviews`)**: Dedicated interview-management workspace. Aggregates all scheduled interviews across all active drives. Features a vertical timeline layout with Today/Upcoming/Completed filters, company search, candidate detail drawer, and Select/Reject/Reschedule actions.
- **Communication Center (`/placement/communication`)**: Two-tab interface:
  - **Compose Email**: Select recipient mode (custom addresses, drive-based: all/shortlisted/interview/selected), drive selector, subject, message. All emails sent through SES.
  - **Email History**: Paginated log table with search, type filter (manual/application_confirmation/status_update), status filter (sent/failed). Detail modal shows From, To, Recipients, Subject, Message preview (always rendered in light mode — SES templates have hardcoded light inline styles).

### 4.4 Admin Portal
- **Dashboard (`/admin/dashboard`)**: System-wide KPIs — user count, drive count, application stats, placement rate.
- **Users (`/admin/users`)**: Paginated user table with role filter and account toggle.
- **Reports (`/admin/reports`)**: Drive-wise application and selection summary.

---

## 5. Routing & Layout

| Route | Component | Guard |
|---|---|---|
| `/login` | `Login.jsx` | `PublicRoute` |
| `/register` | `Register.jsx` | `PublicRoute` |
| `/student/drives` | `student/Drives.jsx` | `ProtectedRoute(['student'])` |
| `/student/applications` | `student/Applications.jsx` | `ProtectedRoute(['student'])` |
| `/student/profile` | `student/Profile.jsx` | `ProtectedRoute(['student'])` |
| `/placement/drives` | `placement/ManageDrives.jsx` | `ProtectedRoute(['placement_cell'])` |
| `/placement/drives/:driveId/applicants` | `placement/DriveApplicants.jsx` | `ProtectedRoute(['placement_cell'])` |
| `/placement/interviews` | `placement/Interviews.jsx` | `ProtectedRoute(['placement_cell'])` |
| `/placement/communication` | `placement/CommunicationCenter.jsx` | `ProtectedRoute(['placement_cell'])` |
| `/admin/dashboard` | `admin/AdminDashboard.jsx` | `ProtectedRoute(['admin'])` |
| `/admin/users` | `admin/Users.jsx` | `ProtectedRoute(['admin'])` |
| `/admin/reports` | `admin/Reports.jsx` | `ProtectedRoute(['admin'])` |

- **`AppLayout`**: Wraps all protected routes with `Navbar` and `Footer`.
- **`Navbar`**: Role-aware nav links; includes theme toggle (`ThemeToggle.jsx`).
- **Full-Screen Auth**: Navbar and Footer are excluded from login/register pages.

---

## 6. API Integration

- **`src/api/axiosInstance.js`**: Attaches `Authorization: Bearer <token>` header. Response interceptor handles 401 → token refresh flow.
- **`src/api/placementApi.js`**: `createDrive`, `getMyDrives`, `updateDrive`, `closeDrive`, `getDriveApplicants`, `updateAppStatus`.
- **`src/api/emailApi.js`**: `sendEmail`, `getEmailLogs`.
- **`src/api/studentApi.js`**: Profile, resume upload, drives, applications.
- **`src/api/adminApi.js`**: Dashboard stats, user management, reports.

---

## 7. Email & Persistence

- Every email sent through SES (manual or automatic) is logged in MongoDB via the `EmailLog` model.
- Fields: `senderEmail`, `recipients[]`, `subject`, `messageText`, `type` (manual/application_confirmation/status_update), `status` (sent/failed), `relatedDriveId`, `relatedApplicationIds`, `sentBy`, `errorMessage`, `createdAt`.
- Automatic emails are triggered from `student.controller.js` (application confirmation) and `placement.controller.js` (status updates) — both call the shared `sendEmail()` utility in `awsServices.js` which handles SES dispatch and MongoDB logging atomically.
- Failed deliveries are logged with `status: 'failed'` and the SES error message.
- The Communication Center Email History tab queries this collection server-side with search, type, and status filters plus pagination.

---

## 8. Known Design Decisions & Caveats

| Decision | Rationale |
|---|---|
| Login left panel uses hardcoded `#172B4D` | The `--navy-600` CSS variable is remapped to a light colour in dark mode for text use. The brand panel is always dark. |
| Email preview always uses light background | SES email templates contain hardcoded inline CSS with light colours. Rendering them on a dark background causes broken appearance. |
| `fixed` modals must not be inside `animate-fade-rise` containers | CSS animations with `transform` create a new stacking context, trapping `position: fixed` children inside the animated element instead of the viewport. |
| `filterTabClass`/`filterTabStyle` live in `utils/uiHelpers.js`, re-exported from `UI.jsx` | Shared across multiple Placement Cell pages without duplication. |


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
