import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import authRoutes from "./routes/auth.mjs";
import homeworkRoutes from "./routes/devoirs.mjs";

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

app.use("/", homeworkRoutes);
app.use("/", authRoutes);

const port = process.env.DB_PORT;
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
