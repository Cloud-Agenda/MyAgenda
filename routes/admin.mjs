import express from "express";
import { Users } from "../databases/db.mjs";

const router = express.Router();

router.get("/admin/users", async (req, res) => {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.status(403).send("Accès interdit");
    }
    try {
        const users = await Users.findAll();
        res.render("admin_users", { users });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des utilisateurs");
    }
});

router.delete("/admin/users/:id", async (req, res) => {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.status(403).send("Accès interdit");
    }
    try {
        const user = await Users.findByPk(req.params.id);
        if (!user) return res.status(404).send("Utilisateur introuvable");

        // Prevent deleting oneself
        if (user.id === req.session.user.id) {
            return res.status(400).send("Vous ne pouvez pas vous supprimer vous-même");
        }

        await user.destroy();
        res.redirect("/admin/users");
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la suppression de l'utilisateur");
    }
});

router.post("/admin/users/:id/toggle-admin", async (req, res) => {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.status(403).send("Accès interdit");
    }
    try {
        const user = await Users.findByPk(req.params.id);
        if (!user) return res.status(404).send("Utilisateur introuvable");

        // Prevent removing admin rights from oneself
        if (user.id === req.session.user.id) {
            return res.status(400).send("Vous ne pouvez pas modifier vos propres droits");
        }

        await user.update({ isAdmin: !user.isAdmin });
        res.redirect("/admin/users");
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la modification des droits");
    }
});

export default router;
