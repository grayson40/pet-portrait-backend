import express, { Request, Response } from 'express';
import supabase from '../supabaseClient';

const router = express.Router();

// Create user method
router.post('/', async (req: Request, res: Response): Promise<any> => {
    const { id, email, display_name, phone, avatar_url } = req.body;
    const { error } = await supabase
        .from('users')
        .insert([{ id, email, display_name, phone, avatar_url }]);

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json('User created successfully');
});

// User signup
router.post('/signup', async (req: Request, res: Response): Promise<any> => {
    const { email, password, display_name } = req.body;
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name } },
    });

    if (error) return res.status(400).json({ error: error.message });
    
    // Check if data is null
    if (!data || !data.user) {
        return res.status(400).json({ error: 'Signup failed' });
    }

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
    
//     // Check if data is null
//     if (!data || !data.user) {
//         return res.status(400).json({ error: 'Signin failed' });
//     }

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
    
    // Check if data is null
    if (!data) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(data);
});

// Update user by ID
router.put('/:id', async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const updates = req.body;

    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json('User updated successfully');
});

// Delete user by ID
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });

    res.status(204).send();
});

export default router; 