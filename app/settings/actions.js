"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { openDatabase } from "../../lib/db";

export async function saveSettings(formData) {
    const feedSize = Number(formData.get("feed_size"));
    const defaultView = formData.get("default_view");
    const shortsBehaviour = formData.get("shorts_behavior");

    const validDefaultViews = ["all", "videos", "shorts"];
    const validShortsBehaviours = ["include", "hide"];

    if (
        !Number.isInteger(feedSize) ||
        feedSize < 10 ||
        feedSize > 200
    ) {
        throw new Error("Invalid feed size.");
    }

    if (!validDefaultViews.includes(defaultView)) {
        throw new Error("Invalid default view.");
    }

    if (!validShortsBehaviours.includes(shortsBehaviour)) {
        throw new Error("Invalid Shorts behaviour.");
    }

    const db = openDatabase();

    try {
        db.prepare(`
            UPDATE app_settings
            SET
                feed_size = ?,
                default_view = ?,
                shorts_behavior = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        `).run(
            feedSize,
            defaultView,
            shortsBehaviour
        );
    } catch (error) {
        console.error(
            "Settings update failed:",
            error.message
        );

        throw error;
    } finally {
        db.close();
    }

    revalidatePath("/settings");
    redirect("/settings?saved=true");
}