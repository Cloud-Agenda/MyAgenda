
import request from 'supertest';
import express from 'express';
import session from 'express-session';
// Mock dependencies using unstable_mockModule for ESM
import { jest } from '@jest/globals';

jest.unstable_mockModule('../controllers/homeworkController.mjs', () => ({
    listEvents: (req, res) => res.status(200).send('Events List'),
    showNewForm: (req, res) => res.status(200).send('New Form'),
    createEvent: (req, res) => res.status(302).redirect('/events'),
    showEvent: (req, res) => res.status(200).send('Event Details'),
    postComment: (req, res) => res.status(302).redirect('/events/1'),
    showEditForm: (req, res) => res.status(200).send('Edit Form'),
    toggleCompletion: (req, res) => res.json({ success: true, completed: true }),
    updateEvent: (req, res) => res.status(302).redirect('/events/1'),
    deleteEvent: (req, res) => res.status(302).redirect('/events'),
    exportIcal: (req, res) => res.status(200).send('ICAL'),
    showAgenda: (req, res) => res.status(200).send('Agenda'),
    seedData: (req, res) => res.status(200).send('Seeded')
}));

// Dynamic import needed after caching mocks
const homeworkRoutes = await import('../routes/devoirs.mjs').then(m => m.default);

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));

// Simple mock for CSRF as it's not the target of this functional test of routes
// We bypass CSRF in tests usually or mock it. 
// Since routes/devoirs.mjs imports validation but not CSRF directly (it's in app.mjs), 
// we can test the routes in isolation.

app.use('/', homeworkRoutes);

describe('Homework Routes', () => {
    it('GET /events should return 200', async () => {
        const res = await request(app).get('/events');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toContain('Events List');
    });

    it('GET /events/new should return 200', async () => {
        const res = await request(app).get('/events/new');
        expect(res.statusCode).toEqual(200);
    });

    it('POST /events should redirect on success (mocked)', async () => {
        const res = await request(app)
            .post('/events')
            .send({ title: 'Test', subject: 'Math', description: 'Desc' });
        expect(res.statusCode).toEqual(302);
        expect(res.header['location']).toBe('/events');
    });

    it('POST /events/1/toggle-completion should return json', async () => {
        const res = await request(app).post('/events/1/toggle-completion');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ success: true, completed: true });
    });
});
