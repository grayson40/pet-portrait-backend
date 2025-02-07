import express, { Request, Response } from 'express';
import supabase from '../supabaseClient';

const router = express.Router();

// Like a photo
router.post('/:photo_id', async (req: Request, res: Response): Promise<any> => {
    const { user_id } = req.body;
    const { photo_id } = req.params;
    const { data, error } = await supabase
        .from('likes')
        .insert([{ photo_id, user_id }]);

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
});

// Get likes for a photo
router.get('/:photo_id', async (req: Request, res: Response): Promise<any> => {
    const { photo_id } = req.params;
    const { data, error } = await supabase
        .from('likes')
        .select('*')
        .eq('photo_id', photo_id);

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
});

// Delete a like
router.delete('/:photo_id/:user_id', async (req: Request, res: Response): Promise<any> => {
    const { photo_id, user_id } = req.params;
    const { error } = await supabase
        .from('likes')
        .delete()
        .eq('photo_id', photo_id)
        .eq('user_id', user_id);

    if (error) return res.status(400).json({ error: error.message });
    res.status(204).send();
});

export default router;