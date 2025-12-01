import { Homeworks } from "../databases/db.mjs";
import { Op } from "sequelize";

export async function deleteExpiredHomeworks() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const result = await Homeworks.destroy({
            where: {
                due_date: {
                    [Op.lt]: today
                }
            }
        });

        if (result > 0) {
            console.log(`[Auto-Cleanup] Deleted ${result} expired homework(s).`);
        }
    } catch (error) {
        console.error("[Auto-Cleanup] Error:", error);
    }
}
