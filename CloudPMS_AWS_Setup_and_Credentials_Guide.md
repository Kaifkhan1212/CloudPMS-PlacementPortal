# CloudPMS AWS Setup and Deployment Guide

**Cloud-Based Campus Placement Management System**
AWS Region: ap-south-1 (Mumbai) · EC2 · S3 · Textract · SES · IAM

---

> **Security Notice**: This guide uses placeholders such as `YOUR_MONGODB_URI`, `YOUR_JWT_SECRET`, `YOUR_GOOGLE_CLIENT_ID`. Never place real credentials, passwords, access keys, or secrets in any document committed to version control.

---

## Table of Contents

1. [AWS Account Preparation](#1-aws-account-preparation)
2. [IAM Setup](#2-iam-setup)
3. [EC2 Instance Launch](#3-ec2-instance-launch)
4. [IAM Role Creation and Attachment](#4-iam-role-creation-and-attachment)
5. [Elastic IP Allocation](#5-elastic-ip-allocation)
6. [S3 Bucket Setup](#6-s3-bucket-setup)
7. [Amazon Textract](#7-amazon-textract)
8. [Amazon SES Setup](#8-amazon-ses-setup)
9. [Hostinger DNS Configuration](#9-hostinger-dns-configuration)
10. [Node.js Installation on EC2](#10-nodejs-installation-on-ec2)
11. [Git Clone and Repository Setup](#11-git-clone-and-repository-setup)
12. [Backend Environment and Startup](#12-backend-environment-and-startup)
13. [Frontend Build and Deployment](#13-frontend-build-and-deployment)
14. [Nginx Configuration](#14-nginx-configuration)
15. [PM2 Configuration](#15-pm2-configuration)
16. [Environment Variables Reference](#16-environment-variables-reference)
17. [HTTPS with Certbot](#17-https-with-certbot)
18. [Health Check Verification](#18-health-check-verification)
19. [Testing AWS Access from EC2](#19-testing-aws-access-from-ec2)
20. [Troubleshooting](#20-troubleshooting)
21. [Security Best Practices](#21-security-best-practices)

---

## 1. AWS Account Preparation

1. Log in to the [AWS Management Console](https://console.aws.amazon.com/)
2. Select region **ap-south-1 (Mumbai)** from the region selector in the top-right corner
3. Confirm your account has billing set up — Textract and SES have per-invocation costs

> All resources in this guide should be created in **ap-south-1** unless otherwise noted.

---

## 2. IAM Setup

### 2.1 Create an IAM User for Local Development

This user is for local development only. **Do not use these credentials on the EC2 instance.**

1. Navigate to **IAM → Users → Add users**
2. Username: `cloudpms-local-dev`
3. Select **Attach policies directly**
4. Create a custom inline policy (least privilege):

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

5. Create the user
6. Go to the user → **Security credentials** → **Create access key**
7. Select **Local code** as the use case
8. Save the **Access key ID** and **Secret access key** securely
9. Add these to your local `server/.env` (see Section 16)

> These credentials are for local development only. The EC2 instance uses an IAM Role (Section 4) — do not copy these keys to the server.

---

## 3. EC2 Instance Launch

1. Navigate to **EC2 → Instances → Launch instances**
2. **Name**: `cloudpms-server`
3. **AMI**: Ubuntu Server 22.04 LTS (64-bit)
4. **Instance type**: `t2.micro` (free tier eligible) or `t3.small`
5. **Key pair**: Create a new key pair (RSA, `.pem` format). Download and store it securely
6. **Network settings**:
   - Allow SSH (port 22) from your IP
   - Allow HTTP (port 80) from anywhere `0.0.0.0/0`
   - Allow HTTPS (port 443) from anywhere `0.0.0.0/0` *(for future Certbot setup)*
   - Allow Custom TCP port 5000 from `127.0.0.1/32` only *(Express; Nginx will proxy externally)*
7. **Storage**: 20 GB gp3 (adjust as needed)
8. Click **Launch instance**

### SSH into the Instance

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@65.1.71.208
```

---

## 4. IAM Role Creation and Attachment

The EC2 instance uses an IAM role instead of static credentials. The AWS SDK automatically fetches temporary credentials from the EC2 Instance Metadata Service (IMDS).

### 4.1 Create the Role

1. Navigate to **IAM → Roles → Create role**
2. **Trusted entity type**: AWS service
3. **Use case**: EC2
4. Click **Next**
5. Skip managed policies — create a custom inline policy instead (see below)
6. **Role name**: `CloudPMS-EC2-Role`
7. Create the role

### 4.2 Add Inline Policy

1. Open the `CloudPMS-EC2-Role`
2. **Add permissions → Create inline policy**
3. Use the JSON editor:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3ResumeAccess",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::cloudpms-resumes-kaif-2026/*"
    },
    {
      "Sid": "TextractAccess",
      "Effect": "Allow",
      "Action": ["textract:AnalyzeDocument"],
      "Resource": "*"
    },
    {
      "Sid": "SESAccess",
      "Effect": "Allow",
      "Action": ["ses:SendEmail"],
      "Resource": "*"
    }
  ]
}
```

4. Name the policy: `CloudPMSEC2Policy`
5. Save

### 4.3 Attach Role to EC2

1. Go to **EC2 → Instances → Select `cloudpms-server`**
2. **Actions → Security → Modify IAM role**
3. Select `CloudPMS-EC2-Role`
4. Click **Update IAM role**

### 4.4 Verify Role from EC2

After attaching the role, SSH into EC2 and test:

```bash
# Should return the role name and temporary credentials
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/
# Returns: CloudPMS-EC2-Role

# Get temporary credentials (do not store these manually — SDK handles this automatically)
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/CloudPMS-EC2-Role
```

---

## 5. Elastic IP Allocation

1. Navigate to **EC2 → Elastic IPs → Allocate Elastic IP address**
2. **Network Border Group**: ap-south-1
3. Click **Allocate**
4. Select the new Elastic IP → **Actions → Associate Elastic IP address**
5. **Resource type**: Instance
6. **Instance**: select `cloudpms-server`
7. Click **Associate**

The Elastic IP (`65.1.71.208` in this deployment) is now permanently associated with the instance.

> An Elastic IP incurs a charge if not associated with a running instance. Always associate it immediately.

---

## 6. S3 Bucket Setup

1. Navigate to **S3 → Create bucket**
2. **Bucket name**: `cloudpms-resumes-kaif-2026`
3. **Region**: ap-south-1
4. **Object Ownership**: ACLs disabled (Bucket owner enforced)
5. **Block Public Access**: ✅ Block all public access (leave all boxes checked)
6. **Versioning**: Disable (optional — enable if you want resume version history)
7. Click **Create bucket**

### Optional: Lifecycle Rule to Manage Costs

If you want to automatically delete old resume files:

1. Open the bucket → **Management → Lifecycle rules → Create lifecycle rule**
2. Name: `delete-old-resumes`
3. Scope: Filter by prefix `resumes/` and tag `role=student`
4. Action: Delete objects after 365 days (or your preferred retention period)

### Bucket Permissions Verification

After setup, confirm:
- Public access settings show **all blocked**
- No bucket policy granting public access

The backend uses `PutObjectCommand` and `DeleteObjectCommand` with SDK credentials from the EC2 IAM role — no bucket policy changes are needed for backend access.

---

## 7. Amazon Textract

Textract is a fully managed service — no provisioning is required.

**Verify access**: The `CloudPMS-EC2-Role` policy already includes `textract:AnalyzeDocument`. No additional setup is needed.

**Billing note**: Textract charges per page processed. Resume uploads trigger one `AnalyzeDocumentCommand` call per upload. Monitor usage under **Billing → Cost Explorer** if volume increases.

---

## 8. Amazon SES Setup

### 8.1 Verify Sender Identity

1. Navigate to **Amazon SES → Verified identities → Create identity**
2. **Identity type**: Email address
3. **Email address**: the email you want to send from (this becomes `AWS_SES_SENDER_EMAIL`)
4. Click **Create identity**
5. Open the verification email received in that inbox and click the confirmation link
6. The identity status changes to **Verified**

### 8.2 SES Sandbox Note

By default, new SES accounts are in the **sandbox**. In sandbox mode:
- You can only send emails **to** verified identities
- For a production system where any student can receive emails, you must request production access

### 8.3 Request Production Access

1. Navigate to **SES → Account dashboard → Request production access**
2. Fill in the use case (transactional emails for campus placement notifications)
3. Specify expected email volume
4. Submit the request (AWS typically responds within 24 hours)

### 8.4 Verify Test Recipient (Sandbox Only)

While in sandbox, verify each recipient email you want to test:
1. **SES → Verified identities → Create identity**
2. Verify the student test email address

---

## 9. Hostinger DNS Configuration

1. Log in to your [Hostinger account](https://hpanel.hostinger.com)
2. Navigate to **Domains → Manage** for `kaifkhan.in`
3. Go to **DNS / Nameservers → DNS Records**
4. Add or edit an **A record**:

   | Type | Name | Points to | TTL |
   |---|---|---|---|
   | A | `cloudpms` | `65.1.71.208` | 300 |

5. Save the record
6. DNS propagation typically takes 5–60 minutes

### Verify DNS Resolution

```bash
nslookup cloudpms.kaifkhan.in
# Expected: Address: 65.1.71.208
```

---

## 10. Node.js Installation on EC2

SSH into the EC2 instance:

```bash
ssh -i your-key.pem ubuntu@65.1.71.208
```

Install Node.js 20 LTS via NodeSource:

```bash
# Update package index
sudo apt-get update

# Install NodeSource repository for Node.js 22.x.
curl -fsSL https://deb.nodesource.com/setup_22.x. | sudo -E bash -

# Install Node.js (includes npm)
sudo apt-get install -y nodejs

# Verify
node --version   # v22.x.x
npm --version    # 10.x.x
```

Install PM2 globally:

```bash
sudo npm install -g pm2
```

Install Nginx:

```bash
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

Install Git:

```bash
sudo apt-get install -y git
```

---

## 11. Git Clone and Repository Setup

```bash
# Navigate to home directory
cd ~

# Clone the repository
https://github.com/Kaifkhan1212/CloudPMS-PlacementPortal.git

# Or if the repo is private, use a personal access token:
# git clone https://YOUR_TOKEN@github.com/YOUR_GITHUB_USERNAME/CloudPMS-PlacementPortal.git

cd CloudPMS-PlacementPortal
```

---

## 12. Backend Environment and Startup

### 12.1 Create server/.env

```bash
cd server
cp .env.example .env
nano .env
```

Fill in your values (see Section 16 for the full reference). On EC2, do **not** set `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` — the IAM role provides credentials automatically.

### 12.2 Install Dependencies

```bash
npm ci
```

`npm ci` installs exact versions from `package-lock.json` — preferable over `npm install` for production deployments.

### 12.3 Start with PM2

```bash
pm2 start server.js --name cloudpms
pm2 save

# Enable PM2 to start on system boot
pm2 startup
# Run the command that pm2 prints (it will look like: sudo env PATH=... pm2 startup systemd ...)
```

### 12.4 Verify Backend is Running

```bash
pm2 status
curl http://localhost:5000/api/health
```

---

## 13. Frontend Build and Deployment

```bash
cd ~/CloudPMS-PlacementPortal/client

# Install dependencies
npm ci

# Build production bundle
npm run build
```

### Create web root and deploy

```bash
# Create the directory where Nginx will serve files
sudo mkdir -p /var/www/cloudpms

# Copy the build output
sudo cp -r dist/* /var/www/cloudpms/

# Set ownership (so Nginx can read files)
sudo chown -R www-data:www-data /var/www/cloudpms
```

---

## 14. Nginx Configuration

### 14.1 Create Site Configuration

```bash
sudo nano /etc/nginx/sites-available/cloudpms
```

Paste the following (replace the domain if needed):

```nginx
server {
    listen 80;
    server_name cloudpms.kaifkhan.in;

    # Frontend — React 19 SPA
    location / {
        root /var/www/cloudpms/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API — reverse proxy to Express on port 5000
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}
```

### 14.2 Enable the Site

```bash
# Enable site (symlink to sites-enabled)
sudo ln -s /etc/nginx/sites-available/cloudpms /etc/nginx/sites-enabled/

# Remove the default site (optional)
sudo rm -f /etc/nginx/sites-enabled/default

# Test the configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 14.3 Verify

```bash
curl http://cloudpms.kaifkhan.in/api/health
```

---

## 15. PM2 Configuration

### Common PM2 Commands

```bash
# Start
pm2 start server.js --name cloudpms

# Stop
pm2 stop cloudpms

# Restart (after code update)
pm2 restart cloudpms

# View logs (live)
pm2 logs cloudpms

# View last N lines
pm2 logs cloudpms --lines 100

# Status of all processes
pm2 status

# Save current process list for startup
pm2 save
```

### PM2 Ecosystem File (Optional)

Create `server/ecosystem.config.js` for structured PM2 configuration:

```js
module.exports = {
  apps: [
    {
      name: 'cloudpms',
      script: 'server.js',
      cwd: '/home/ubuntu/CloudPMS-PlacementPortal/server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
```

Start with: `pm2 start ecosystem.config.js`

---

## 16. Environment Variables Reference

Create `server/.env` on the EC2 instance:

```bash
nano ~/CloudPMS-PlacementPortal/server/.env
```

### server/.env Template

```env
# ── App ──────────────────────────────────────────────────────
NODE_ENV=production
PORT=5000
CLIENT_URL=https://cloudpms.kaifkhan.in

# ── MongoDB Atlas ─────────────────────────────────────────────
MONGO_URI=YOUR_MONGODB_ATLAS_CONNECTION_STRING

# ── JWT ───────────────────────────────────────────────────────
# Generate: node -e "require('crypto').randomBytes(64).toString('hex')"
JWT_ACCESS_SECRET=YOUR_64_BYTE_HEX_ACCESS_SECRET
JWT_REFRESH_SECRET=YOUR_64_BYTE_HEX_REFRESH_SECRET
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ── AWS Region ────────────────────────────────────────────────
# Required. Credentials are NOT needed here on EC2 — IAM role provides them.
AWS_REGION=ap-south-1

# ── S3 ────────────────────────────────────────────────────────
AWS_S3_BUCKET_NAME=cloudpms-resumes-kaif-2026

# ── SES ───────────────────────────────────────────────────────
AWS_SES_SENDER_EMAIL=YOUR_VERIFIED_SES_SENDER_EMAIL

# ── Bcrypt ───────────────────────────────────────────────────
BCRYPT_SALT_ROUNDS=12

# ── Google OAuth (optional) ───────────────────────────────────
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
```

> **Note**: `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are intentionally absent. The `CloudPMS-EC2-Role` instance profile provides temporary credentials automatically.

### client/.env

The client `.env` is used at **build time only** — Vite embeds these values into the JavaScript bundle:

```env
VITE_API_BASE_URL=/api
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
```

`VITE_API_BASE_URL=/api` tells the frontend to call `/api/*` relative to the current origin. Nginx proxies these to Express.

---

## 17. HTTPS with Certbot

> HTTPS is a pending configuration step for CloudPMS. Complete this after DNS propagation is confirmed.

### Install Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### Obtain and Configure Certificate

```bash
sudo certbot --nginx -d cloudpms.kaifkhan.in
```

Certbot will:
1. Verify domain ownership via HTTP-01 challenge
2. Obtain a Let's Encrypt TLS certificate
3. Automatically update the Nginx configuration to add `listen 443 ssl` and redirect HTTP to HTTPS

### Auto-Renewal

Let's Encrypt certificates expire after 90 days. Certbot installs a systemd timer for automatic renewal:

```bash
# Verify auto-renewal is active
sudo systemctl status certbot.timer

# Test renewal (dry run)
sudo certbot renew --dry-run
```

### After HTTPS is Active

Update `server/.env`:
```env
CLIENT_URL=https://cloudpms.kaifkhan.in
```

And restart the backend:
```bash
pm2 restart cloudpms
```

---

## 18. Health Check Verification

```bash
# From the EC2 instance
curl http://localhost:5000/api/health | python3 -m json.tool

# From outside (after DNS propagation)
curl http://cloudpms.kaifkhan.in/api/health | python3 -m json.tool
```

**Expected response**:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "CloudPMS API is healthy",
  "data": {
    "status": "ok",
    "environment": "production",
    "timestamp": "2026-09-30T00:00:00.000Z",
    "aws": {
      "configured": true,
      "region": "ap-south-1",
      "s3Bucket": "cloudpms-resumes-kaif-2026",
      "sesSender": "your-sender@domain.com",
      "textractReady": true
    }
  }
}
```

`configured: true` requires `AWS_REGION` and `AWS_S3_BUCKET_NAME` to be set. Note that static AWS credential env vars are not checked — the IAM role is expected to provide credentials.

---

## 19. Testing AWS Access from EC2

After attaching the IAM role, verify each AWS service from the EC2 instance:

### Verify IAM Role is Active

```bash
# Check the identity the SDK will use
aws sts get-caller-identity --region ap-south-1
# Should return the CloudPMS-EC2-Role ARN
```

> If `aws` CLI is not installed: `sudo apt-get install -y awscli`

### Test S3 Access

```bash
# List bucket (should succeed)
aws s3 ls s3://cloudpms-resumes-kaif-2026/ --region ap-south-1

# Try to list a different bucket (should be denied — tests least privilege)
aws s3 ls s3://some-other-bucket/ --region ap-south-1
```

### Test SES Access

```bash
# Send a test email (requires a verified recipient in sandbox mode)
aws ses send-email \
  --from "YOUR_VERIFIED_SENDER@domain.com" \
  --to "YOUR_VERIFIED_RECIPIENT@domain.com" \
  --subject "CloudPMS IAM Role Test" \
  --text "AWS SES access via IAM role is working." \
  --region ap-south-1
```

### Test Application Upload Flow

1. Register a student account via the deployed app
2. Create a student profile
3. Upload a PDF resume through the app
4. Verify the file appears in S3:
   ```bash
   aws s3 ls s3://cloudpms-resumes-kaif-2026/resumes/ --region ap-south-1
   ```
5. Verify skills were extracted (profile page should show detected skills)

---

## 20. Troubleshooting

### Backend Not Starting

```bash
pm2 logs cloudpms --lines 50
```

Common causes:
- Missing or invalid `MONGO_URI` — check Atlas IP whitelist includes EC2 IP
- Missing `JWT_ACCESS_SECRET` or `JWT_REFRESH_SECRET`
- Port 5000 already in use: `sudo lsof -i :5000`

### Nginx 502 Bad Gateway

Express is not running or not reachable:
```bash
pm2 status
curl http://localhost:5000/api/health
sudo nginx -t
```

### Nginx 404 on Frontend Routes

`try_files` directive is missing or incorrect. Check:
```bash
sudo cat /etc/nginx/sites-enabled/cloudpms
```
Ensure `try_files $uri $uri/ /index.html;` is present in the `location /` block.

### AWS SDK Credential Error

```
CredentialsProviderError: Could not load credentials from any providers
```

- On EC2: verify the IAM role is attached to the instance (Section 4.3)
- Locally: verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set in `server/.env`

### S3 Upload Fails

- Check IAM role policy includes `s3:PutObject` on the correct bucket ARN
- Verify `AWS_S3_BUCKET_NAME` in `.env` exactly matches the actual bucket name
- Check pm2 logs for the specific SDK error message

### SES Email Not Delivered

- Confirm sender identity is **Verified** in SES console
- In sandbox mode: confirm recipient address is also verified
- Check pm2 logs for `Error sending email with SES:`

### Textract Returns Empty Skills

- Confirm `textract:AnalyzeDocument` is in the IAM role policy
- Verify the PDF is not password-protected or image-only without text content
- Empty skills are non-fatal — check logs for `Error parsing resume with Textract:`

### DNS Not Resolving

```bash
nslookup cloudpms.kaifkhan.in 8.8.8.8
```

If not resolving to `65.1.71.208`:
- Confirm A record is saved in Hostinger DNS
- Wait for TTL expiry (up to 300 seconds for this config)

---

## 21. Security Best Practices

### Credentials and Secrets

- Never commit `server/.env` to version control — it is in `.gitignore`
- Use `server/.env.example` as a template with placeholder values only
- Generate strong JWT secrets: `node -e "require('crypto').randomBytes(64).toString('hex')"`
- Do not set `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` on the EC2 instance

### IAM

- Use least-privilege policies — grant only the actions and resources the application actually needs
- Do not attach `AdministratorAccess` or `AmazonS3FullAccess` to the EC2 role
- Regularly review the role's policy using **IAM Access Analyzer**
- Enable **CloudTrail** to audit all AWS API calls

### EC2

- Restrict SSH access (port 22) to your IP address only in the security group
- Disable password-based SSH login (use key pairs only)
- Keep Ubuntu packages up to date: `sudo apt-get update && sudo apt-get upgrade`
- Do not expose port 5000 publicly — Express should only be reachable through Nginx

### S3

- Verify **Block all public access** is enabled on the bucket
- Do not add a bucket policy that grants `s3:GetObject` to `"Principal": "*"`
- Periodically review bucket access logs (enable S3 server access logging if needed)

### Application

- Helmet is configured in Express — do not disable it
- `express-rate-limit` is applied to `/api/auth` — do not remove or relax it in production
- Do not change `NODE_ENV` to `development` on the production server
- Keep `CLIENT_URL` set to the exact production frontend origin (CORS restriction)

### HTTPS

- Install Certbot and obtain a Let's Encrypt certificate before going to production
- After enabling HTTPS, set `CLIENT_URL=https://cloudpms.kaifkhan.in`
- The refresh token cookie uses `secure: true` in production — HTTPS is required for the cookie to be sent

---

*CloudPMS AWS Setup and Deployment Guide*
*AWS ap-south-1 · EC2 + S3 + Textract + SES + IAM · MongoDB Atlas · Nginx · PM2*
