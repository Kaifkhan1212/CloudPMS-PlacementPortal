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

/**
 * Send an email using AWS SES.
 * @param {string} to - Recipient email.
 * @param {string} subject - Email subject.
 * @param {string} htmlBody - Email body in HTML.
 */
const sendEmail = async (to, subject, htmlBody) => {
  try {
    const command = new SendEmailCommand({
      Source: `"CloudPMS Placement Cell" <${process.env.SES_SENDER_EMAIL || 'noreply@kaifkhan.in'}>`,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: { Data: subject },
        Body: { Html: { Data: htmlBody } },
      },
    });

    // Support SES_IDENTITY_ARN if specified
    if (process.env.SES_IDENTITY_ARN) {
      command.input.SourceArn = process.env.SES_IDENTITY_ARN;
    }

    const response = await sesClient.send(command);
    return response;
  } catch (error) {
    console.error('Error sending email with SES:', error);
    // Don't throw error to prevent application flow from breaking due to email failure
    return null;
  }
};

module.exports = { parseResumeSkills, sendEmail };
