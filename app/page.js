import Link from "next/link";
import { openDatabase } from "../lib/db";
import { Temporal } from "@js-temporal/polyfill";

function formatRelativeTime(dateTime) {
  const normalizedDateTime =
    dateTime.includes("T")
      ? dateTime
      : `${dateTime.replace(" ", "T")}Z`;

  const published = Temporal.Instant.from(normalizedDateTime);
  const now = Temporal.Now.instant();

  const seconds = Math.floor(
    (now.epochMilliseconds - published.epochMilliseconds) / 1000
  );

  const formatter = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  });

  if (seconds < 60) {
    return formatter.format(-seconds, "second");
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return formatter.format(-minutes, "minute");
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return formatter.format(-hours, "hour");
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return formatter.format(-days, "day");
  }

  const weeks = Math.floor(days / 7);

  if (days < 30) {
    return formatter.format(-weeks, "week");
  }

  const months = Math.floor(days / 30);

  if (months < 12) {
    return formatter.format(-months, "month");
  }

  const years = Math.floor(days / 365);

  return formatter.format(-years, "year");
}

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

  const requestedPage = Number(params?.page ?? 1);

  const page =
    Number.isInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  const offset = (page - 1) * settings.feed_size;

  const videos = db
    .prepare(`
            SELECT
                youtube_videos.video_id,
                youtube_videos.title,
                youtube_videos.published_at,
                youtube_videos.url,
                youtube_videos.duration_seconds,
                youtube_videos.is_short,
                youtube_channels.channel_id,
                youtube_channels.name AS channel_name
            FROM youtube_videos
            JOIN youtube_channels
                ON youtube_channels.channel_id = youtube_videos.channel_id
            WHERE youtube_channels.enabled = 1
            ${typeFilter}
            ORDER BY youtube_videos.published_at DESC
            LIMIT ${settings.feed_size + 1}
            OFFSET ${offset}
        `)
    .all();

  const lastSync = db
    .prepare(`
            SELECT MAX(fetched_at) AS last_synced_at
            FROM youtube_videos
        `)
    .get();

  db.close();

  const hasNextPage = videos.length > settings.feed_size;
  const displayedVideos = videos.slice(0, settings.feed_size);

  return (
    <>
      <header>
        <h1>YouTube Feed</h1>
        <p>Recent uploads from your subscriptions.</p>

        {lastSync?.last_synced_at && (
          <p>
            Last synced {formatRelativeTime(lastSync.last_synced_at)}
          </p>
        )}

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
        {displayedVideos.length === 0 ? (
          <p>No videos found.</p>
        ) : (
          displayedVideos.map((video) => (
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
                <strong>
                  <a
                    href={`https://www.youtube.com/channel/${video.channel_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {video.channel_name}
                  </a>
                </strong>
                <br />
                {formatRelativeTime(video.published_at)}
              </p>
            </article>
          ))
        )}
      </section>
      <nav aria-label="Feed pagination">
        <ul>
          {page > 1 && (
            <li>
              <Link href={`/?type=${type}&page=${page - 1}`}>
                Previous
              </Link>
            </li>
          )}

          {hasNextPage && (
            <li>
              <Link href={`/?type=${type}&page=${page + 1}`}>
                Next
              </Link>
            </li>
          )}
        </ul>
      </nav>
      <footer>
        <Link href="/settings">
          Go to settings
        </Link>
      </footer>
    </>
  );
}