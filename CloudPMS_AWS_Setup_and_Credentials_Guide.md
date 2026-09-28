# CloudPMS AWS Setup and Credentials Guide

## Overview
This guide provides the necessary steps to set up the Amazon Web Services (AWS) infrastructure for the **CloudPMS** (Cloud-Based Campus Placement Management System). 

As part of the Cloud Computing (DSCC) evaluation, the architecture relies on several managed AWS services:
1. **AWS IAM (Identity and Access Management)**: Least-privilege access for the backend.
2. **Amazon S3 (Simple Storage Service)**: Secure storage of student resumes, profile pictures, and placement drive documents.
3. **Amazon SES (Simple Email Service)**: Reliable delivery of application status updates, interview schedules, and password resets.
4. **Amazon Textract**: Optical Character Recognition (OCR) to automatically parse data from student uploaded resumes.

---

## 1. AWS IAM Setup

Create a dedicated IAM user specifically for the Node.js backend. Do NOT use the root user credentials.

### Steps:
1. Navigate to the **IAM Console** > **Users** > **Add users**.
2. Name the user `cloudpms-backend-service`.
3. Select **Attach policies directly**.
4. Create a custom inline policy or attach the following managed policies:
   - `AmazonS3FullAccess` (or restrict to a specific bucket)
   - `AmazonSESFullAccess`
   - `AmazonTextractFullAccess`
5. Proceed to create the user.
6. Once created, go to the **Security credentials** tab and generate an **Access Key**. 
7. Save the `Access key ID` and `Secret access key`. These will be placed in the `.env` file of the server.

---

## 2. Amazon S3 Configuration

### Steps:
1. Navigate to the **S3 Console**.
2. Click **Create bucket**. Name it `cloudpms-storage-mca-project` (bucket names must be globally unique).
3. Select your preferred region (e.g., `ap-south-1` for Mumbai).
4. **Object Ownership**: ACLs disabled (recommended).
5. **Block Public Access**: Keep all public access blocked if you intend to serve files via pre-signed URLs (recommended for privacy of student resumes).
6. Create the bucket.

#### CORS Configuration (If uploading directly from Frontend)
If the React frontend needs to upload directly to S3 using presigned URLs, configure CORS under the bucket's **Permissions** tab:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["http://localhost:5173", "https://your-production-url.vercel.app"],
        "ExposeHeaders": []
    }
]
```

---

## 3. Amazon SES Configuration

### Steps:
1. Navigate to the **Amazon SES Console**.
2. Go to **Verified identities** and click **Create identity**.
3. Select **Email address** and enter the email address you wish to use as the sender (e.g., `admin@cloudpms.edu`).
4. You will receive a verification email. Click the link to verify.
5. *Note on SES Sandbox*: By default, new SES accounts are in the sandbox. You must also verify the *recipient* email addresses, or request production access to send emails to unverified student addresses.

---

## 4. Amazon Textract Setup

Textract is fully managed and does not require provisioning. However, ensure that the IAM user created in Step 1 has the `AmazonTextractFullAccess` policy attached so the backend can call the `AnalyzeDocument` API.

---

## 5. Environment Variables

Add the credentials and region information to the backend `/server/.env` file:

```env
# AWS Credentials
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=ap-south-1

# S3 Configuration
AWS_S3_BUCKET_NAME=cloudpms-storage-mca-project

# SES Configuration
AWS_SES_SENDER_EMAIL=admin@cloudpms.edu
```

## Security Best Practices
- Never commit the `.env` file to version control. It is already included in the `.gitignore`.
- Regularly rotate the AWS Access Keys.
- Restrict S3 permissions as much as possible using fine-grained bucket policies.
