import Link from "next/link";
import { openDatabase } from "../lib/db";

export default async function Home({ searchParams }) {
  const params = await searchParams;

  const validTypes = ["all", "videos", "shorts"];

  const db = openDatabase();

  const settings = db
    .prepare(`
        SELECT
            feed_size,
            default_view,
            shorts_behavior
        FROM app_settings
        WHERE id = 1
    `)
    .get();

  let type = validTypes.includes(params?.type)
    ? params.type
    : settings.default_view;

  if (
    settings.shorts_behavior === "hide" &&
    type === "shorts"
  ) {
    type = "videos";
  }

  let typeFilter = "";

  if (type === "videos") {
    typeFilter = "AND youtube_videos.is_short = 0";
  }

  if (type === "shorts") {
    typeFilter = "AND youtube_videos.is_short = 1";
  }

  if (
    type === "all" &&
    settings.shorts_behavior === "hide"
  ) {
    typeFilter = "AND youtube_videos.is_short = 0";
  }

  const videos = db
    .prepare(`
            SELECT
                youtube_videos.video_id,
                youtube_videos.title,
                youtube_videos.published_at,
                youtube_videos.url,
                youtube_videos.duration_seconds,
                youtube_videos.is_short,
                youtube_channels.name AS channel_name
            FROM youtube_videos
            JOIN youtube_channels
                ON youtube_channels.channel_id = youtube_videos.channel_id
            WHERE youtube_channels.enabled = 1
            ${typeFilter}
            ORDER BY youtube_videos.published_at DESC
            LIMIT ${settings.feed_size}
        `)
    .all();

  db.close();

  return (
    <>
      <header>
        <h1>YouTube Feed</h1>
        <p>Recent uploads from your subscriptions.</p>

        <nav aria-label="Feed type">
          <ul>
            <li>
              <Link
                href="/?type=all"
                aria-current={type === "all" ? "page" : undefined}
              >
                All
              </Link>
            </li>

            <li>
              <Link
                href="/?type=videos"
                aria-current={type === "videos" ? "page" : undefined}
              >
                Videos
              </Link>
            </li>

            {settings.shorts_behavior !== "hide" && (
              <li>
                <Link
                  href="/?type=shorts"
                  aria-current={type === "shorts" ? "page" : undefined}
                >
                  Shorts
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </header>

      <section>
        {videos.length === 0 ? (
          <p>No videos found.</p>
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
      <footer>
        <Link href="/settings">
          Go to settings
        </Link>
      </footer>
    </>
  );
}