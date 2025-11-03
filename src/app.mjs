import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.mjs";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/", authRoutes);

app.listen(3000, () => console.log("✅ Server running on http://localhost:3000"));
