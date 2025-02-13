import express, { Request, Response } from 'express';
import supabase from '../supabaseClient';

const router = express.Router();

// Get all default sounds
router.get('/', async (req: Request, res: Response): Promise<any> => {
    try {
        const { data, error } = await supabase
            .from('default_sounds')
            .select('*')
            .order('category', { ascending: true })
            .order('name', { ascending: true });

        if (error) throw error;
        return res.status(200).json(data);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Get default sounds by category
router.get('/category/:category', async (req: Request, res: Response): Promise<any> => {
    try {
        const { category } = req.params;
        const { data, error } = await supabase
            .from('default_sounds')
            .select('*')
            .eq('category', category);

        if (error) throw error;
        return res.status(200).json(data);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Add a new default sound (admin only)
router.post('/', async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, url, category, description } = req.body;
        const { data, error } = await supabase
            .from('default_sounds')
            .insert([{ name, url, category, description }])
            .select();

        if (error) throw error;
        return res.status(201).json(data[0]);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Delete a default sound (admin only)
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('default_sounds')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return res.status(204).send();
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

export default router; 