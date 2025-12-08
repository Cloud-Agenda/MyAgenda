import express from "express";
import { Homeworks, Users, HomeworkCompletions, Notifications, Comments } from "../databases/db.mjs";
import { Op } from "sequelize";

const router = express.Router();

// Helper to build Date from date + optional time
function buildDueDate(dateStr, timeStr) {
  if (!dateStr) return null;
  if (timeStr) return new Date(`${dateStr}T${timeStr}:00`);
  return new Date(dateStr);
}

// List / index
router.get("/events", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  try {
    const uid = req.session.user.id;
    const classe = req.session.user.classe;
    const isAdmin = req.session.user.isAdmin;

    let whereClause;

    if (isAdmin) {
      // Admin voit tout, filtre seulement par matière si demandé
      whereClause = req.query.subject ? { subject: req.query.subject } : {};
    } else {
      // Non-admin : filtre par classe/créateur ET matière si demandé
      const conditions = [
        { [Op.or]: [{ class: classe }, { creatorId: uid }] }
      ];

      if (req.query.subject) {
        conditions.push({ subject: req.query.subject });
      }

      whereClause = conditions.length > 1 ? { [Op.and]: conditions } : conditions[0];
    }

    // Gestion du tri par date
    const sortOrder = req.query.sort === 'desc' ? 'DESC' : 'ASC';

    const events = await Homeworks.findAll({
      where: whereClause,
      include: [{ model: Users, as: "creator", attributes: ["username"] }],
      order: [["due_date", sortOrder]],
    });

    // Récupérer les statuts de complétion pour l'utilisateur actuel
    const completions = await HomeworkCompletions.findAll({
      where: {
        userId: uid,
        homeworkId: events.map(e => e.id)
      }
    });

    // Créer un map pour accès rapide
    const completionMap = {};
    completions.forEach(c => {
      completionMap[c.homeworkId] = c.completed;
    });

    // Ajouter le statut de complétion à chaque événement
    events.forEach(e => {
      e.isCompleted = completionMap[e.id] || false;
    });

    res.render("index", {
      events,
      currentSubject: req.query.subject || '',
      currentSort: req.query.sort || 'asc'
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).send("Erreur lors de la récupération des événements");
  }
});

// New form
router.get("/events/new", (req, res) => {
  res.render("new");
});

// Create
router.post("/events", async (req, res) => {
  const { title, subject, due_date, class: classe, attachment, description } = req.body;
  try {
    // Validation minimale côté serveur
    if (!title || !subject || !due_date || !classe) {
      return res.render("new", { error: "Tous les champs obligatoires doivent être remplis.", form: req.body });
    }
    // Conversion date
    const dueDateObj = due_date ? new Date(due_date) : null;
    // Determine class: if admin, use body.class, else use user.classe
    let targetClass = classe;
    if (req.session.user && !req.session.user.isAdmin) {
      targetClass = req.session.user.classe;
    }

    const newHomework = await Homeworks.create({
      title,
      subject,
      due_date: dueDateObj,
      class: targetClass,
      attachment,
      description
      , creatorId: req.session && req.session.user ? req.session.user.id : null
    });

    // Créer des notifications pour les élèves de la classe
    try {
      if (req.session.user) {
        const usersInClass = await Users.findAll({
          where: {
            classe: targetClass,
            id: { [Op.ne]: req.session.user.id } // Ne pas se notifier soi-même
          }
        });

        if (usersInClass.length > 0) {
          const notifications = usersInClass.map(user => ({
            userId: user.id,
            homeworkId: newHomework.id,
            type: 'new_homework',
            message: `Nouveau devoir : ${title} (${subject})`,
            read: false
          }));

          await Notifications.bulkCreate(notifications);
        }
      }
    } catch (notifError) {
      console.error("Erreur lors de la création des notifications:", notifError);
      // On ne bloque pas la création du devoir si les notifs échouent
    }

    res.redirect("/events");
  } catch (err) {
    console.error(err);
    res.render("new", { error: "Erreur lors de la création.", form: req.body });
  }
});

// Show
router.get("/events/:id", async (req, res) => {
  try {
    const event = await Homeworks.findByPk(req.params.id, {
      include: [
        { model: Users, as: "creator", attributes: ["username"] },
        {
          model: Comments,
          include: [{ model: Users, as: "User", attributes: ["username"] }],
          order: [['createdAt', 'ASC']]
        }
      ],
    });
    if (!event) return res.status(404).send("Introuvable");

    if (!req.session.user) return res.redirect("/login");
    if (!req.session.user.isAdmin && event.class !== req.session.user.classe && event.creatorId !== req.session.user.id) {
      return res.status(403).send("Accès interdit : ce devoir n'est pas pour votre classe.");
    }

    res.render("show", { event });
  } catch (error) {
    res.status(500).send("Erreur interne");
  }
});

// Post a comment
router.post("/events/:id/comments", async (req, res) => {
  if (!req.session.user) return res.status(403).send("Non connecté");

  try {
    const homeworkId = req.params.id;
    const userId = req.session.user.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.redirect(`/events/${homeworkId}`);
    }

    const event = await Homeworks.findByPk(homeworkId);
    if (!event) return res.status(404).send("Introuvable");

    // Check access rights
    if (!req.session.user.isAdmin && event.class !== req.session.user.classe && event.creatorId !== req.session.user.id) {
      return res.status(403).send("Accès interdit");
    }

    await Comments.create({
      content,
      userId,
      homeworkId
    });

    // Notify homework creator if someone else comments
    if (event.creatorId && event.creatorId !== userId) {
      await Notifications.create({
        userId: event.creatorId,
        homeworkId: event.id,
        type: 'comment',
        message: `${req.session.user.username} a commenté votre devoir "${event.title}"`,
        read: false
      });
    }

    res.redirect(`/events/${homeworkId}`);
  } catch (error) {
    console.error("Error posting comment:", error);
    res.status(500).send("Erreur lors de l'ajout du commentaire");
  }
});

// Edit form
router.get("/events/:id/edit", async (req, res) => {
  try {
    const event = await Homeworks.findByPk(req.params.id);
    if (!event) return res.status(404).send("Introuvable");

    if (!req.session.user) return res.redirect("/login");
    if (!req.session.user.isAdmin && event.class !== req.session.user.classe && event.creatorId !== req.session.user.id) {
      return res.status(403).send("Accès interdit");
    }

    res.render("edit", { event });
  } catch (error) {
    res.status(500).send("Erreur interne");
  }
});

// Toggle completion status
router.post("/events/:id/toggle-completion", async (req, res) => {
  if (!req.session.user) return res.status(403).json({ success: false, error: "Non connecté" });

  try {
    const homeworkId = req.params.id;
    const userId = req.session.user.id;

    // Check if completion record exists
    const completion = await HomeworkCompletions.findOne({
      where: { homeworkId, userId }
    });

    let isCompleted = false;

    if (completion) {
      // Toggle
      isCompleted = !completion.completed;
      await completion.update({ completed: isCompleted });
    } else {
      // Create new record
      await HomeworkCompletions.create({
        homeworkId,
        userId,
        completed: true
      });
      isCompleted = true;
    }

    res.json({ success: true, completed: isCompleted });
  } catch (error) {
    console.error("Error toggling completion:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// Update
router.put("/events/:id", async (req, res) => {
  try {
    const event = await Homeworks.findByPk(req.params.id);
    if (!event) return res.status(404).send("Introuvable");

    if (!req.session.user) return res.status(403).send("Non connecté");
    if (!req.session.user.isAdmin && event.class !== req.session.user.classe && event.creatorId !== req.session.user.id) {
      return res.status(403).send("Accès interdit");
    }

    const { title, subject, due_date, time, description, attachment } = req.body;
    let className = req.body["class"] || req.body.className || "";

    // Si non admin, on force la classe de l'utilisateur (ou on garde celle de l'event si c'est le créateur)
    // Mais la consigne est "le devoir doit s'attribuer à la classe de l'élève".
    // Donc si je modifie, je reste dans ma classe.
    if (!req.session.user.isAdmin) {
      className = req.session.user.classe;
    }

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

    if (!req.session.user) return res.status(403).send("Non connecté");
    if (!req.session.user.isAdmin && event.class !== req.session.user.classe && event.creatorId !== req.session.user.id) {
      return res.status(403).send("Accès interdit");
    }
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

    if (!req.session.user) return res.redirect("/login");
    if (!req.session.user.isAdmin && event.class !== req.session.user.classe && event.creatorId !== req.session.user.id) {
      return res.status(403).send("Accès interdit");
    }

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
    const now = new Date();
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = req.query.month ? parseInt(req.query.month) : now.getMonth() + 1;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    // Récupération filtrée par classe
    if (!req.session.user) return res.redirect("/login");
    const uid = req.session.user.id;
    const classe = req.session.user.classe;
    const isAdmin = req.session.user.isAdmin;

    const whereGlobal = isAdmin ? {} : {
      [Op.or]: [{ class: classe }, { creatorId: uid }],
    };

    const eventsAll = await Homeworks.findAll({
      where: whereGlobal,
      include: [{ model: Users, as: "creator", attributes: ["username"] }],
      order: [["due_date", "ASC"]],
    });
    // Filtrer côté JS pour le mois affiché
    const evs = eventsAll.filter(e => {
      const d = e.due_date ? new Date(e.due_date) : null;
      return d && d >= start && d <= end;
    });

    // Générer la matrice du calendrier
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const weeks = [];
    let week = new Array(7).fill(null);
    let dayCounter = 1;
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
      // Utilise getUTCDate pour éviter les problèmes de fuseau horaire
      const day = d.getUTCDate();
      eventsByDay[day] = eventsByDay[day] || [];
      eventsByDay[day].push(ev);
    });

    const monthName = start.toLocaleString("fr-FR", { month: "long" });
    // Navigation mois précédent/suivant (1-based)
    let prevMonth = month - 1, prevYear = year;
    let nextMonth = month + 1, nextYear = year;
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    if (nextMonth > 12) { nextMonth = 1; nextYear++; }

    res.render("calendar", {
      weeks,
      eventsByDay,
      todayDay: (now.getFullYear() === year && (now.getMonth() + 1) === month) ? now.getDate() : null,
      monthName,
      year,
      prevYear,
      prevMonth,
      nextYear,
      nextMonth,
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
