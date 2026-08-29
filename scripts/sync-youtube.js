import { google } from 'googleapis';

import { openDatabase } from '../lib/db.js';
import { createYouTubeOAuthClient } from '../lib/youtube-auth.js';

async function getUploadsPlaylistId(youtube, channelId) {
    const response = await youtube.channels.list({
        part: ['contentDetails'],
        id: [channelId],
    });

    return (
        response.data.items?.[0]
            ?.contentDetails
            ?.relatedPlaylists
            ?.uploads ?? null
    );
}

async function getRecentUploads(youtube, playlistId) {
    const response = await youtube.playlistItems.list({
        part: ['snippet', 'contentDetails'],
        playlistId,
        maxResults: 10,
    });
    return response.data.items ?? [];
}

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

    // latest uploads
    const channels = db
        .prepare(`
      SELECT channel_id, name
      FROM youtube_channels
      WHERE enabled = 1
      ORDER BY id
    `)
        .all();

    if (channels.length === 0) {
        throw new Error('No enabled YouTube channels found.');
    }

    const upsertVideo = db.prepare(`
    INSERT INTO youtube_videos (
        video_id,
        channel_id,
        title,
        published_at,
        thumbnail_url,
        url,
        fetched_at
    )
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(video_id) DO UPDATE SET
        channel_id = excluded.channel_id,
        title = excluded.title,
        published_at = excluded.published_at,
        thumbnail_url = excluded.thumbnail_url,
        url = excluded.url,
        fetched_at = CURRENT_TIMESTAMP
    `);

    for (const channel of channels) {
        const uploadsPlaylistId = await getUploadsPlaylistId(
            youtube,
            channel.channel_id
        );

        if (!uploadsPlaylistId) {
            console.log(`Skipped: ${channel.name}`);
            continue;
        }

        const uploads = await getRecentUploads(
            youtube,
            uploadsPlaylistId
        );

        console.log(`Recent uploads from ${channel.name}:`);

        for (const item of uploads) {
            const videoId = item.contentDetails.videoId;

            const thumbnailUrl =
                item.snippet.thumbnails?.medium?.url ??
                item.snippet.thumbnails?.default?.url ??
                null;

            const videoUrl =
                `https://www.youtube.com/watch?v=${videoId}`;

            upsertVideo.run(
                videoId,
                channel.channel_id,
                item.snippet.title,
                item.contentDetails.videoPublishedAt,
                thumbnailUrl,
                videoUrl
            );
            console.log(`Saved video: ${item.snippet.title}`);
        }

    }

} catch (error) {
    console.error('YouTube sync failed:', error.message);
    process.exitCode = 1;
} finally {
    db.close();
}
