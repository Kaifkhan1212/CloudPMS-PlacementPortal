# CloudPMS — DSCC / Cloud Computing Assignment Report

**Cloud-Based Campus Placement Management System**

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Problem Statement](#2-problem-statement)
3. [Cloud Computing Concepts Applied](#3-cloud-computing-concepts-applied)
4. [System Architecture Overview](#4-system-architecture-overview)
5. [AWS EC2 — Infrastructure as a Service](#5-aws-ec2--infrastructure-as-a-service)
6. [Amazon S3 — Object Storage Service](#6-amazon-s3--object-storage-service)
7. [Amazon Textract — AI/ML Managed Service](#7-amazon-textract--aiml-managed-service)
8. [Amazon SES — Managed Email Service](#8-amazon-ses--managed-email-service)
9. [AWS IAM — Identity and Access Management](#9-aws-iam--identity-and-access-management)
10. [MongoDB Atlas — Database as a Service](#10-mongodb-atlas--database-as-a-service)
11. [DNS and Network Routing](#11-dns-and-network-routing)
12. [Reverse Proxy with Nginx](#12-reverse-proxy-with-nginx)
13. [Process Management with PM2](#13-process-management-with-pm2)
14. [Security Implementation](#14-security-implementation)
15. [Deployment Methodology](#15-deployment-methodology)
16. [Cloud Benefits Observed](#16-cloud-benefits-observed)
17. [Limitations and Constraints](#17-limitations-and-constraints)
18. [Implementation Steps Summary](#18-implementation-steps-summary)
19. [Learning Outcomes](#19-learning-outcomes)
20. [Conclusion](#20-conclusion)

---

## 1. Introduction

CloudPMS (Cloud-Based Campus Placement Management System) is a web application developed to demonstrate the practical integration of cloud computing technologies within an institutional context. The project was built as an MCA final year assignment under the DSCC (Distributed Systems and Cloud Computing) curriculum.

The system is a full-stack web application deployed on Amazon Web Services (AWS) that manages the campus placement lifecycle — from student profile creation and resume upload to drive management, eligibility filtering, application tracking, and email notification. The deployment uses AWS EC2 for compute, Amazon S3 for file storage, Amazon Textract for document analysis, Amazon SES for email, and AWS IAM for access control.

---

## 2. Problem Statement

Campus placement processes at educational institutions are typically managed through a combination of spreadsheets, email threads, notice boards, and manual verification. This results in:

- No centralised repository for student profiles and resumes
- Manual eligibility screening that is time-consuming and error-prone
- Delayed or inconsistent status communication to students
- No audit trail of application progression

The objective is to replace this with a cloud-hosted system where all data and documents are stored centrally, eligibility is computed automatically, and status updates trigger automated notifications.

---

## 3. Cloud Computing Concepts Applied

The project demonstrates the following cloud computing concepts:

| Concept | Application in CloudPMS |
|---|---|
| **IaaS (Infrastructure as a Service)** | AWS EC2 provides the virtual compute instance running the application |
| **DBaaS (Database as a Service)** | MongoDB Atlas manages the database cluster without on-premise infrastructure |
| **Object Storage** | Amazon S3 provides scalable, durable storage for resume PDF files |
| **Managed AI/ML Service** | Amazon Textract provides document text extraction without managing ML infrastructure |
| **Managed Email Service** | Amazon SES delivers transactional emails as a managed cloud API |
| **IAM / Cloud Security** | AWS IAM controls API-level access to AWS resources via role-based policies |
| **Elastic IP / Static Addressing** | AWS Elastic IP provides a stable public address independent of instance state |
| **DNS Management** | Hostinger DNS resolves the custom domain to the Elastic IP |
| **Reverse Proxy** | Nginx routes HTTP traffic between the static frontend and the backend API |
| **Process Management** | PM2 manages the Node.js process lifecycle on EC2 |

---

## 4. System Architecture Overview

CloudPMS follows the **Three-Tier Architecture** pattern, where each tier has a clearly defined responsibility:

```
┌────────────────────────────────────────────────────────┐
│  TIER 1 — Presentation                                 │
│  React 19 SPA (built with Vite, Tailwind CSS)          │
│  Premium UI with responsive Light/Dark Mode            │
│  Served as static files by Nginx on EC2                │
└──────────────────────┬─────────────────────────────────┘
                       │  RESTful HTTP API calls to /api/*
┌──────────────────────▼─────────────────────────────────┐
│  TIER 2 — Application                                  │
│  Node.js + Express REST API                            │
│  Port 5000 on EC2, managed by PM2                      │
│  JWT authentication, RBAC middleware                   │
│  AWS SDK v3 clients for S3, Textract, SES              │
└──────────────────────┬─────────────────────────────────┘
                       │
          ┌────────────┼──────────────┐
          ▼            ▼              ▼
┌─────────────┐  ┌─────────┐   ┌──────────┐
│ MongoDB     │  │ AWS S3  │   │ AWS SES  │
│ Atlas       │  │ (files) │   │ (email)  │
│ (DBaaS)     │  └────┬────┘   └──────────┘
└─────────────┘       │
                  AWS Textract
                  (analysis)
```

**Traffic flow**:
1. User navigates to `cloudpms.kaifkhan.in`
2. Hostinger DNS resolves to Elastic IP `65.1.71.208`
3. Nginx on EC2 receives the HTTP request
4. For `/api/*` — Nginx proxies to Express on `localhost:5000`
5. For all other paths — Nginx serves the React build from `/var/www/cloudpms/dist`

---

## 5. AWS EC2 — Infrastructure as a Service

### What is EC2?

Amazon Elastic Compute Cloud (EC2) is a virtual machine service that provides resizable compute capacity in the cloud. It is classified as **IaaS** because AWS manages the physical hardware, networking, and virtualisation layer, while the user controls the operating system, runtime, and application.

### CloudPMS Usage

- **Instance OS**: Ubuntu
- **Region**: `ap-south-1` (Mumbai)
- **Purpose**: Hosts both the Nginx web server and the Node.js Express backend
- **Elastic IP**: `65.1.71.208` — a static public IPv4 address associated with the instance. Unlike a default public IP (which changes on restart), an Elastic IP persists until explicitly released, making it suitable for DNS A-record mapping

### Why EC2 over PaaS?

Using EC2 directly gave full control over:
- Nginx configuration (single server for both frontend and API)
- PM2 process management
- Node.js version and runtime environment
- File system access for deployment

---

## 6. Amazon S3 — Object Storage Service

### What is S3?

Amazon Simple Storage Service (S3) is an object storage service providing scalable, durable storage for arbitrary binary data. Objects are organised in buckets identified by globally unique names.

### CloudPMS Usage

- **Bucket**: `cloudpms-resumes-kaif-2026` (region: `ap-south-1`)
- **Purpose**: Stores student resume PDF files
- **Public access**: Blocked — the bucket is private
- **Access method**: Backend SDK only using `PutObjectCommand` and `DeleteObjectCommand`

### Upload Process

When a student uploads a resume:

1. Multer `memoryStorage` intercepts the file as a Buffer in RAM — no disk write on EC2
2. `PutObjectCommand` uploads the buffer directly to S3
3. Object key format: `resumes/<userId>/<timestamp>-<filename>.pdf`
4. The S3 HTTPS URL is stored in the student's profile in MongoDB
5. If a previous resume exists, `DeleteObjectCommand` removes it before the new upload

### Key Properties

- `ContentType: application/pdf` — correct MIME type is stored with the object
- `ContentDisposition: inline` — browsers will display PDF inline when accessed directly
- `Tagging: role=student&userId=<id>` — object-level metadata for lifecycle management
- **No presigned URLs are implemented** — the `@aws-sdk/s3-request-presigner` package is installed but not used in any current route

---

## 7. Amazon Textract — AI/ML Managed Service

### What is Textract?

Amazon Textract is a managed machine learning service that extracts text and structured data from documents. It requires no ML model training or infrastructure management.

### CloudPMS Usage

- **API**: `AnalyzeDocumentCommand` with feature types `TABLES` and `FORMS`
- **Input**: S3 object reference (bucket + key) — Textract fetches the file directly from S3
- **Processing**: The response `Blocks` array is filtered for `BlockType === 'LINE'` to build a full text string
- **Skill extraction**: The text is compared against a predefined list of skill keywords (JavaScript, Python, Java, React, Node.js, MongoDB, AWS, Docker, etc.)
- **Output**: An array of detected skills saved to `StudentProfile.skills` in MongoDB

### Cloud Computing Relevance

Textract is an example of consuming a **managed AI service via API** — the complexity of OCR and document analysis is abstracted behind a simple API call. CloudPMS does not need to train or host any ML model.

### Error Handling

If Textract fails (e.g., document format issue, API error), the failure is logged and an empty skills array is returned. The resume upload to S3 is not rolled back — the feature degrades gracefully.

---

## 8. Amazon SES — Managed Email Service

### What is SES?

Amazon Simple Email Service (SES) is a managed cloud email platform designed for transactional and bulk email delivery.

### CloudPMS Usage

- **API**: `SendEmailCommand`
- **Sender**: The email address configured in `AWS_SES_SENDER_EMAIL` (verified SES identity in `ap-south-1`)
- **Trigger**: Invoked when the Placement Cell updates an application status via the API
- **Content**: HTML-formatted email notifying the student of their new application status

### SES Sandbox

New AWS accounts are placed in the SES sandbox. In sandbox mode, only verified email addresses can receive messages. To send to unverified recipients (i.e., actual students), a production access request must be submitted to AWS Support.

### Error Handling

SES errors are caught and logged. The application status update in MongoDB is committed regardless of email success, ensuring that an email service issue does not prevent the Placement Cell from managing applications.

---

## 9. AWS IAM — Identity and Access Management

### What is IAM?

AWS Identity and Access Management (IAM) controls who can do what with AWS resources. It enforces the **principle of least privilege** — granting only the permissions required for a specific task.

### Two Credential Scenarios

#### Local Development

For local development, AWS credentials are supplied as environment variables in `server/.env`:

```
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_REGION=ap-south-1
```

These are resolved by the AWS SDK v3 default credential provider chain and should belong to an IAM user with restricted permissions (S3, Textract, SES only on specific resources).

#### Production EC2 — `CloudPMS-EC2-Role`

On EC2, the instance has the `CloudPMS-EC2-Role` IAM role attached as an **instance profile**. The AWS SDK v3 credential provider chain automatically queries the EC2 Instance Metadata Service (IMDS) at `http://169.254.169.254` to retrieve temporary, auto-rotating credentials.

This means:
- No static `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` are stored on the EC2 server
- Credentials rotate automatically (no manual key rotation needed)
- If the role is compromised, it can be detached or its policy changed instantly without redeploying code

### Why IAM Roles Are Preferred Over Keys on EC2

| Aspect | Static Key in .env | IAM Instance Role |
|---|---|---|
| Credential rotation | Manual | Automatic |
| Key exposure risk | High (disk, process memory) | None |
| Revocation | Requires redeployment | Instant policy change |
| Audit trail | IAM Access Analyzer | CloudTrail |

### Recommended Least-Privilege Policy for CloudPMS-EC2-Role

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::cloudpms-resumes-kaif-2026/*"
    },
    {
      "Effect": "Allow",
      "Action": ["textract:AnalyzeDocument"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["ses:SendEmail"],
      "Resource": "*"
    }
  ]
}
```

---

## 10. MongoDB Atlas — Database as a Service

### What is MongoDB Atlas?

MongoDB Atlas is a fully managed cloud database service (DBaaS) for MongoDB. It handles provisioning, patching, backups, and monitoring, removing the need to manage a database server.

### CloudPMS Usage

- **ODM**: Mongoose 8 with defined schemas, validation, and indexes
- **Models**: `User`, `StudentProfile`, `Drive`, `Application`
- **Connection**: MongoDB Atlas connection string stored in `MONGO_URI`
- **Indexes**: Compound indexes for eligibility queries (`branch`, `cgpa`, `backlogCount`) and unique constraints (`{ student, drive }` on Application)

### Cloud Computing Relevance

Using Atlas as DBaaS means:
- No database server to provision or maintain on EC2
- Automatic backups and point-in-time recovery
- Connection from any network (EC2, local) using the connection string and IP whitelist

---

## 11. DNS and Network Routing

### DNS

Hostinger is used as the DNS provider for `kaifkhan.in`. The subdomain `cloudpms` is mapped with an **A record**:

```
cloudpms.kaifkhan.in → 65.1.71.208 (TTL: 300 seconds)
```

`65.1.71.208` is the **AWS Elastic IP** associated with the EC2 instance.

### Elastic IP

An Elastic IP is a static public IPv4 address provided by AWS. Unlike the default public IP (which changes on instance stop/start), the Elastic IP remains constant until explicitly released. This stability is essential for DNS — a dynamic IP would break the A record every time the instance restarts.

### Request Path

```
User → cloudpms.kaifkhan.in
     → DNS A record → 65.1.71.208
     → EC2 Security Group (port 80 open)
     → Nginx (listening port 80)
     → Route: /api/* → Express on port 5000
             /*     → React dist/
```

---

## 12. Reverse Proxy with Nginx

Nginx acts as the entry point for all HTTP traffic to the EC2 instance:

**Frontend serving**: The React 19 production build (`dist/`) is placed in `/var/www/cloudpms/dist`. Nginx serves `index.html` for all non-file paths, enabling React Router to handle client-side routing.

**API reverse proxy**: All requests to `/api/*` are forwarded to the Express server on `localhost:5000`. Nginx adds `X-Real-IP` and `X-Forwarded-For` headers so the backend logs actual client IPs (not `127.0.0.1`).

**Key Nginx directive**:
```
try_files $uri $uri/ /index.html;
```
This directive ensures that direct navigation to a React route (e.g., `/student/profile`) returns `index.html` rather than a 404 — React Router then renders the correct page.

### Why a Reverse Proxy?

Without Nginx, the Express server would need to serve both the API and static files on the same port, complicating configuration. Nginx cleanly separates concerns:
- Efficient static file serving with OS-level caching
- Path-based routing (`/api/*` vs. `/*`) without any application code change

---

## 13. Process Management with PM2

### What is PM2?

PM2 is a production process manager for Node.js. It keeps the application running, handles crashes with automatic restart, and provides log management.

### CloudPMS Usage

- The Express backend is launched with PM2 under the process name `cloudpms`
- `pm2 startup` configures PM2 to survive EC2 reboots via systemd
- `pm2 restart cloudpms` is used during deployment to apply code changes
- `pm2 logs cloudpms` provides access to application stdout/stderr

### Why PM2 Over Running Node Directly?

| Feature | `node server.js` | PM2 |
|---|---|---|
| Auto-restart on crash | No | Yes |
| Startup on reboot | No | Yes (systemd) |
| Log management | None | Built-in with rotation |
| Process status | No | `pm2 status` |

---

## 14. Security Implementation

### Authentication

- JWT access tokens (15-minute lifetime) are stored in React component state — not in `localStorage` or `sessionStorage`
- Refresh tokens are stored in `httpOnly`, `secure`, `sameSite=none` cookies and persisted in MongoDB for server-side revocation
- Logout sets the refresh token to `null` in the database, preventing reuse

### Password Security

- bcryptjs with 12 salt rounds
- The `password` field uses `select: false` — it is never returned in API responses

### RBAC

- Roles (`student`, `placement_cell`, `admin`) are stored in the User document
- `allowRoles()` middleware enforces role checks at route group registration, not per-endpoint
- A student cannot access placement cell routes and vice versa

### Network and Application Security

- **Helmet**: Sets HTTP security headers (Content Security Policy, X-Frame-Options, etc.) on all responses
- **CORS**: Restricted to `CLIENT_URL` — only the configured frontend origin can make credentialed requests
- **Rate limiting**: `express-rate-limit` allows a maximum of 20 requests per 15 minutes on `/api/auth` in production
- **Input validation**: `express-validator` validates all request bodies and URL parameters before they reach controllers

### Cloud Security

- AWS S3 bucket public access is blocked
- AWS credentials are not stored on the EC2 server — the IAM instance role provides access
- `.env` files are excluded from Git via `.gitignore`

---

## 15. Deployment Methodology

The deployment approach is a **manual pull-based deployment** on EC2:

1. Code is committed and pushed to GitHub
2. Developer SSHs into the EC2 instance
3. `git pull` fetches the latest code
4. `npm ci` installs exact dependency versions from `package-lock.json`
5. `pm2 restart cloudpms` restarts the backend with the updated code
6. `npm run build` compiles the React frontend with Vite
7. The resulting `dist/` is copied to `/var/www/cloudpms/dist/`
8. `nginx -t && systemctl reload nginx` validates and applies Nginx configuration

This methodology requires no additional CI/CD infrastructure and is appropriate for a project of this scale. A GitHub Actions pipeline could automate these steps in a production evolution.

---

## 16. Cloud Benefits Observed

| Benefit | How It Manifests in CloudPMS |
|---|---|
| **No hardware management** | AWS manages EC2 physical infrastructure; MongoDB Atlas manages database hardware |
| **Managed services** | Textract, SES, S3 are available via API — no server to run or patch |
| **Elastic IP stability** | Static addressing without a dedicated network device |
| **Geographic proximity** | `ap-south-1` (Mumbai) reduces latency for Indian users |
| **IAM role-based access** | Credentials rotate automatically; no manual key management on EC2 |
| **Scalable storage** | S3 scales to any number of resumes without pre-provisioning |
| **Resilient email delivery** | SES manages mail servers, deliverability, and bounce handling |

---

## 17. Limitations and Constraints

| Limitation | Detail |
|---|---|
| **Single EC2 instance** | No load balancing; instance failure takes the application offline |
| **No auto-scaling** | Traffic spikes cannot be automatically handled |
| **SES sandbox restriction** | Emails can only reach verified addresses until production access is approved |
| **HTTP only** | HTTPS is not yet configured; Certbot/Let's Encrypt setup is pending |
| **Manual deployment** | No CI/CD automation; deployments require SSH access |
| **No presigned resume download** | S3 URLs are direct public-path URLs; time-limited authenticated downloads not implemented |
| **Fixed Textract skill list** | Skill extraction relies on keyword matching, not semantic NLP |

---

## 18. Implementation Steps Summary

1. **AWS account setup** — Created IAM user for local development with S3/Textract/SES permissions
2. **EC2 provisioning** — Launched Ubuntu instance in ap-south-1, associated Elastic IP
3. **IAM role creation** — Created `CloudPMS-EC2-Role` with least-privilege policy; attached to EC2
4. **S3 bucket creation** — Created `cloudpms-resumes-kaif-2026` with public access blocked
5. **SES configuration** — Verified sender email identity in ap-south-1
6. **MongoDB Atlas** — Created cluster, whitelisted EC2 IP, obtained connection string
7. **Node.js installation** — Installed Node.js ≥ 18 on EC2 via NodeSource
8. **Code deployment** — Cloned repository from GitHub; configured `server/.env`
9. **PM2 setup** — Installed PM2, started backend, configured startup
10. **Frontend build** — `npm run build` in `/client`; deployed dist to `/var/www/cloudpms/dist`
11. **Nginx configuration** — Configured `try_files` for React SPA and `proxy_pass` for API
12. **DNS configuration** — Created A record in Hostinger DNS pointing to Elastic IP
13. **Testing** — Verified health endpoint, registration, login, S3 upload, Textract, SES

---

## 19. Learning Outcomes

Through the implementation of CloudPMS, the following cloud computing concepts were practically applied:

1. **IaaS deployment**: Provisioning and configuring an EC2 Ubuntu instance, including networking, security groups, and Elastic IP
2. **IAM security model**: Understanding the difference between IAM users (long-term credentials) and IAM roles (temporary credentials via instance profile), and the security advantages of the latter
3. **Object storage**: Using Amazon S3 for structured object storage with consistent key naming, tagging, and bucket policy management
4. **Managed AI services**: Invoking Amazon Textract as a cloud API for document processing without managing ML infrastructure
5. **Managed email**: Integrating Amazon SES for transactional email, understanding sandbox vs. production mode
6. **Reverse proxy pattern**: Configuring Nginx to combine static file serving and API proxying on a single server
7. **Process management**: Using PM2 for robust Node.js process lifecycle management in production
8. **DBaaS**: Connecting to MongoDB Atlas as a managed cloud database with Atlas IP whitelisting
9. **DNS and networking**: Configuring Hostinger DNS A records and understanding Elastic IP behaviour
10. **Security practices**: Applying JWT, bcrypt, Helmet, CORS, rate limiting, and IAM least-privilege principles

---

## 20. Conclusion

CloudPMS demonstrates the practical integration of multiple AWS managed services into a cohesive web application. The project applies the IaaS model (EC2), DBaaS (MongoDB Atlas), and managed cloud APIs (S3, Textract, SES, IAM) to deliver a functioning campus placement system deployed on AWS.

The use of an IAM instance profile for EC2 credentials, Nginx as a reverse proxy, and PM2 for process management reflects real-world cloud deployment patterns applicable beyond the academic context. The project also highlights cloud limitations — such as SES sandbox restrictions and the absence of multi-instance redundancy — providing an honest assessment of a single-instance deployment.

---

*AWS ap-south-1 · EC2 + S3 + Textract + SES + IAM · MongoDB Atlas · React 19 · Node.js · Nginx · PM2*
