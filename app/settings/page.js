import Link from "next/link";
import { openDatabase } from "../../lib/db";
import { saveSettings } from "./actions";
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

export default async function Settings({ searchParams }) {
    const params = await searchParams;
    const saved = params?.saved === "true";
    const error = params?.error;

    const errorMessages = {
        feed_size: "Feed size must be between 10 and 200.",
        default_view: "Please select a valid default view.",
        shorts_behavior: "Please select a valid Shorts behaviour.",
        shorts_default: "Shorts cannot be the default view while Shorts are hidden.",
    };

    const errorMessage = errorMessages[error];

    const db = openDatabase();

    const settings = db

        .prepare(`
            SELECT
                feed_size,
                default_view,
                shorts_behavior,
                updated_at
            FROM app_settings
            WHERE id = 1
        `)
        .get();

    db.close();

    return (
        <>
            <header>
                <h1>Settings</h1>
                <p>Define your settings</p>
                {settings?.updated_at && (
                    <p>
                        Settings last updated {formatRelativeTime(settings.updated_at)}
                    </p>
                )}
            </header>
            <section>
                {saved && (
                    <p className="status-message success" role="status">
                        Settings saved successfully.
                    </p>
                )}

                {errorMessage && (
                    <p className="status-message error" role="alert">
                        {errorMessage}
                    </p>
                )}

                <form action={saveSettings}>
                    <fieldset>
                        <label>
                            Feed Size
                            <input
                                name="feed_size"
                                type="number"
                                min="10"
                                max="200"
                                defaultValue={settings.feed_size}
                            />
                        </label>

                        <label>
                            Default View
                            <select
                                name="default_view"
                                defaultValue={settings.default_view}
                            >
                                <option value="all">All</option>
                                <option value="videos">Videos</option>
                                <option value="shorts">Shorts</option>
                            </select>
                        </label>

                        <label>
                            Shorts Behaviour
                            <select
                                name="shorts_behavior"
                                defaultValue={settings.shorts_behavior}
                            >
                                <option value="include">Include</option>
                                <option value="hide">Hide</option>
                            </select>
                        </label>
                    </fieldset>

                    <button type="submit">
                        Save settings
                    </button>
                </form>
            </section>
            <footer>
                <Link href="/">
                    Back to feed
                </Link>
            </footer>
        </>
    );
}