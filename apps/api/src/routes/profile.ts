import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';

const router: Router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user!.id === 'demo-user') {
      return res.json({ profile: { id: 'demo-user', email: 'demo@feedflow.local' } });
    }

    const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(req.user!.id);
    if (error) throw error;
    res.json({ profile: user.user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/', async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user!.id === 'demo-user') {
      return res.json({ profile: { id: 'demo-user', email: 'demo@feedflow.local', user_metadata: req.body } });
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(req.user!.id, {
      user_metadata: req.body
    });
    if (error) throw error;
    res.json({ profile: data.user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
