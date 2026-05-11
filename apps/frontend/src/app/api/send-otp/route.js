import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const { email, otp, purpose } = await req.json();
    
    // We will use Gmail App Passwords for guaranteed Inbox delivery
    const gmailUser = process.env.GMAIL_USER; // e.g. security.collabx@gmail.com
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD; // The 16 character app password
    
    if (!gmailUser || !gmailAppPassword) {
      console.log(`[DEV MODE] Gmail credentials missing. OTP for ${email} is ${otp}`);
      return NextResponse.json({ success: true, message: 'OTP logged to console (Missing Credentials)' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use STARTTLS instead of SSL (bypasses some firewalls)
      requireTLS: true,
      auth: {
        user: gmailUser,
        pass: gmailAppPassword
      }
    });

    const isForgotPassword = purpose === 'forgot_password';
    const headingText = isForgotPassword ? 'Password Reset OTP' : 'CollabX Registration OTP';
    const instructionText = isForgotPassword 
      ? 'To reset your password, please use the following verification code:' 
      : 'To complete your registration, please use the following verification code:';

    const mailOptions = {
      from: `"CollabX Security" <${gmailUser}>`,
      to: email,
      subject: isForgotPassword ? 'CollabX Password Reset Request' : 'Welcome to CollabX',
      html: `<div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #0A0A0F; color: #ffffff; border-radius: 10px;">
        <h2 style="color: #F5A623; text-align: center;">${headingText}</h2>
        <p style="font-size: 16px; color: #a1a1aa; text-align: center;">${instructionText}</p>
        <div style="background-color: #12121A; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0; border: 1px solid rgba(245, 166, 35, 0.2);">
          <strong style="font-size: 32px; letter-spacing: 4px; color: #ffffff;">${otp}</strong>
        </div>
        <p style="font-size: 14px; color: #71717a; text-align: center;">If you did not request this code, please ignore this email.</p>
      </div>`
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error sending OTP with Nodemailer:', error.message);
    
    // UNIVERSITY FIREWALL FALLBACK
    // We return a 200 OK with devFallback: true, but we DO NOT expose the OTP
    // for security reasons. The frontend will catch this and show a hotspot warning.
    return NextResponse.json({ 
      success: true, 
      devFallback: true, 
      message: 'SMTP Blocked by Firewall. Using Dev Fallback.' 
    });
  }
}
