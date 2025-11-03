import express from "express";
import bcrypt from "bcrypt";
import session from "express-session";
import { Users } from "../databases/db.mjs"; // si tu exportes ton model depuis db.mjs

const router = express.Router();

// Middleware de session (tu peux aussi le mettre dans app.mjs)
router.use(
  session({
    secret: "super_secret_key", // à remplacer par une vraie clé
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // mettre true en prod avec HTTPS
  })
);

// Page de connexion
router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

// Traitement du login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Users.findOne({ where: { email } });
    if (!user) return res.render("login", { error: "Utilisateur introuvable" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.render("login", { error: "Mot de passe incorrect" });

    req.session.user = user;
    res.redirect("/devoirs");
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
