import express from "express";
import { Notifications, Homeworks } from "../databases/db.mjs";

const router = express.Router();

// Get all notifications for the current user
router.get("/notifications", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        const notifications = await Notifications.findAll({
            where: { userId: req.session.user.id },
            include: [{ model: Homeworks, attributes: ['id', 'title', 'subject'] }],
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        const unreadCount = notifications.filter(n => !n.read).length;

        res.render("notifications", { notifications, unreadCount });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).send("Erreur lors de la récupération des notifications");
    }
});

// Mark notification as read
router.post("/notifications/:id/read", async (req, res) => {
    if (!req.session.user) return res.status(403).send("Non connecté");

    try {
        const notification = await Notifications.findOne({
            where: {
                id: req.params.id,
                userId: req.session.user.id
            }
        });

        if (notification) {
            await notification.update({ read: true });
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, error: "Notification not found" });
        }
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Mark all notifications as read
router.post("/notifications/read-all", async (req, res) => {
    if (!req.session.user) return res.status(403).send("Non connecté");

    try {
        await Notifications.update(
            { read: true },
            { where: { userId: req.session.user.id, read: false } }
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get unread count (for header badge)
router.get("/notifications/unread-count", async (req, res) => {
    if (!req.session.user) return res.json({ count: 0 });

    try {
        const count = await Notifications.count({
            where: {
                userId: req.session.user.id,
                read: false
            }
        });
        res.json({ count });
    } catch (error) {
        console.error("Error getting unread count:", error);
        res.json({ count: 0 });
    }
});

export default router;
