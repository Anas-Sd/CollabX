import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

export async function POST(req) {
  try {
  // Parse request
  const { email, otp, purpose } = await req.json();

    const isForgotPassword = purpose === 'forgot_password';
    const subjectLine = `Your CollabX verification code: ${otp}`;
    const headingText = isForgotPassword ? 'Reset your password' : 'Verify your email';
    const instructionText = isForgotPassword
      ? 'Use the code below to reset your CollabX password. It is valid for 10 minutes.'
      : 'Use the code below to complete your CollabX registration. It is valid for 10 minutes.';

    const plainText = `${headingText}\n\n${instructionText}\n\nYour code: ${otp}\n\nThis code expires in 10 minutes. If you did not request this, please ignore this email.\n\n— The CollabX Team\nhttps://collabx.live`;

    const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#111111;padding:28px 40px;text-align:center;">
            <span style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-1px;">Collab</span><span style="font-size:26px;font-weight:900;color:#F5A623;">X</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 12px;font-size:22px;color:#111111;">${headingText}</h2>
            <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;">${instructionText}</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:20px 0;">
                <div style="display:inline-block;background:#f9f9fb;border:2px solid #e4e4e7;border-radius:10px;padding:18px 48px;">
                  <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#111111;">${otp}</span>
                </div>
              </td></tr>
            </table>
            <p style="margin:28px 0 0;font-size:13px;color:#a1a1aa;line-height:1.5;">This code expires in <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f9fb;padding:20px 40px;border-top:1px solid #e4e4e7;text-align:center;">
            <p style="margin:0;font-size:12px;color:#a1a1aa;">© ${new Date().getFullYear()} CollabX &nbsp;·&nbsp; <a href="https://collabx.live" style="color:#a1a1aa;text-decoration:none;">collabx.live</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Send via Resend (primary)
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: 'CollabX <noreply@collabx.live>',
        to: email,
        subject: subjectLine,
        text: plainText,
        html: htmlBody,
      });
      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true });
    }

    // Gmail fallback
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
      console.log(`[DEV] OTP for ${email}: ${otp}`);
      return NextResponse.json({ success: true });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: gmailUser, pass: gmailAppPassword }
    });

    await transporter.sendMail({
      from: `"CollabX" <${gmailUser}>`,
      replyTo: gmailUser,
      to: email,
      subject: subjectLine,
      text: plainText,
      html: htmlBody,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error sending OTP:', error.message);
    return NextResponse.json({ success: true, devFallback: true });
  }
}
