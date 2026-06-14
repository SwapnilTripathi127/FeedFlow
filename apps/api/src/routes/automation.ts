import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';

const router: Router = Router();

// In-memory mock engine state for the demo
const engineState: Record<string, {
  isRunning: boolean;
  personalizationScore: number;
  actionsToday: number;
  intervalId?: NodeJS.Timeout;
}> = {};

router.get('/stats', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    if (!engineState[userId]) {
      engineState[userId] = { isRunning: false, personalizationScore: 0, actionsToday: 0 };
    }

    const { intervalId, ...safeState } = engineState[userId]!;
    res.json(safeState);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/start', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    if (!engineState[userId]) {
      engineState[userId] = { isRunning: false, personalizationScore: 0, actionsToday: 0 };
    }

    if (engineState[userId].isRunning) {
      return res.json({ success: true, message: 'Engine already running' });
    }

    engineState[userId].isRunning = true;

    // Start background simulation
    engineState[userId].intervalId = setInterval(() => {
      const state = engineState[userId];
      if (!state || !state.isRunning) return;

      // Simulate an action (e.g., liked a post, followed a user)
      state.actionsToday += 1;

      // Simulate personalization score increasing towards 100
      if (state.personalizationScore < 100) {
        // Increases by 1-3% randomly
        state.personalizationScore = Math.min(100, state.personalizationScore + Math.floor(Math.random() * 3) + 1);
      }
    }, 3000); // Trigger every 3 seconds for fast demo

    const { intervalId, ...safeState } = engineState[userId]!;
    res.json({ success: true, state: safeState });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/stop', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    if (engineState[userId]) {
      engineState[userId].isRunning = false;
      if (engineState[userId].intervalId) {
        clearInterval(engineState[userId].intervalId);
      }
      
      const { intervalId, ...safeState } = engineState[userId]!;
      res.json({ success: true, state: safeState });
    } else {
      res.json({ success: true, state: { isRunning: false, personalizationScore: 0, actionsToday: 0 } });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
