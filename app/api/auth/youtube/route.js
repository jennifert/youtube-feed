import { NextResponse } from 'next/server';
import { createYouTubeOAuthClient } from '@/lib/youtube-auth';

export async function GET() {
  const oauth2Client = createYouTubeOAuthClient();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/youtube.readonly',
    ],
    prompt: 'consent',
  });

  return NextResponse.redirect(authUrl);
}