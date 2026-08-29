import { NextResponse } from 'next/server';

import { openDatabase } from '@/lib/db';
import { createYouTubeOAuthClient } from '@/lib/youtube-auth';

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: 'Missing authorization code.' },
      { status: 400 }
    );
  }

  const oauth2Client = createYouTubeOAuthClient();

  try {
    const { tokens } = await oauth2Client.getToken(code);

    const db = openDatabase();

    const statement = db.prepare(`
      INSERT INTO oauth_tokens (
        provider,
        access_token,
        refresh_token,
        scope,
        token_type,
        expiry_date
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(provider) DO UPDATE SET
        access_token = excluded.access_token,
        refresh_token = COALESCE(
          excluded.refresh_token,
          oauth_tokens.refresh_token
        ),
        scope = excluded.scope,
        token_type = excluded.token_type,
        expiry_date = excluded.expiry_date,
        updated_at = CURRENT_TIMESTAMP
    `);

    statement.run(
      'youtube',
      tokens.access_token ?? null,
      tokens.refresh_token ?? null,
      tokens.scope ?? null,
      tokens.token_type ?? null,
      tokens.expiry_date ?? null
    );

    db.close();

    return NextResponse.json({
      success: true,
      message: 'YouTube authorization successful.',
    });
  } catch (error) {
    console.error('YouTube OAuth callback failed:', error.message);

    return NextResponse.json(
      {
        success: false,
        error: 'YouTube authorization failed.',
      },
      { status: 500 }
    );
  }
}