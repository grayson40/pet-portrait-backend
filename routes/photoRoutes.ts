import { Request, Response, Router } from 'express';
import supabase from '../supabaseClient';

const router = Router();

// Add a new photo
router.post('/', async (req: Request, res: Response): Promise<any> => {
    const { user_id, pet_id, image_url, caption } = req.body;
    const { data, error } = await supabase
        .from('photos')
        .insert([{ user_id, pet_id, image_url, caption }]);

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
});

// Get all photos for a user
router.get('/:user_id', async (req: Request, res: Response): Promise<any> => {
    const { user_id } = req.params;
    const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', user_id);

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
});

// Update a photo
router.put('/:id', async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { caption, pet_id } = req.body;
    const { data, error } = await supabase
        .from('photos')
        .update({ caption, pet_id })
        .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
});

// Delete a photo
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.status(204).send();
});

export default router;