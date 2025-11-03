import express from "express";
import bcrypt from "bcrypt";
import { Users } from "../databases/db.mjs"; // si tu exportes ton model depuis db.mjs

const router = express.Router();

// Page de connexion
router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

// Traitement du login (accept "identifier" = email ou username)
router.post("/login", async (req, res) => {
  const identifier = req.body.identifier || req.body.email;
  const password = req.body.password;

  try {
    // Essayer email d'abord, puis username
    let found = await Users.findOne({ where: { email: identifier } });
    if (!found) found = await Users.findOne({ where: { username: identifier } });

    if (!found) return res.render("login", { error: "Utilisateur introuvable" });

    const valid = await bcrypt.compare(password, found.password);
    if (!valid) return res.render("login", { error: "Mot de passe incorrect" });

    req.session.user = { id: found.id, username: found.username, email: found.email };
    res.redirect("/events");
  } catch (error) {
    console.error(error);
    res.render("login", { error: "Erreur interne" });
  }
});

// Page d'inscription
router.get("/register", (req, res) => {
  res.render("register", { error: null });
});

// Traitement de l'inscription
router.post("/register", async (req, res) => {
  const { username, email, password, classe } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await Users.create({
      username,
      email,
      password: hashedPassword,
      classe,
    });

    res.redirect("/login");
  } catch (error) {
    console.error(error);
    res.render("register", { error: "Erreur lors de l'inscription" });
  }
});

// Déconnexion
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

export default router;
