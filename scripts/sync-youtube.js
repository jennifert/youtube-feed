import dotenv from 'dotenv';

import { google } from 'googleapis';

import { openDatabase } from '../lib/db.js';
import { createYouTubeOAuthClient } from '../lib/youtube-auth.js';

dotenv.config({ path: '.env.local' });

//helper functions

async function getAllSubscriptions(youtube) {
    const subscriptions = [];
    let pageToken;

    do {
        const response = await youtube.subscriptions.list({
            part: ['snippet', 'contentDetails'],
            mine: true,
            maxResults: 50,
            pageToken,
        });

        subscriptions.push(...(response.data.items ?? []));

        pageToken = response.data.nextPageToken;
    } while (pageToken);

    return subscriptions;
}

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

async function getVideoDetails(youtube, videoIds) {
    const response = await youtube.videos.list({
        part: ['contentDetails'],
        id: videoIds,
    });

    return response.data.items ?? [];
}

function durationToSeconds(duration) {
    if (!duration) {
        return null;
    }

    const match = duration.match(
        /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/
    );

    if (!match) {
        return null;
    }

    const hours = Number(match[1] ?? 0);
    const minutes = Number(match[2] ?? 0);
    const seconds = Number(match[3] ?? 0);

    return (hours * 3600) + (minutes * 60) + seconds;
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

    // Get subscriptions.
    const subscriptions = await getAllSubscriptions(youtube);
    console.log(`Found ${subscriptions.length} subscriptions.`);

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

    for (const subscription of subscriptions) {
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
        duration_seconds,
        is_short,
        fetched_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(video_id) DO UPDATE SET
        channel_id = excluded.channel_id,
        title = excluded.title,
        published_at = excluded.published_at,
        thumbnail_url = excluded.thumbnail_url,
        url = excluded.url,
        duration_seconds = excluded.duration_seconds,
        is_short = excluded.is_short,
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

        const videoIds = uploads
            .map((item) => item.contentDetails.videoId)
            .filter(Boolean);

        const videoDetails =
            videoIds.length > 0
                ? await getVideoDetails(youtube, videoIds)
                : [];
                
        const detailsByVideoId = new Map(
            videoDetails.map((video) => [
                video.id,
                video.contentDetails
            ])
        );

        console.log(`Recent uploads from ${channel.name}:`);

        for (const item of uploads) {
            const videoId = item.contentDetails.videoId;

            const details = detailsByVideoId.get(videoId);

            const durationSeconds = durationToSeconds(
                details?.duration
            );

            const isShort =
                durationSeconds !== null &&
                    durationSeconds <= 180
                    ? 1
                    : 0;

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
                videoUrl,
                durationSeconds,
                isShort
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