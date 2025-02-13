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

// Define interfaces
interface Pet {
    name: string;
    type: string;
}

interface UserProfile {
    display_name: string;
    pets: Pet[];
    sound_volume: number;
    subscription_tier: 'basic' | 'premium';
}

// Get user profile
router.get('/:id', async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;

    try {
        // Get user data
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('display_name, sound_volume, subscription_tier')
            .eq('id', id)
            .single();

        if (userError) throw userError;

        // Get user's pets
        const { data: pets, error: petsError } = await supabase
            .from('pets')
            .select('name, type, id')
            .eq('user_id', id);

        if (petsError) throw petsError;

        const userProfile: UserProfile = {
            display_name: user?.display_name,
            pets: pets || [],
            sound_volume: user?.sound_volume,
            subscription_tier: user?.subscription_tier
        };

        res.status(200).json(userProfile);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
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

// Get user stats
router.get('/:id/stats', async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;

    try {
        // Get total photos
        const { data: photos, error: photosError } = await supabase
            .from('photos')
            .select('id, is_perfect_shot, likes_count, created_at')
            .eq('user_id', id);

        if (photosError) throw photosError;

        // Calculate stats
        const now = new Date();
        const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));

        const stats = {
            totalPhotos: photos?.length || 0,
            perfectShots: photos?.filter(photo => photo.is_perfect_shot).length || 0,
            totalLikes: photos?.reduce((sum, photo) => sum + (photo.likes_count || 0), 0) || 0,
            photosThisWeek: photos?.filter(photo =>
                new Date(photo.created_at) > oneWeekAgo
            ).length || 0
        };

        res.status(200).json(stats);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router; 