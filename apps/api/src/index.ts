import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { requireAuth } from './middleware/auth';
import profileRouter from './routes/profile';
import preferencesRouter from './routes/preferences';
import instagramRouter from './routes/instagram';

dotenv.config({ path: '../../.env' });

const app = express();
const port = process.env.API_PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: '@feedflow/api' });
});


import automationRouter from './routes/automation';

// Setup routes here:
app.use('/profile', requireAuth, profileRouter);
app.use('/preferences', requireAuth, preferencesRouter);
app.use('/instagram', requireAuth, instagramRouter);
app.use('/automation', requireAuth, automationRouter);
// app.use('/auth', authRouter);
// app.use('/analytics', analyticsRouter);

app.listen(port, () => {
  console.log(`FeedFlow API listening on http://localhost:${port}`);
});
