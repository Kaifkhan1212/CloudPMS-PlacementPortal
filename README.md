☁️ CloudPMS — Cloud-Based Campus Placement Management System

## 1. 📌 Executive Summary & Project Overview
CloudPMS is an enterprise-grade, cloud-native Campus Placement Management System designed to centralize and automate the recruitment workflow for educational institutions. Built on modern web standards (React 18, Tailwind CSS, Express, and Node.js), CloudPMS streamlines the placement lifecycle through deep integration with cloud services and managed databases.

🎯 **Key Objectives:**
- **Zero-Friction Student Portal**: Distraction-free dashboards allowing students to upload resumes, track application statuses in real-time, and discover active placement drives.
- **Automated Resume Ingestion & OCR**: Secure parsing of student resumes backed by AWS document intelligence (Amazon Textract).
- **Intelligent Placement Drive Management**: Empowers Placement Cell officers to create drives, set eligibility criteria (e.g., CGPA cutoffs), and evaluate candidate pools efficiently.
- **Recruiter & Admin Productivity Suite**: 1-click status updates, automated candidate emails, and comprehensive user management.
- **Enterprise Cloud Scalability**: High availability and serverless edge delivery through Vercel, Render, and MongoDB Atlas.

## 2. 🏛️ Cloud Architecture Diagram

```mermaid
flowchart TD
    %% Client Layer
    subgraph ClientLayer["🌐 Client Layer"]
        Candidate["Candidate Application Portal\n(Public)"]
        Recruiter["Placement Cell Dashboard\n(Protected)"]
        Admin["Admin Control Panel\n(Protected)"]
    end

    %% Compute & Hosting
    subgraph ComputeLayer["☁️ Compute & Hosting"]
        Frontend["Vercel Edge Network\nReact 18 SPA"]
        Backend["Render Web Service\nNode.js + Express API"]
    end

    %% Storage & Database
    subgraph StorageLayer["💾 Storage & Intelligence"]
        MongoDB[("MongoDB Atlas\n(DBaaS)")]
        S3["Amazon S3\n(Document Storage)"]
        Textract["Amazon Textract\n(Resume OCR)"]
        SES["Amazon SES\n(Email Notifications)"]
        IAM["AWS IAM\n(Access Control)"]
    end

    %% Connections
    Candidate -->|"1. Submits Resume & Profile"| Frontend
    Recruiter -->|"Manage Drives & Applicants"| Frontend
    Admin -->|"System Governance"| Frontend

    Frontend <-->|"RESTful API Calls (JWT)"| Backend

    Backend <-->|"Read/Write User Data"| MongoDB
    Backend -->|"2. Secure Upload via Presigned URL"| S3
    Backend -->|"3. Ingest Resume for OCR"| Textract
    Backend -->|"4. Dispatch Status Emails"| SES
    Backend -->|"5. Authenticate Operations"| IAM

    %% Styling
    classDef aws fill:#232f3e,stroke:#ff9900,stroke-width:2px,color:#fff;
    classDef client fill:#f28c00,stroke:#172b4d,stroke-width:2px,color:#fff;
    classDef compute fill:#172b4d,stroke:#f28c00,stroke-width:2px,color:#fff;
    classDef db fill:#00ed64,stroke:#001e2b,stroke-width:2px,color:#000;
    
    class S3,Textract,SES,IAM aws;
    class Candidate,Recruiter,Admin client;
    class Frontend,Backend compute;
    class MongoDB db;
```

| Service | Core Purpose in CloudPMS | Integration Details |
|---------|--------------------------|---------------------|
| **Vercel** | Production Frontend Hosting | Edge delivery of the compiled React SPA with automatic CI/CD from GitHub. |
| **Render** | Backend API Hosting | Hosts the unified Node.js/Express REST API. |
| **MongoDB Atlas** | Managed Database (DBaaS) | Highly available, distributed NoSQL database for users, drives, and applications. |
| **Amazon S3** | Object Storage for Resumes | Secure partitioned bucket storage with encrypted Presigned URLs. |
| **Amazon Textract** | AI Document OCR & Parsing | Optical character recognition for extracting text and structured data from resumes. |
| **Amazon SES** | Transactional Email Dispatch | Sends automated, branded status updates to candidates. |
| **AWS IAM** | Access Control & Security | Enforces Least Privilege access policies for backend services. |

### 3.1. Vercel & Render (Compute & Hosting)
**Role**: Serves as the robust computing backbone hosting the CloudPMS platform.
- **Frontend (Vercel)**: The React 18 SPA is deployed to Vercel's Edge Network, ensuring lightning-fast load times globally and zero-downtime deployments.
- **Backend (Render)**: The Node.js Express API is hosted as a web service on Render, providing automatic scaling, health checks, and continuous deployment.

### 3.2. Amazon S3 (Simple Storage Service)
**Role**: Highly scalable, durable object store for student resumes and profile pictures.
- **Presigned URLs (@aws-sdk/s3-request-presigner)**: Generates temporary, cryptographically signed URLs for viewing or downloading candidate resumes securely without making the S3 bucket public.
- **Metadata Tagging**: Ingested files store metadata headers including candidate ID and upload timestamp.

### 3.3. Amazon Textract
**Role**: Machine learning document analysis service for OCR and resume text extraction.
- **Features Used**: Analyzes raw document byte arrays to extract high-accuracy text streams from PDF resumes, automating the initial data entry for students.

### 3.4. Amazon SES (Simple Email Service)
**Role**: Enterprise cloud email notification service.
- **Automated Workflows**: Dispatches immediate, HTML-formatted confirmation receipts and status updates (e.g., "Shortlisted", "Selected") to candidates.
- Handles sandbox verification gracefully with informative console logging during development.

### 3.5. MongoDB Atlas
**Role**: Fully managed cloud database.
- **Schema Validation**: Enforces strict Mongoose schemas for Users, Drives, and Applications to maintain data integrity.
- **Indexing**: Optimized queries for rapid candidate filtering by the Placement Cell.

### 3.6. AWS IAM (Identity & Access Management)
**Role**: Secure authentication and identity federation for AWS resources.
- **Least Privilege IAM Policy Recommendation**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::cloudpms-storage-mca-project", "arn:aws:s3:::cloudpms-storage-mca-project/*"]
    },
    {
      "Effect": "Allow",
      "Action": ["textract:AnalyzeDocument", "ses:SendEmail"],
      "Resource": "*"
    }
  ]
}
```

## 4. 🧠 Role-Based Access & Workflow Logic
CloudPMS evaluates user sessions and authorizes actions using a robust JWT strategy and Role-Based Access Control (RBAC):

1. **Student Workflow**
   - Discovers active placement drives.
   - Validates eligibility criteria (e.g., specific degrees, passing year).
   - Submits application payload referencing securely uploaded S3 documents.

2. **Placement Cell Workflow**
   - Configures granular drive requirements.
   - Accesses unified applicant dashboards.
   - Executes bulk status updates (Applied → Shortlisted → Interview → Selected).

3. **Administrator Governance**
   - Verifies newly registered Placement Officers and Students.
   - Resolves system anomalies and accesses global placement metrics.

## 5. 📊 Real-Time Application Tracking Feature
Students and recruiters benefit from visual, real-time application trackers:
- **Visual Nodes**: Active progress nodes highlight exactly where a candidate stands in the pipeline.
- **Automated Sync**: When a recruiter updates a status, the database instantly reflects the change on the student's dashboard and triggers an SES email notification.

## 6. 🛠️ Environment Configuration Reference (.env)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGO_URI` | Yes | MongoDB Atlas Connection String | `mongodb+srv://...` |
| `JWT_SECRET` | Yes | Secret key for signing tokens | `supersecretkey` |
| `AWS_ACCESS_KEY_ID` | Yes | IAM Access Key ID | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Yes | IAM Secret Access Key | `wJalrXUtn...` |
| `AWS_REGION` | Yes | AWS Region for S3, SES | `ap-south-1` |
| `AWS_S3_BUCKET_NAME` | Yes | Target S3 bucket for resumes | `cloudpms-storage` |
| `AWS_SES_SENDER_EMAIL`| Optional | Verified sender email for SES | `admin@cloudpms.edu` |
| `PORT` | Optional | Backend HTTP server port | `5000` |

## 7. 🚀 Local Development Runbook

### Starting & Managing the Backend
```bash
# 1. Navigate to server
cd server
# 2. Install dependencies
npm install
# 3. Start API in development mode
npm run dev
```

### Starting & Managing the Frontend
```bash
# 1. Navigate to client
cd client
# 2. Install dependencies
npm install
# 3. Start React application
npm run dev
```

**Health Check Endpoint**
```bash
curl http://localhost:5000/api/health
```
**Expected Response:**
```json
{ "status": "ok", "message": "Server is healthy", "timestamp": "..." }
```

---
*Authored for CloudPMS Enterprise Campus Placement Platform — Built on Cloud Services.*
