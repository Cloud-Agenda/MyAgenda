import dotenv from "dotenv";
dotenv.config();
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import cookieParser from "cookie-parser";
import csrf from "csurf";
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
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_secret_dev",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production", // true en prod avec HTTPS
      httpOnly: true,
    },
  })
);

// CSRF Protection (must be after session/cookieParser and before routes)
app.use(csrf({ cookie: false })); // use session for storage

// Middleware pour rendre l'utilisateur et le token CSRF disponibles dans toutes les vues
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.csrfToken = req.csrfToken();
  next();
});

import { Homeworks } from "./databases/db.mjs";
// Route principale "/"
app.get("/", (req, res) => {
  if (req.session.user) {
    res.redirect("/events");
  } else {
    res.redirect("/login");
  }
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
