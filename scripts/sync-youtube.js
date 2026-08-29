import { google } from 'googleapis';

import { openDatabase } from '../lib/db.js';
import { createYouTubeOAuthClient } from '../lib/youtube-auth.js';

const db = openDatabase();

try {
    // Load the saved YouTube OAuth credentials.
    const savedTokens = db
        .prepare(`
      SELECT
        access_token,
        refresh_token,
        scope,
        token_type,
        expiry_date
      FROM oauth_tokens
      WHERE provider = ?
    `)
        .get('youtube');

    if (!savedTokens) {
        throw new Error(
            'YouTube is not authorized. Visit /api/auth/youtube first.'
        );
    }

    // Create the OAuth client and give it the saved credentials.
    const oauth2Client = createYouTubeOAuthClient();

    oauth2Client.setCredentials({
        access_token: savedTokens.access_token,
        refresh_token: savedTokens.refresh_token,
        scope: savedTokens.scope,
        token_type: savedTokens.token_type,
        expiry_date: savedTokens.expiry_date,
    });

    // Create an authenticated YouTube API client.
    const youtube = google.youtube({
        version: 'v3',
        auth: oauth2Client,
    });

    // Get the first page of subscriptions.
    const response = await youtube.subscriptions.list({
        part: ['snippet', 'contentDetails'],
        mine: true,
        maxResults: 50,
    });

    console.log(`Found ${response.data.items.length} subscriptions.`);

    const upsertChannel = db.prepare(`
  INSERT INTO youtube_channels (
    channel_id,
    name,
    enabled,
    category,
    updated_at
  )
  VALUES (?, ?, 1, NULL, CURRENT_TIMESTAMP)
  ON CONFLICT(channel_id) DO UPDATE SET
    name = excluded.name,
    updated_at = CURRENT_TIMESTAMP
`);

    for (const subscription of response.data.items) {
        const channelId = subscription.snippet.resourceId.channelId;
        const channelName = subscription.snippet.title;
        upsertChannel.run(channelId, channelName);
        console.log(`Saved: ${channelName}`);
    }
} catch (error) {
    console.error('YouTube sync failed:', error.message);
    process.exitCode = 1;
} finally {
    db.close();
}