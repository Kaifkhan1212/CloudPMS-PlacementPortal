# CloudPMS Comprehensive Project Report

## 1. Executive Summary
**CloudPMS** is a cloud-based Campus Placement Management System developed to centralize and automate the recruitment workflow for educational institutions. Designed with scalability and user experience in mind, the system serves three primary stakeholders: Students, Placement Cell Officers, and Administrators.

## 2. Project Objectives
- **Digitization**: To move from paper-based and disjointed digital communications to a centralized database.
- **Transparency**: To allow students to track their application statuses in real-time.
- **Efficiency**: To provide placement officers with robust tools to manage drives, filter applicants, and update statuses in bulk.
- **Cloud Integration**: To leverage managed cloud services (AWS, MongoDB Atlas, Vercel, Render) for high availability, reducing the need for on-premise infrastructure.

## 3. Technology Stack and Architecture

### 3.1. Frontend Architecture
The frontend is built using **React 18** and **Vite**.
- **State Management**: Context API is used for global state (e.g., AuthContext).
- **Styling**: Tailwind CSS is used for rapid, utility-first styling, complemented by a custom design system defining specific brand colors (Navy and Orange) and typography (Playfair Display and DM Sans).
- **Routing**: `react-router-dom` handles client-side routing, protected routes, and role-based access control.

### 3.2. Backend Architecture
The backend is a RESTful API built with **Node.js** and **Express**.
- **Database**: **MongoDB**, managed via **MongoDB Atlas**. Mongoose is used as the ODM for schema validation and relationships.
- **Authentication**: Custom JWT (JSON Web Tokens) implementation with access and refresh tokens for secure sessions. Google OAuth integration is also supported via `@react-oauth/google`.
- **Validation**: Request payloads are validated using middleware before processing.

### 3.3. Cloud Infrastructure (AWS)
- **Amazon S3**: Used for storing student resumes and profile pictures. Access is controlled via presigned URLs or direct backend uploads.
- **Amazon SES**: Configured for sending automated emails to students regarding drive announcements and application status changes.
- **Amazon Textract**: Integrated to extract structured data from uploaded resumes, minimizing manual data entry for students.

## 4. Key Modules and Features

### 4.1. Authentication Module
- Secure registration and login.
- Split-screen UI design for public pages.
- Role selection during registration (Student vs Placement Cell).

### 4.2. Student Module
- **Profile Management**: Students can update personal details, academic scores, and upload resumes.
- **Drive Discovery**: A dashboard showing active and upcoming placement drives.
- **Application Tracking**: A dedicated page displaying a timeline of application statuses (Applied → Shortlisted → Interview → Selected/Rejected).

### 4.3. Placement Cell Module
- **Drive Management**: Create new drives, specify eligibility criteria (e.g., minimum CGPA), and set deadlines.
- **Applicant Management**: View a tabular list of students who applied to a specific drive. Ability to change statuses, which triggers automated notifications.

### 4.4. Administrator Module
- Complete overview of the system.
- Ability to verify newly registered users, ensuring only authorized personnel and students access the platform.
- Generation of placement reports and analytics.

## 5. Security Measures
- Passwords are cryptographically hashed using `bcrypt` before storage.
- API endpoints are protected by JWT verification middleware.
- Role-based middleware ensures users can only access endpoints authorized for their specific role.
- AWS IAM roles are configured with the principle of least privilege.

## 6. Future Enhancements
- Integration of a real-time chat or ticketing system between students and the placement cell.
- Advanced analytics dashboard using data visualization libraries (e.g., Chart.js) to show year-over-year placement trends.
- Automated interview scheduling integrating with calendar APIs (Google Calendar/Outlook).

## 7. Conclusion
CloudPMS provides a robust, scalable, and user-friendly solution to a common administrative challenge in educational institutions. By adopting a modern tech stack and cloud-native architecture, the system is well-prepared for future growth and functional expansion.
