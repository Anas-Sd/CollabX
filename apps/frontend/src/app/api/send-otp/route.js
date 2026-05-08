import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const { email, otp } = await req.json();
    
    // We will use Gmail App Passwords for guaranteed Inbox delivery
    const gmailUser = process.env.GMAIL_USER; // e.g. security.collabx@gmail.com
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD; // The 16 character app password
    
    if (!gmailUser || !gmailAppPassword) {
      console.log(`[DEV MODE] Gmail credentials missing. OTP for ${email} is ${otp}`);
      return NextResponse.json({ success: true, message: 'OTP logged to console (Missing Credentials)' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword
      }
    });

    const mailOptions = {
      from: `"CollabX Security" <${gmailUser}>`,
      to: email,
      subject: 'Your CollabX Verification Code',
      html: `<div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #0A0A0F; color: #ffffff; border-radius: 10px;">
        <h2 style="color: #6C63FF; text-align: center;">Welcome to CollabX!</h2>
        <p style="font-size: 16px; color: #a1a1aa; text-align: center;">To complete your registration, please use the following verification code:</p>
        <div style="background-color: #12121A; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0; border: 1px solid rgba(108, 99, 255, 0.2);">
          <strong style="font-size: 32px; letter-spacing: 4px; color: #ffffff;">${otp}</strong>
        </div>
        <p style="font-size: 14px; color: #71717a; text-align: center;">If you did not request this code, please ignore this email.</p>
      </div>`
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending OTP with Nodemailer:', error);
    return NextResponse.json({ error: `SMTP Error: ${error.message || 'Failed to send email'}`, details: error }, { status: 500 });
  }
}
