# CloudPMS — Formal Project Report

**Cloud-Based Campus Placement Management System**
MCA Final Year Project · DSCC / Cloud Computing
AWS Region: ap-south-1 (Mumbai)

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Problem Statement](#2-problem-statement)
3. [Objectives](#3-objectives)
4. [Proposed Solution](#4-proposed-solution)
5. [System Requirements](#5-system-requirements)
6. [Functional Modules](#6-functional-modules)
7. [User Roles](#7-user-roles)
8. [System Architecture](#8-system-architecture)
9. [Technology Stack](#9-technology-stack)
10. [Cloud Architecture](#10-cloud-architecture)
11. [AWS Services and Their Purpose](#11-aws-services-and-their-purpose)
12. [Database Design](#12-database-design)
13. [Authentication and RBAC](#13-authentication-and-rbac)
14. [Resume Upload and Processing Flow](#14-resume-upload-and-processing-flow)
15. [Textract Integration](#15-textract-integration)
16. [SES Notification Flow](#16-ses-notification-flow)
17. [EC2 Deployment](#17-ec2-deployment)
18. [Nginx and PM2 Configuration](#18-nginx-and-pm2-configuration)
19. [Testing](#19-testing)
20. [Security Measures](#20-security-measures)
21. [Results and Outcome](#21-results-and-outcome)
22. [Limitations](#22-limitations)
23. [Future Scope](#23-future-scope)
24. [Conclusion](#24-conclusion)

---

## 1. Introduction

CloudPMS (Cloud-Based Campus Placement Management System) is a full-stack web application developed as an MCA final year project under the DSCC / Cloud Computing curriculum. The system digitises and centralises the campus recruitment workflow for educational institutions, replacing fragmented manual processes with an integrated web-based platform hosted on Amazon Web Services.

The application is built using React 19 (frontend), Node.js + Express (backend), and MongoDB Atlas (database). It integrates Amazon S3 for file storage, Amazon Textract for resume analysis, Amazon SES for email notifications, and AWS IAM for secure cloud access. The application is deployed on an AWS EC2 Ubuntu instance in the `ap-south-1` region, served through Nginx, with the backend process managed by PM2.

---

## 2. Problem Statement

Campus placement processes in educational institutions typically involve:

- Paper-based or email-based resume collection with no centralised storage
- Manual eligibility screening against company requirements
- Status updates communicated ad-hoc through notice boards or group messages
- No single system for placement officers to track applicants across multiple drives
- No mechanism for students to view their application history or current status

These manual processes introduce errors, delays, data loss, and poor student experience during a critical career milestone.

---

## 3. Objectives

1. Provide a centralised platform where students can maintain verified academic profiles and upload resumes to cloud storage
2. Allow Placement Cell officers to create and manage company drives with structured eligibility criteria
3. Automate eligibility screening so students see only drives they qualify for
4. Track the full application lifecycle from submission to placement decision
5. Send automated email notifications when application status changes
6. Use AWS managed services (S3, Textract, SES, EC2, IAM) to demonstrate practical cloud computing integration
7. Enforce role-based access control for students, placement officers, and administrators

---

## 4. Proposed Solution

CloudPMS provides a three-tier web application:

- **Presentation tier** — React 19 SPA served as a production build by Nginx on EC2
- **Application tier** — Node.js + Express REST API, process-managed by PM2
- **Data tier** — MongoDB Atlas managed cloud database

Cloud services replace on-premise infrastructure:
- **Amazon S3** stores student resumes as private objects
- **Amazon Textract** extracts text from uploaded resumes for skill detection
- **Amazon SES** dispatches transactional email notifications
- **AWS IAM** controls SDK access through an EC2 instance profile role, eliminating the need for static credentials in production

The entire application is accessible at `cloudpms.kaifkhan.in`, resolved through Hostinger DNS to the AWS Elastic IP `65.1.71.208`.

---

## 5. System Requirements

### Functional Requirements

- User registration and login with email/password and Google OAuth
- Role selection at registration: student or placement_cell (admin assigned separately)
- Students must complete an academic profile before uploading resumes or applying to drives
- Resume upload accepts PDF only, maximum 5 MB, stored on S3
- Eligibility filter based on branch, minimum CGPA, and maximum backlogs
- One application per student per drive (enforced at database index level)
- Application status lifecycle: `Applied → Shortlisted → Interview Scheduled → Selected | Rejected`
- Email notification on status update
- Admin can toggle user account status and view system-wide reports

### Non-Functional Requirements

- JWT access token expiry: 15 minutes
- Refresh token expiry: 7 days; stored as httpOnly cookie
- S3 bucket: public access blocked
- Rate limiting on auth endpoints: 20 requests per 15 minutes in production
- PDF file size cap: 5 MB
- Password: minimum 8 characters, one uppercase, one digit

### Infrastructure Requirements

- AWS EC2: Ubuntu instance, ap-south-1
- AWS Elastic IP: static public address
- Nginx: web server and reverse proxy
- PM2: process manager
- MongoDB Atlas: hosted cluster
- Node.js ≥ 18

---

## 6. Functional Modules

### 6.1 Authentication Module

- `POST /api/auth/register` — create account with name, email, password, role
- `POST /api/auth/login` — email + password authentication
- `POST /api/auth/google` — Google OAuth access token exchange; find-or-create user
- `POST /api/auth/refresh` — rotate access and refresh tokens using httpOnly cookie
- `GET /api/auth/me` — return current user from access token
- `POST /api/auth/logout` — nullify refresh token in DB, clear cookie

### 6.2 Student Module

- Profile upsert (`POST|PUT /api/students/profile`) — academic data including roll number, branch, CGPA, backlogs, 10th and 12th percentages
- Resume upload (`POST /api/students/resume`) — PDF uploaded server-side to S3; Textract extracts skills automatically
- Eligible drives (`GET /api/students/drives`) — automatically filtered by branch, CGPA, backlogs, deadline, and drive status
- Apply to drive (`POST /api/students/drives/:driveId/apply`)
- Application history (`GET /api/students/applications`) — current status and remarks

### 6.3 Placement Cell Module

- Create drive (`POST /api/placement/drives`) — company, job role, CTC, eligibility criteria, deadline
- Edit drive (`PUT /api/placement/drives/:id`)
- Close drive (`PATCH /api/placement/drives/:id/close`) — sets status to `Completed`
- View applicants (`GET /api/placement/drives/:id/applicants`) — filterable by `?status=`
- Update application status (`PATCH /api/placement/applications/:appId/status`) — status, remarks, optional interview date

### 6.4 Admin Module

- Dashboard statistics (`GET /api/admin/dashboard`) — user counts, placement metrics
- User management (`GET /api/admin/users`) — paginated list filterable by role
- Toggle account (`PATCH /api/admin/users/:id/toggle`) — activate or deactivate
- Drive reports (`GET /api/admin/reports/drives`) — drive-wise application and selection summary

---

## 7. User Roles

| Role Identifier | Name | Access Level |
|---|---|---|
| `student` | Student | Self-service: profile, resume, drives, applications |
| `placement_cell` | Placement Cell Officer | Drive management, applicant management |
| `admin` | Administrator | All of the above, plus user governance and reports |

Roles are assigned at registration and stored in the `User` document. The `allowRoles()` middleware enforces role checks at the route group level on all protected endpoints.

---

## 8. System Architecture

```
Browser Client (React 19 SPA)
        │  HTTP/HTTPS
        ▼
Hostinger DNS: cloudpms.kaifkhan.in → 65.1.71.208
        │
        ▼
AWS Elastic IP → AWS EC2 (Ubuntu, ap-south-1)
        │
        ▼
Nginx (port 80)
  ├── GET /* → serve /var/www/cloudpms/dist (React build)
  └── /api/* → proxy_pass http://127.0.0.1:5000
                        │
                        ▼
          Node.js + Express (port 5000, PM2)
                        │
          ┌─────────────┼──────────────┐
          ▼             ▼              ▼
    MongoDB Atlas    Amazon S3    Amazon SES
                         │
                    Amazon Textract
                         │
                    AWS IAM Role
                 (CloudPMS-EC2-Role)
```

The three tiers are:
1. **Presentation** — React 19 SPA, built with Vite and served as static files by Nginx
2. **Application** — Node.js + Express REST API with Mongoose, JWT middleware, and AWS SDK v3 clients
3. **Data** — MongoDB Atlas for document storage; Amazon S3 for binary file storage

---

## 9. Technology Stack

### Frontend

| Technology | Version | Role |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Build tool and dev server |
| Tailwind CSS | 3 | Utility-first styling |
| React Router DOM | 7 | SPA routing, protected routes |
| Axios | 1 | HTTP client with interceptor token refresh |
| Lucide React | Latest | Icon set |
| Recharts | 3 | Admin charts |
| @react-oauth/google | Latest | Google OAuth token acquisition |

### Backend

| Technology | Version | Role |
|---|---|---|
| Node.js | ≥ 18 | JavaScript runtime |
| Express | 4 | HTTP framework |
| Mongoose | 8 | MongoDB ODM |
| jsonwebtoken | 9 | JWT signing and verification |
| bcryptjs | 2.4 | Password hashing |
| Multer | 2 | Multipart file handling (memoryStorage) |
| express-validator | 7 | Input validation |
| Helmet | 7 | HTTP security headers |
| CORS | 2.8 | Cross-origin request control |
| Morgan | 1.10 | HTTP request logging |
| express-rate-limit | 7 | Auth endpoint rate limiting |
| cookie-parser | 1.4 | Refresh token cookie parsing |

### AWS SDK v3 Packages

| Package | Purpose |
|---|---|
| `@aws-sdk/client-s3` | Resume upload and deletion |
| `@aws-sdk/client-textract` | Resume text extraction |
| `@aws-sdk/client-ses` | Email notifications |

---

## 10. Cloud Architecture

### Deployment Model

CloudPMS follows an **IaaS (Infrastructure as a Service)** model for compute (EC2) combined with **managed cloud services** for database (MongoDB Atlas), storage (S3), AI analysis (Textract), and email (SES).

```
Internet
    ↓ DNS resolution
cloudpms.kaifkhan.in (Hostinger A record → 65.1.71.208)
    ↓
AWS Elastic IP (65.1.71.208)
    ↓
AWS EC2 Ubuntu Instance (ap-south-1)
    ↓
Nginx
    ├── Static files → React 19 production build
    └── /api reverse proxy → Node.js + Express (PM2, port 5000)
                                    ↓
                             MongoDB Atlas (DBaaS)
                                    ↓
                       AWS S3 / Textract / SES (managed services)
```

### AWS Credential Model

| Environment | Credential Source |
|---|---|
| Local development | `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` in `.env` |
| EC2 production | `CloudPMS-EC2-Role` instance profile (automatic IMDS) |

The AWS SDK v3 default credential provider chain handles both environments without any code change. No static credentials are present on the production server.

---

## 11. AWS Services and Their Purpose

### 11.1 Amazon EC2

- **Instance**: Ubuntu, `ap-south-1`
- **Purpose**: Hosts Nginx (web server), Node.js/Express (API), and serves the compiled React SPA
- **Elastic IP**: `65.1.71.208` — stable public address that persists across instance restarts
- **IAM Role**: `CloudPMS-EC2-Role` attached as instance profile

### 11.2 Amazon S3 — `cloudpms-resumes-kaif-2026`

- **Purpose**: Persistent, durable object storage for student resume PDF files
- **Access pattern**: Backend SDK only; public access is blocked on the bucket
- **Upload mechanism**: `PutObjectCommand` with file buffer from Multer `memoryStorage` — file is never written to EC2 disk
- **Key format**: `resumes/<userId>/<timestamp>-<filename>.pdf`
- **Deletion**: `DeleteObjectCommand` replaces the previous resume when a student re-uploads
- **Note**: The `@aws-sdk/s3-request-presigner` package is installed as a dependency but presigned URL generation is not currently used in any route

### 11.3 Amazon Textract

- **Purpose**: Extract text content from uploaded resume PDFs stored in S3
- **API used**: `AnalyzeDocumentCommand` with feature types `TABLES` and `FORMS`
- **Processing**: `LINE`-type blocks are joined into a full text string and scanned against a keyword list of common technical skills
- **Output**: Detected skills are stored in the `skills` field of the student's `StudentProfile` document
- **Error handling**: Textract failure is non-fatal — the resume upload succeeds even if skill extraction fails, returning an empty array

### 11.4 Amazon SES

- **Purpose**: Send HTML-formatted transactional email notifications to students
- **Trigger**: Placement Cell updates an application status via `PATCH /api/placement/applications/:appId/status`
- **Sender**: `AWS_SES_SENDER_EMAIL` — a verified SES identity in `ap-south-1`
- **Sandbox**: During development, only verified recipient addresses can receive emails; production access must be requested from AWS to remove this restriction
- **Implementation**: `SendEmailCommand` — no `SourceArn`, direct same-account sending

### 11.5 AWS IAM — `CloudPMS-EC2-Role`

- **Purpose**: Grant the EC2 instance permission to call S3, Textract, and SES without embedding static credentials
- **Mechanism**: Instance profile attached to EC2; AWS SDK v3 automatically retrieves temporary credentials from the EC2 Instance Metadata Service (IMDS)
- **Principle of least privilege**: The role policy should grant only `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on the specific bucket, `textract:AnalyzeDocument`, and `ses:SendEmail`

---

## 12. Database Design

MongoDB Atlas hosts the database with four Mongoose models. All schemas use `timestamps: true` (auto `createdAt` / `updatedAt`) and `versionKey: false`.

### User

| Field | Type | Constraints |
|---|---|---|
| `name` | String | 2–100 chars, required |
| `email` | String | Unique, lowercase, valid format |
| `password` | String | Bcrypt hashed, `select: false` |
| `role` | String | Enum: `student`, `placement_cell`, `admin` |
| `isVerified` | Boolean | Default `false` |
| `refreshToken` | String | `select: false`; null = logged out |

### StudentProfile (1-to-1 with User)

| Field | Type | Constraints |
|---|---|---|
| `user` | ObjectId (ref: User) | Unique |
| `rollNumber` | String | Unique, uppercase |
| `branch` | String | Enum: `MCA`, `BCA`, `BBA`, `BSc IT`, `BCom` |
| `cgpa` | Number | 0–10 |
| `backlogCount` | Number | ≥ 0, default 0 |
| `resumePath` | String | S3 URL; null until uploaded |
| `skills` | [String] | Populated by Textract after upload |
| `tenthPercent` | Number | Optional, 0–100 |
| `twelfthPercent` | Number | Optional, 0–100 |
| `isPlaced` | Boolean | Default false |

Compound index on `{ branch, cgpa, backlogCount }` supports eligibility queries.

### Drive

| Field | Type | Constraints |
|---|---|---|
| `company` | String | Required |
| `jobRole` | String | Required |
| `ctc` | Number | LPA, ≥ 0 |
| `description` | String | Optional |
| `eligibility.minCgpa` | Number | 0–10 |
| `eligibility.allowedBranches` | [String] | Subset of BRANCHES, min 1 |
| `eligibility.maxBacklogs` | Number | ≥ 0, default 0 |
| `deadline` | Date | Required |
| `driveDate` | Date | Optional |
| `venue` | String | Optional |
| `postedBy` | ObjectId (ref: User) | Required |
| `status` | String | Enum: `Upcoming`, `Ongoing`, `Completed` |

### Application

| Field | Type | Constraints |
|---|---|---|
| `student` | ObjectId (ref: StudentProfile) | Required |
| `drive` | ObjectId (ref: Drive) | Required |
| `status` | String | Enum (see lifecycle below) |
| `appliedAt` | Date | Default: now |
| `remarks` | String | Optional Placement Cell notes |

**Status lifecycle**: `Applied → Shortlisted → Interview Scheduled → Selected | Rejected`

Compound unique index on `{ student, drive }` prevents duplicate applications at the database level.

---

## 13. Authentication and RBAC

### JWT Strategy — Stateless + Stateful Hybrid

**Stateless aspect**: Access tokens are self-contained JWTs carrying `userId` and `role`. Protected routes decode the token without a database lookup, enabling efficient horizontal scaling.

**Stateful aspect**: The refresh token is stored in the `User` document in MongoDB. On logout, the token is set to `null`, providing server-side session invalidation — preventing misuse of a stolen refresh token after the user has logged out.

### Token Details

| Token | Lifetime | Storage | Transport |
|---|---|---|---|
| Access token | 15 minutes | React memory (`useState`) | `Authorization: Bearer` header |
| Refresh token | 7 days | MongoDB + httpOnly cookie | Cookie (automatic by browser) |

### Cookie Properties

`httpOnly: true` — not readable by JavaScript.
`secure: true` in production — sent only over HTTPS.
`sameSite: none` in production, `lax` in development.

### Refresh Flow (React Interceptor)

1. API call returns `401 Unauthorized`
2. Axios response interceptor detects `401` on a non-auth endpoint
3. `POST /api/auth/refresh` is called automatically with the refresh cookie
4. New access token is stored in memory; original request is retried
5. If refresh fails, `auth:logout` event is dispatched to clear React state and redirect to login

### RBAC Implementation

```
Route group           Middleware applied
─────────────────     ────────────────────────────────────
/api/auth/*           None (public) or verifyToken only
/api/students/*       verifyToken + allowRoles('student')
/api/placement/*      verifyToken + allowRoles('placement_cell', 'admin')
/api/admin/*          verifyToken + allowRoles('admin')
```

---

## 14. Resume Upload and Processing Flow

```
1. Student selects a PDF file in the browser (≤ 5 MB)

2. POST /api/students/resume  (multipart/form-data, field: "resume")

3. Multer memoryStorage intercepts the file
   → File stored as Buffer in req.file.buffer
   → No temporary file written to EC2 disk

4. Student profile is fetched to check for an existing resume

5. If resumePath exists:
   → Extract S3 key from stored URL
   → DeleteObjectCommand removes the old file from S3

6. A new S3 object key is constructed:
   resumes/<userId>/<timestamp>-<sanitized-filename>.pdf

7. PutObjectCommand uploads the buffer to S3
   Bucket: cloudpms-resumes-kaif-2026
   ContentType: application/pdf
   Tagging: role=student&userId=<userId>

8. S3 URL is constructed:
   https://cloudpms-resumes-kaif-2026.s3.ap-south-1.amazonaws.com/<key>

9. AnalyzeDocumentCommand (Textract) is called with the S3 object reference

10. LINE-type text blocks are concatenated and scanned for known skills

11. profile.resumePath = S3 URL
    profile.skills = detectedSkills
    → Saved to MongoDB

12. Response: { resumeUrl, skills }
```

**Note**: The `@aws-sdk/s3-request-presigner` package is listed in `package.json` but is not invoked in any route. Resume access is currently direct — the S3 URL is stored and served without presigning.

---

## 15. Textract Integration

Amazon Textract is invoked synchronously within the resume upload handler.

**Command**: `AnalyzeDocumentCommand`
**Feature types**: `TABLES`, `FORMS`
**Document source**: S3 object reference (bucket + key) — Textract fetches the file from S3 directly

**Skill extraction logic**:
1. Filter `Blocks` array for items where `BlockType === 'LINE'`
2. Join all `Text` values into a single lowercase string
3. Check for presence of each skill keyword in the predefined list
4. Return all matched skills

**Predefined skill list** (current): `javascript`, `python`, `java`, `c++`, `c#`, `react`, `node.js`, `nodejs`, `express`, `mongodb`, `sql`, `mysql`, `postgresql`, `aws`, `docker`, `kubernetes`, `html`, `css`, `git`, `typescript`, `spring boot`, `django`

**Error handling**: If Textract throws, the error is logged and an empty array is returned. The S3 upload and profile save still succeed. This prevents a Textract failure from blocking the resume upload feature.

---

## 16. SES Notification Flow

Email notifications are dispatched when the Placement Cell updates an application status.

**Trigger route**: `PATCH /api/placement/applications/:appId/status`

**Flow**:
1. Application status is updated in MongoDB
2. The student's User document is fetched to retrieve their email address
3. `sendEmail(to, subject, htmlBody)` is called from `awsServices.js`
4. `SendEmailCommand` is sent via the SES client
5. Source: `"CloudPMS Placement Cell" <AWS_SES_SENDER_EMAIL>`
6. No `SourceArn` is set — direct verified-identity sending

**Error handling**: SES errors are caught and logged. The status update in MongoDB is committed regardless of email success. Email failure does not roll back the application status change.

**SES sandbox**: In development and during initial AWS account setup, only verified recipient addresses can receive emails. AWS production access must be requested to send to unverified addresses.

---

## 17. EC2 Deployment

### Instance Details

| Property | Value |
|---|---|
| Cloud Provider | AWS |
| Region | ap-south-1 (Mumbai) |
| OS | Ubuntu |
| Elastic IP | 65.1.71.208 |
| IAM Role | CloudPMS-EC2-Role |
| Application domain | cloudpms.kaifkhan.in |

### Deployment Flow

```
1. Code pushed to GitHub (main branch)
2. Developer SSH into EC2
3. git pull origin main
4. cd server && npm ci
5. Verify server/.env is current (AWS creds NOT required — IAM role provides them)
6. pm2 restart cloudpms
7. cd ../client && npm ci && npm run build
8. sudo cp -r dist/* /var/www/cloudpms/dist/
9. sudo nginx -t && sudo systemctl reload nginx
```

### DNS

Hostinger DNS A record: `cloudpms` → `65.1.71.208` (TTL 300 seconds)

---

## 18. Nginx and PM2 Configuration

### Nginx Role

Nginx serves as both a **static file server** (React production build) and a **reverse proxy** (API traffic to Express):

```nginx
server {
    listen 80;
    server_name cloudpms.kaifkhan.in;

    # Frontend — React SPA
    location / {
        root /var/www/cloudpms/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API — reverse proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

`try_files $uri $uri/ /index.html` ensures React Router client-side routes work correctly on direct URL access or page refresh.

### PM2 Role

PM2 manages the Node.js/Express process:
- Auto-restarts the backend if it crashes
- Persists the process across server reboots (`pm2 startup`)
- Provides log management (`pm2 logs`)
- Named process: `cloudpms`

---

## 19. Testing

The project was tested through manual integration testing during development and pre-deployment validation:

- **API testing**: All endpoints verified via browser and curl against `http://localhost:5000` during development and against `http://cloudpms.kaifkhan.in/api` post-deployment
- **Authentication flow**: Register → login → token refresh → logout verified for all three roles
- **Resume upload**: PDF upload tested end-to-end — Multer buffering, S3 `PutObjectCommand`, Textract skill extraction, MongoDB profile update
- **Eligibility filtering**: Drive listing verified to return only drives matching student branch, CGPA, and backlog criteria
- **Application lifecycle**: Status transitions from `Applied` through to `Selected` and `Rejected` verified with SES email delivery
- **Health endpoint**: `GET /api/health` verified to return correct AWS configuration status on both local and EC2

Automated unit or integration test suites were not implemented in this version.

---

## 20. Security Measures

| Measure | Implementation |
|---|---|
| Password storage | bcryptjs, 12 salt rounds, `select: false` field |
| JWT access token | 15-minute lifetime, signed with strong secret |
| Refresh token | httpOnly cookie; stored in DB for revocation; logout nullifies it |
| AWS credentials | No hardcoded credentials; IAM role used on EC2 |
| S3 bucket | Public access blocked; backend SDK access only |
| Security headers | Helmet middleware on all responses |
| CORS | Restricted to `CLIENT_URL` origin |
| Rate limiting | 20 req / 15 min on `/api/auth` in production |
| Input validation | express-validator on all user-facing endpoints |
| Role enforcement | `allowRoles()` middleware on all protected route groups |
| Secrets management | `.env` excluded from Git; `.env.example` used as template |

---

## 21. Results and Outcome

CloudPMS successfully achieves the project objectives:

- A functional three-role web application is deployed and accessible at `http://cloudpms.kaifkhan.in`
- Students can register, build profiles, upload resumes, browse eligible drives, and apply
- Placement officers can create and manage drives and update applicant status
- Admins can manage users and view placement statistics
- AWS S3, Textract, and SES are integrated and functional in the deployed environment
- The EC2 IAM role (`CloudPMS-EC2-Role`) eliminates static credential management in production
- Nginx correctly routes frontend and API traffic from a single EC2 instance

---

## 22. Limitations

- **SES sandbox**: Email can only be sent to verified addresses until AWS production access is granted
- **Single EC2 instance**: No load balancing or redundancy; the application is a single point of failure
- **No automated testing**: Unit and integration tests were not implemented
- **HTTPS pending**: The production URL currently serves over HTTP; Certbot/Let's Encrypt configuration is a remaining step
- **Presigned URLs not implemented**: Resume files cannot currently be downloaded with time-limited authenticated URLs; the S3 URL is exposed directly
- **No admin verification workflow**: Placement Cell accounts are not yet subject to admin approval after registration
- **Textract keyword list**: Skill extraction relies on a fixed keyword list rather than semantic NLP

---

## 23. Future Scope

- **HTTPS**: Certbot with Let's Encrypt for the production domain
- **Presigned URLs**: Time-limited S3 download URLs for secure resume access
- **SES production access**: Enable sending to unverified recipients
- **Admin account verification**: Workflow for admins to approve Placement Cell registrations
- **Automated testing**: Jest + Supertest for API integration tests
- **PM2 cluster mode**: Utilise multiple CPU cores on EC2 for higher throughput
- **Application Load Balancer**: For future horizontal scaling across multiple EC2 instances
- **CI/CD pipeline**: GitHub Actions to automate test, build, and deploy on push
- **Advanced analytics**: Year-over-year placement trends, branch-wise placement rates

---

## 24. Conclusion

CloudPMS demonstrates the practical application of cloud computing concepts and modern web development techniques to solve a real administrative challenge in educational institutions. The system integrates four AWS managed services (EC2, S3, Textract, SES) with a full-stack JavaScript application to deliver a functional, deployed product.

The use of AWS IAM instance profiles eliminates credential management risk in production. MongoDB Atlas as a managed DBaaS reduces infrastructure overhead. Nginx and PM2 provide a stable, low-cost deployment on a single EC2 instance suitable for the scale of a college placement system.

The project fulfils its stated objectives and provides a practical reference implementation of cloud-integrated web development at the MCA level.

---

*CloudPMS — Cloud-Based Campus Placement Management System*
*MCA Final Year Project · AWS ap-south-1 · React 19 · Node.js · MongoDB Atlas*
