import Link from "next/link";
import { openDatabase } from "../../lib/db";
import { saveSettings } from "./actions";

export default async function Settings({ searchParams }) {
    const params = await searchParams;
    const saved = params?.saved === "true";

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

    db.close();

    return (
        <>
            <header>
                <h1>Settings</h1>
                <p>Define your settings</p>
            </header>
            <section>
                {saved && (
                    <p role="status">
                        Settings saved successfully.
                    </p>
                )}

                <form action={saveSettings}>
                    <fieldset>
                        <label>
                            Feed Size
                            <input
                                name="feed_size"
                                type="number"
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