import express from "express";
import { Homeworks } from "../databases/db.mjs";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const homeworks = await Homeworks.findAll();
    res.json(homeworks);
  } catch (error) {
    res.status(500).json({ error: "Error fetching homeworks" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const homework = await Homeworks.findByPk(req.params.id);
    if (!homework) return res.status(404).json({ error: "Homework not found" });
    res.json(homework);
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

router.post("/", async (req, res) => {
  const { title, subject, due_date, description, attachment, class: className } = req.body;

  if (!title || !subject || !due_date || !className)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const homework = await Homeworks.create({
      title,
      subject,
      due_date,
      description,
      attachment,
      class: className,
    });
    res.status(201).json(homework);
  } catch (error) {
    res.status(500).json({ error: "Error creating homework" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const homework = await Homeworks.findByPk(req.params.id);
    if (!homework) return res.status(404).json({ error: "Homework not found" });

    await homework.update(req.body);
    res.json(homework);
  } catch (error) {
    res.status(500).json({ error: "Error updating homework" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const homework = await Homeworks.findByPk(req.params.id);
    if (!homework) return res.status(404).json({ error: "Homework not found" });

    await homework.destroy();
    res.json({ message: "Homework deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting homework" });
  }
});

export default router;
