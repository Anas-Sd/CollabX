import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { description } = await req.json();
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(description)}`;
    return NextResponse.json({ success: true, qrUrl });
  } catch (error) {
    console.error('Error generating QR:', error);
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}
