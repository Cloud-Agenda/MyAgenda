import { Homeworks, Users, Notifications, sequelize } from "../databases/db.mjs";
import { Op } from "sequelize";
import { fileURLToPath } from 'url';

// Fonction pour créer des rappels pour les devoirs qui arrivent demain
export async function createReminders() {
    try {
        const now = new Date();
        const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Trouver tous les devoirs qui sont dus dans les prochaines 24h
        const homeworksDueSoon = await Homeworks.findAll({
            where: {
                due_date: {
                    [Op.gt]: now,
                    [Op.lte]: twentyFourHoursLater
                }
            }
        });

        console.log(`Found ${homeworksDueSoon.length} homework(s) due within 24h`);

        for (const homework of homeworksDueSoon) {
            // Trouver tous les utilisateurs de la même classe
            const users = await Users.findAll({
                where: {
                    classe: homework.class
                }
            });

            for (const user of users) {
                // Vérifier si une notification existe déjà
                const existingNotif = await Notifications.findOne({
                    where: {
                        userId: user.id,
                        homeworkId: homework.id,
                        type: 'reminder'
                    }
                });

                if (!existingNotif) {
                    const dueDate = new Date(homework.due_date);
                    const time = dueDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');

                    const isToday = dueDate.getDate() === now.getDate() &&
                        dueDate.getMonth() === now.getMonth() &&
                        dueDate.getFullYear() === now.getFullYear();

                    const dayText = isToday ? "aujourd'hui" : "demain";

                    await Notifications.create({
                        userId: user.id,
                        homeworkId: homework.id,
                        type: 'reminder',
                        message: `Rappel : Le devoir "${homework.title}" (${homework.subject}) est à rendre ${dayText} à ${time} !`,
                        read: false
                    });
                    console.log(`Created reminder for user ${user.username} - homework ${homework.title}`);
                }
            }
        }

        console.log('Reminders check completed');
    } catch (error) {
        console.error('Error creating reminders:', error);
    }
}

// Si le script est exécuté directement via node
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    createReminders().then(() => {
        console.log('Done');
        process.exit(0);
    }).catch(err => {
        console.error(err);
        process.exit(1);
    });
}
