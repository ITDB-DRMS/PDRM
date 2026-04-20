import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import {
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  ACCOUNT_SETUP_TEMPLATE
} from '../utils/emailTemplates.js';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log("Email Service Error: Server is not ready to take our messages");
    console.error(error);
  } else {
    console.log("Email Service: Server is ready to take our messages");
  }
});

import EmailLog from '../models/EmailLog.js';

export const sendEmail = async ({ to, subject, text, html, type = 'Other' }) => {
  const logEntry = new EmailLog({
    recipient: to,
    subject,
    body: text || (html ? html.substring(0, 200) + '...' : ''),
    type,
    status: 'pending',
    folder: 'sent'
  });

  try {
    const info = await transporter.sendMail({
      from: `IDRMIS <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });

    logEntry.status = 'sent';
    logEntry.messageId = info.messageId;
    await logEntry.save();

    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending email: ", error);
    logEntry.status = 'failed';
    logEntry.error = error.message;
    await logEntry.save();
    throw error;
  }
};

export const saveDraft = async ({ to, subject, text, html, type = 'Manual' }) => {
  const logEntry = new EmailLog({
    recipient: to,
    subject,
    body: text || (html ? html.substring(0, 200) + '...' : ''),
    type,
    status: 'pending',
    folder: 'draft'
  });
  return await logEntry.save();
};

export const sendVerificationEmail = async (email, code) => {
  const subject = 'Verify your account';
  const text = `Your verification code is: ${code}`;
  const html = VERIFICATION_EMAIL_TEMPLATE.replace('{verificationCode}', code);
  await sendEmail({ to: email, subject, text, html, type: 'Verification' });
};

export const sendWelcomeEmail = async (email, fullname) => {
  const subject = 'Welcome to IDRMIS';
  const text = `Hello ${fullname}, welcome to IDRMIS! Your account is now active.`;
  const html = WELCOME_EMAIL_TEMPLATE.replace('{name}', fullname);
  await sendEmail({ to: email, subject, text, html, type: 'Welcome' });
};

export const sendPasswordResetEmail = async (email, resetURL) => {
  console.log(`Sending Password Reset Email to ${email} with URL: ${resetURL}`);
  const subject = 'Reset Your Password';
  const text = `To reset your password, click the following link: ${resetURL}`;
  const html = PASSWORD_RESET_REQUEST_TEMPLATE.replace('{resetURL}', resetURL);
  await sendEmail({ to: email, subject, text, html, type: 'PasswordReset' });
};

export const sendResetSuccessEmail = async (email) => {
  const subject = 'Password Reset Successful';
  const text = `Your password has been successfully reset.`;
  const html = PASSWORD_RESET_SUCCESS_TEMPLATE;
  await sendEmail({ to: email, subject, text, html, type: 'PasswordReset' });
};

export const sendAccountSetupEmail = async (email, setupURL) => {
  const subject = 'Set Up Your IDRMIS Account';
  const text = `Welcome to IDRMIS. Please set up your account by clicking the following link: ${setupURL}`;
  const html = ACCOUNT_SETUP_TEMPLATE.replace('{setupURL}', setupURL);
  await sendEmail({ to: email, subject, text, html, type: 'AccountSetup' });
};
