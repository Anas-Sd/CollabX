import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const { name, rating, message, userEmail, context } = await req.json();
    
    // We will use Gmail App Passwords for guaranteed Inbox delivery
    const gmailUser = process.env.GMAIL_USER; 
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD; 
    
    if (!gmailUser || !gmailAppPassword) {
      console.log(`[DEV MODE] Feedback missing credentials. \nFrom: ${name} (${userEmail})\nRating: ${rating} Stars\nMessage: ${message}\nContext: ${context}`);
      return NextResponse.json({ success: true, message: 'Feedback logged to console (Missing Credentials)' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword
      }
    });

    const mailOptions = {
      from: `"CollabX Feedback System" <${gmailUser}>`,
      to: 'feedback.collabx@gmail.com',
      subject: `New Feedback: ${rating} Stars from ${name || 'Anonymous'}`,
      html: `<div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #0A0A0F; color: #ffffff; border-radius: 10px;">
        <h2 style="color: #F5A623; border-bottom: 1px solid #333; padding-bottom: 10px;">CollabX User Feedback</h2>
        <p><strong>Name:</strong> ${name || 'Anonymous'}</p>
        <p><strong>Email:</strong> ${userEmail || 'Not Provided'}</p>
        <p><strong>Rating:</strong> ${rating} / 5 Stars</p>
        <p><strong>Submitted From:</strong> ${context || 'Unknown Page'}</p>
        <div style="background-color: #12121A; padding: 15px; border-radius: 8px; margin-top: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
          <h4 style="margin-top: 0; color: #888;">Message:</h4>
          <p style="white-space: pre-wrap; font-size: 16px;">${message}</p>
        </div>
      </div>`
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending Feedback with Nodemailer:', error);
    return NextResponse.json({ error: `SMTP Error: ${error.message || 'Failed to send email'}`, details: error }, { status: 500 });
  }
}
