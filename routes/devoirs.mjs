import express from "express";
import { body } from "express-validator";
import * as homeworkController from "../controllers/homeworkController.mjs";

const router = express.Router();

// Validation Middleware
const createEventValidation = [
  body('title').trim().escape().notEmpty().withMessage('Titre requis'),
  body('subject').trim().escape().notEmpty().withMessage('Matière requise'),
  body('description').trim().escape(),
  body('attachment').trim().escape(), // Basic sanitation for URL/path
  body('class').trim().escape().optional()
];

const commentValidation = [
  body('content').trim().escape().notEmpty().withMessage('Le commentaire ne peut pas être vide')
];

// List / index
router.get("/events", homeworkController.listEvents);

// New form
router.get("/events/new", homeworkController.showNewForm);

// Create
router.post("/events", createEventValidation, homeworkController.createEvent);

// Show
router.get("/events/:id", homeworkController.showEvent);

// Post a comment
router.post("/events/:id/comments", commentValidation, homeworkController.postComment);

// Edit form
router.get("/events/:id/edit", homeworkController.showEditForm);

// Toggle completion status
router.post("/events/:id/toggle-completion", homeworkController.toggleCompletion);

// Update
router.put("/events/:id", createEventValidation, homeworkController.updateEvent);

// Delete
router.delete("/events/:id", homeworkController.deleteEvent);

// Export iCal
router.get("/events/:id/ical", homeworkController.exportIcal);

// Agenda (calendar view)
router.get("/agenda", homeworkController.showAgenda);

// Seed sample data
router.get("/seed", homeworkController.seedData);

export default router;
