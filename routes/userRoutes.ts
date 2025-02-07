import express, { Request, Response } from 'express';
import supabase from '../supabaseClient';

const router = express.Router();

// User signup
router.post('/signup', async (req: Request, res: Response): Promise<any> => {
    const { email, password, display_name } = req.body;
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name } },
    });

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ user: data.user });
});

// TODO: Handle this route
// User signin
// router.post('/signin', async (req: Request, res: Response): Promise<any> => {
//     const { email, password } = req.body;
//     const { data, error } = await supabase.auth.signIn({
//         email,
//         password,
//     });

//     if (error) return res.status(400).json({ error: error.message });
//     res.status(200).json({ user: data.user, session: data.session });
// });

// Get user profile
router.get('/:id', async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
});

export default router; 