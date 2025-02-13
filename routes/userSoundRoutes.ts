import express, { Request, Response } from 'express';
import supabase from '../supabaseClient';

const router = express.Router();

// Get all user sounds for a specific user
router.get('/:user_id', async (req: Request, res: Response): Promise<any> => {
    try {
        const { user_id } = req.params;
        const { data, error } = await supabase
            .from('user_sounds')
            .select('*')
            .eq('user_id', user_id);

        if (error) throw error;
        return res.status(200).json(data);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Get public user sounds
router.get('/public', async (req: Request, res: Response): Promise<any> => {
    try {
        const { data, error } = await supabase
            .from('user_sounds')
            .select('*')
            .eq('is_public', true);

        if (error) throw error;
        return res.status(200).json(data);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Record/Upload a new user sound
router.post('/', async (req: Request, res: Response): Promise<any> => {
    try {
        const { user_id, name, url, category, description, is_public } = req.body;
        const { data, error } = await supabase
            .from('user_sounds')
            .insert([{ 
                user_id,
                name, 
                url, 
                category, 
                description,
                is_public: is_public || false
            }])
            .select();

        if (error) throw error;
        return res.status(201).json(data[0]);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Update a user sound
router.put('/:id', async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { name, category, description, is_public } = req.body;
        const { data, error } = await supabase
            .from('user_sounds')
            .update({ 
                name, 
                category, 
                description,
                is_public
            })
            .eq('id', id)
            .select();

        if (error) throw error;
        return res.status(200).json(data[0]);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Delete a user sound
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('user_sounds')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return res.status(204).send();
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Toggle sound publicity
router.patch('/:id/toggle-public', async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { is_public } = req.body;
        
        const { data, error } = await supabase
            .from('user_sounds')
            .update({ is_public })
            .eq('id', id)
            .select();

        if (error) throw error;
        return res.status(200).json(data[0]);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

export default router; 