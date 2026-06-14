import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';

const router: Router = Router();

// GET /instagram/status
// Check if the user is connected to Instagram
router.get('/status', async (req: AuthenticatedRequest, res) => {
  try {
    // For demo purposes, we will mock this based on a global variable or always return disconnected initially
    // Since we don't have a DB schema ready for this, we'll return a mock
    if (req.user!.id === 'demo-user') {
      return res.json({ connected: false, username: null });
    }

    // TODO: Query DB for instagram_accounts table
    res.json({ connected: false, username: null });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /instagram/connect
// Endpoint to receive credentials and start the headless browser connection
router.post('/connect', async (req: AuthenticatedRequest, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // MOCK DELAY: Simulate the headless browser logging in (3 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mock success response
    res.json({ 
      success: true, 
      account: {
        username: username,
        profilePicUrl: 'https://i.pravatar.cc/150?u=' + username,
        connectedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
