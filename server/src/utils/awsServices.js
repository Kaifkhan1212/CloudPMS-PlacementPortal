'use strict';

const { AnalyzeDocumentCommand } = require('@aws-sdk/client-textract');
const { SendEmailCommand } = require('@aws-sdk/client-ses');
const { textractClient, sesClient } = require('../config/awsClients');

/**
 * Extract text from a resume stored in S3 using AWS Textract.
 * @param {string} s3Key - The object key in S3.
 * @returns {Promise<string[]>} - Array of detected skills.
 */
const parseResumeSkills = async (s3Key) => {
  try {
    const command = new AnalyzeDocumentCommand({
      Document: {
        S3Object: {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Name: s3Key,
        },
      },
      FeatureTypes: ['TABLES', 'FORMS'], // Basic analysis
    });

    const data = await textractClient.send(command);
    
    // Extract all text blocks
    const fullText = data.Blocks.filter((block) => block.BlockType === 'LINE')
      .map((block) => block.Text)
      .join(' ')
      .toLowerCase();

    // Basic keyword extraction for skills
    const commonSkills = [
      'javascript', 'python', 'java', 'c++', 'c#', 'react', 'node.js', 'nodejs',
      'express', 'mongodb', 'sql', 'mysql', 'postgresql', 'aws', 'docker',
      'kubernetes', 'html', 'css', 'git', 'typescript', 'spring boot', 'django'
    ];

    const detectedSkills = commonSkills.filter(skill => fullText.includes(skill));
    
    return detectedSkills;
  } catch (error) {
    console.error('Error parsing resume with Textract:', error);
    return []; // Return empty skills on error so upload doesn't fail completely
  }
};

const EmailLog = require('../models/EmailLog.model');

/**
 * Send an email using AWS SES and log it.
 * @param {string} to - Recipient email.
 * @param {string} subject - Email subject.
 * @param {string} htmlBody - Email body in HTML.
 * @param {Object} logData - Data for EmailLog { type, relatedDriveId, relatedApplicationIds, sentBy }
 */
const sendEmail = async (to, subject, htmlBody, logData = {}) => {
  let status = 'sent';
  let errorMessage = null;
  const senderEmail = process.env.AWS_SES_SENDER_EMAIL || 'noreply@kaifkhan.in';

  try {
    const command = new SendEmailCommand({
      Source: `"CloudPMS Placement Cell" <${senderEmail}>`,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: { Data: subject },
        Body: { Html: { Data: htmlBody } },
      },
    });

    const response = await sesClient.send(command);
    
    // Log success
    await EmailLog.create({
      senderEmail,
      senderName: 'CloudPMS Placement Cell',
      recipients: [to],
      subject,
      messageText: htmlBody, // Saving raw/html body for reference
      type: logData.type || 'status_update',
      status: 'sent',
      relatedDriveId: logData.relatedDriveId,
      relatedApplicationIds: logData.relatedApplicationIds,
      sentBy: logData.sentBy,
    });

    return response;
  } catch (error) {
    console.error('Error sending email with SES:', error);
    
    // Log failure
    try {
      await EmailLog.create({
        senderEmail,
        senderName: 'CloudPMS Placement Cell',
        recipients: [to],
        subject,
        messageText: htmlBody,
        type: logData.type || 'status_update',
        status: 'failed',
        relatedDriveId: logData.relatedDriveId,
        relatedApplicationIds: logData.relatedApplicationIds,
        sentBy: logData.sentBy,
        errorMessage: error.message,
      });
    } catch (dbError) {
      console.error('Error saving EmailLog:', dbError);
    }
    
    return null;
  }
};

module.exports = { parseResumeSkills, sendEmail };
