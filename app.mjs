import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import authRoutes from "./routes/auth.mjs";
import homeworkRoutes from "./routes/devoirs.mjs";
import adminRoutes from "./routes/admin.mjs";
import notificationRoutes from "./routes/notifications.mjs";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// dynamic import for optional dependency
let methodOverride;
try {
  methodOverride = (await import("method-override")).default;
} catch (err) {
  console.warn(
    "Optional package 'method-override' not found. To enable HTTP method overrides install it: npm install method-override"
  );
}

if (methodOverride) {
  app.use(methodOverride("_method"));
}

app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "super_secret_key", // remplacer par une vraie clé en prod
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // true en prod avec HTTPS
  })
);

// Middleware pour rendre l'utilisateur disponible dans toutes les vues
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  // console.log("Middleware user:", res.locals.user ? res.locals.user.username : "null");
  next();
});

import { Homeworks } from "./databases/db.mjs";
// Route principale "/"
app.get("/", (req, res) => {
  res.redirect("/events");
});

app.use("/", homeworkRoutes);
app.use("/", authRoutes);
app.use("/", adminRoutes);
app.use("/", notificationRoutes);

import { deleteExpiredHomeworks } from "./utils/cleanup.mjs";
import { createReminders } from "./scripts/create_reminders.mjs";

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Run cleanup on startup
  deleteExpiredHomeworks();

  // Run cleanup every 24 hours
  setInterval(deleteExpiredHomeworks, 24 * 60 * 60 * 1000);

  // Run reminders check on startup
  createReminders();

  // Run reminders check every hour
  setInterval(createReminders, 60 * 60 * 1000);
});
