# CloudPMS Executive Business Brief

## Project Title
CloudPMS — Enterprise Cloud-Based Campus Placement Management System

## 1. Introduction
The Cloud-Based Campus Placement Management System (CloudPMS) is developed to demonstrate the practical, enterprise-grade implementation of cloud computing technologies. The platform aims to digitize and centralize the campus recruitment process, bridging the communication and workflow gaps between candidates, placement officers, and platform administrators.

## 2. Problem Statement
Traditional campus placement procedures involve manual tracking, physical resume submissions, and disjointed communication channels (emails, notice boards). This leads to inefficiencies, data loss, and delays in processing applications and updating students about their status.

## 3. Proposed Solution
CloudPMS provides a unified platform where:
- **Students** can maintain their profiles, upload resumes securely to the cloud, browse active placement drives, and track application statuses in real-time.
- **Placement Officers** can create and manage company drives, view applicant pools, shortlist candidates, and update statuses efficiently.
- **Administrators** possess full oversight of the system, managing users and analyzing overall placement metrics.

## 4. Cloud Computing Relevance
This project heavily emphasizes cloud architecture and managed services to ensure scalability, high availability, and security:
- **Compute & Hosting**: The backend is hosted on a managed PaaS (Render), while the frontend is deployed on Vercel utilizing Edge/Serverless functions.
- **Database as a Service (DBaaS)**: MongoDB Atlas is used for scalable, distributed data storage without the overhead of database administration.
- **Object Storage**: Amazon S3 is integrated for secure storage of static assets and user documents (e.g., PDF resumes).
- **Cloud APIs**: Utilization of Amazon SES for transactional email notifications and Amazon Textract for potential OCR capabilities on resumes.

## 5. System Architecture
The application follows a standard Three-Tier Architecture:
1. **Presentation Tier (Client)**: Developed in React.js (Vite) and styled with Tailwind CSS. It communicates with the backend via RESTful APIs.
2. **Logic Tier (Server)**: A Node.js/Express application handling business logic, authentication (JWT), and interactions with AWS services.
3. **Data Tier (Database)**: MongoDB Atlas clusters storing relational-like document structures for Users, Drives, and Applications.

## 6. Implementation Highlights
- **Role-Based Access Control (RBAC)**: Strict separation of concerns between Students, Placement Cell, and Admin roles.
- **Secure Authentication**: Implementation of JWT-based authentication with access and refresh tokens.
- **Modern UI/UX**: A custom design system focusing on readability and professional aesthetics, leveraging responsive design principles for mobile and desktop accessibility.

## 7. Conclusion
CloudPMS successfully demonstrates the application of modern web development and cloud computing principles to solve a real-world institutional problem. The use of cloud services ensures the system can handle traffic spikes during peak placement seasons while maintaining data integrity and security.
