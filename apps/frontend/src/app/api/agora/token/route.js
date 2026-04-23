import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { roomId, userId } = body;

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim();
    const appCertificate = process.env.AGORA_APP_CERTIFICATE?.trim();

    if (!appId || !appCertificate) {
      console.error('Missing Agora App ID or Certificate');
      return NextResponse.json({ error: 'Agora credentials missing in environment' }, { status: 500 });
    }

    // Role is publisher for everyone since everyone can talk (muted logic handled client-side)
    const role = RtcRole.PUBLISHER;
    // Token valid for 24 hours
    const expirationTimeInSeconds = 3600 * 24;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUserAccount(
      appId,
      appCertificate,
      roomId,
      userId,
      role,
      expirationTimeInSeconds,
      privilegeExpiredTs
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Agora Token generation failed:', error);
    return NextResponse.json({ error: 'Internal Server Error generating token' }, { status: 500 });
  }
}
