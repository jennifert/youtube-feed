import { openDatabase } from "../lib/db";

export default function Home() {
  const db = openDatabase();

  const videos = db
    .prepare(`
      SELECT
        youtube_videos.video_id,
        youtube_videos.title,
        youtube_videos.published_at,
        youtube_videos.url,
        youtube_channels.name AS channel_name
      FROM youtube_videos
      JOIN youtube_channels
        ON youtube_channels.channel_id = youtube_videos.channel_id
      WHERE youtube_channels.enabled = 1
      ORDER BY youtube_videos.published_at DESC
      LIMIT 50
    `)
    .all();

  db.close();

  return (
    <>
      <header>
        <h1>YouTube Feed</h1>
        <p>Recent uploads from your subscriptions.</p>
      </header>

      <section>
        {videos.length === 0 ? (
          <p>No videos found. Run the YouTube sync first.</p>
        ) : (
          videos.map((video) => (
            <article key={video.video_id}>
              <h2>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {video.title}
                </a>
              </h2>

              <p>
                <strong>{video.channel_name}</strong>
                <br />
                {video.published_at}
              </p>
            </article>
          ))
        )}
      </section>
    </>
  );
}