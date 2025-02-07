import express, { Request, Response } from 'express';
import supabase from '../supabaseClient';

const router = express.Router();

// Add a new comment
router.post('/', async (req: Request, res: Response): Promise<any> => {
    const { photo_id, user_id, content } = req.body;
    const { data, error } = await supabase
        .from('comments')
        .insert([{ photo_id, user_id, content }]);

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
});

// Get comments for a photo
router.get('/:photo_id', async (req: Request, res: Response): Promise<any> => {
    const { photo_id } = req.params;
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('photo_id', photo_id);

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
});

// Delete a comment
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.status(204).send();
});

export default router;