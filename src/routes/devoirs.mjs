import express from "express";
import { Homeworks } from "../databases/db.mjs";

const router = express.Router();

// Helper to build Date from date + optional time
function buildDueDate(dateStr, timeStr) {
  if (!dateStr) return null;
  if (timeStr) return new Date(`${dateStr}T${timeStr}:00`);
  return new Date(dateStr);
}

// List / index
router.get("/events", async (req, res) => {
  try {
    const events = await Homeworks.findAll({ order: [["due_date", "ASC"]] });
    res.render("index", { events });
  } catch (error) {
    res.status(500).send("Erreur lors de la récupération des événements");
  }
});

// New form
router.get("/events/new", (req, res) => {
  res.render("new");
});

// Create
router.post("/events", async (req, res) => {
  try {
    const { title, subject, due_date, time, description, attachment } = req.body;
    const className = req.body["class"] || req.body.className || "";
    if (!title || !due_date || !className) {
      return res.status(400).send("Champs requis manquants");
    }
    const dueDateObj = buildDueDate(due_date, time);
    await Homeworks.create({
      title,
      subject,
      due_date: dueDateObj,
      description,
      attachment,
      class: className,
    });
    res.redirect("/events");
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la création");
  }
});

// Show
router.get("/events/:id", async (req, res) => {
  try {
    const event = await Homeworks.findByPk(req.params.id);
    if (!event) return res.status(404).send("Introuvable");
    res.render("show", { event });
  } catch (error) {
    res.status(500).send("Erreur interne");
  }
});

// Edit form
router.get("/events/:id/edit", async (req, res) => {
  try {
    const event = await Homeworks.findByPk(req.params.id);
    if (!event) return res.status(404).send("Introuvable");
    res.render("edit", { event });
  } catch (error) {
    res.status(500).send("Erreur interne");
  }
});

// Update
router.put("/events/:id", async (req, res) => {
  try {
    const event = await Homeworks.findByPk(req.params.id);
    if (!event) return res.status(404).send("Introuvable");

    const { title, subject, due_date, time, description, attachment } = req.body;
    const className = req.body["class"] || req.body.className || "";
    const dueDateObj = due_date ? buildDueDate(due_date, time) : event.due_date;

    await event.update({
      title,
      subject,
      due_date: dueDateObj,
      description,
      attachment,
      class: className,
    });

    res.redirect(`/events/${event.id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la mise à jour");
  }
});

// Delete
router.delete("/events/:id", async (req, res) => {
  try {
    const event = await Homeworks.findByPk(req.params.id);
    if (!event) return res.status(404).send("Introuvable");
    await event.destroy();
    res.redirect("/events");
  } catch (error) {
    res.status(500).send("Erreur lors de la suppression");
  }
});

// Export iCal
router.get("/events/:id/ical", async (req, res) => {
  try {
    const event = await Homeworks.findByPk(req.params.id);
    if (!event) return res.status(404).send("Introuvable");

    const start = event.due_date ? new Date(event.due_date).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z" : "";
    const end = start ? start : "";

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//MyAgenda//EN",
      "BEGIN:VEVENT",
      `UID:${event.id}@myagenda.local`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      event.due_date ? `DTSTART:${start}` : "",
      event.due_date ? `DTEND:${end}` : "",
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${(event.description || "").replace(/\n/g, "\\n")}`,
      `URL:${event.attachment || ""}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    res.setHeader("Content-Disposition", `attachment; filename=event-${event.id}.ics`);
    res.setHeader("Content-Type", "text/calendar");
    res.send(ics);
  } catch (error) {
    res.status(500).send("Erreur iCal");
  }
});

// Agenda (calendar view)
router.get("/agenda", async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) >= 0 ? parseInt(req.query.month) : new Date().getMonth();
    // mois JS 0-based
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);

    const events = await Homeworks.findAll({
      where: {
        due_date: {
          // sequelize requires operators; to keep minimal, fetch all and filter in JS
        },
      },
      order: [["due_date", "ASC"]],
    });

    // Filter JS-side
    const evs = events.filter(e => {
      const d = e.due_date ? new Date(e.due_date) : null;
      return d && d >= start && d <= end;
    });

    // prepare calendar matrix
    const firstDay = new Date(year, month, 1).getDay(); // 0..6 (Sun..Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks = [];
    let week = new Array(7).fill(null);
    let dayCounter = 1;
    // fill first week
    for (let i = firstDay; i < 7; i++) {
      week[i] = dayCounter++;
    }
    weeks.push(week);
    while (dayCounter <= daysInMonth) {
      week = new Array(7).fill(null);
      for (let i = 0; i < 7 && dayCounter <= daysInMonth; i++) {
        week[i] = dayCounter++;
      }
      weeks.push(week);
    }

    const eventsByDay = {};
    evs.forEach(ev => {
      const d = new Date(ev.due_date);
      const day = d.getDate();
      eventsByDay[day] = eventsByDay[day] || [];
      eventsByDay[day].push(ev);
    });

    const monthName = start.toLocaleString("default", { month: "long" });
    const prev = new Date(year, month - 1, 1);
    const next = new Date(year, month + 1, 1);

    res.render("calendar", {
      weeks,
      eventsByDay,
      todayDay: new Date().getDate(),
      monthName,
      year,
      prevYear: prev.getFullYear(),
      prevMonth: prev.getMonth(),
      nextYear: next.getFullYear(),
      nextMonth: next.getMonth(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur agenda");
  }
});

// Seed sample data
router.get("/seed", async (req, res) => {
  try {
    await Homeworks.bulkCreate([
      { title: "Math homework", subject: "Math", due_date: new Date(), description: "Exercices 1-10", class: "3A" },
      { title: "History reading", subject: "History", due_date: new Date(Date.now() + 86400000), description: "Chapitre 2", class: "3A" },
    ]);
    res.redirect("/events");
  } catch (e) {
    console.error(e);
    res.status(500).send("Erreur seed");
  }
});

export default router;
