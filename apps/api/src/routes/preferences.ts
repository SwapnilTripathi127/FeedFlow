import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import { Preferences } from '@feedflow/shared';

const router: Router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthenticatedRequest, res) => {
  try {

    const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(req.user!.id);
    if (error) throw error;
    
    const preferences = user.user.user_metadata?.preferences || {
      positiveInterests: [],
      negativeInterests: []
    };
    
    res.json(preferences);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { positiveInterests, negativeInterests } = req.body as Partial<Preferences>;

    const { data: user, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(req.user!.id);
    if (fetchError) throw fetchError;

    const currentPreferences = user.user.user_metadata?.preferences || {};
    
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(req.user!.id, {
      user_metadata: {
        ...user.user.user_metadata,
        preferences: {
          ...currentPreferences,
          positiveInterests: positiveInterests ?? currentPreferences.positiveInterests ?? [],
          negativeInterests: negativeInterests ?? currentPreferences.negativeInterests ?? []
        }
      }
    });
    if (error) throw error;

    res.json(data.user.user_metadata.preferences);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
