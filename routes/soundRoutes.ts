import express, { Request, Response } from 'express';
import supabase from '../supabaseClient';

const router = express.Router();

// Get all attention sounds
router.get('/', async (req: Request, res: Response): Promise<any> => {
    const { data, error } = await supabase
        .from('attention_sounds')
        .select('*');

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
});

// Add a new attention sound
router.post('/', async (req: Request, res: Response): Promise<any> => {
    const { name, url, category, is_premium } = req.body;
    const { data, error } = await supabase
        .from('attention_sounds')
        .insert([{ name, url, category, is_premium }]);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
});

// Delete an attention sound
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { error } = await supabase
        .from('attention_sounds')
        .delete()
        .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(204).send();
});

export default router;