import express, { Request, Response } from 'express';
import supabase from '../supabaseClient';

const router = express.Router();

// Add a new pet
router.post('/', async (req: Request, res: Response): Promise<any> => {
    const { user_id, name, type } = req.body;
    const { data, error } = await supabase
        .from('pets')
        .insert([{ user_id, name, type }]);

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
});

// Get all pets for a user
router.get('/:user_id', async (req: Request, res: Response): Promise<any> => {
    const { user_id } = req.params;
    const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', user_id);

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
});

// Update a pet
router.put('/:id', async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { name, type } = req.body;
    const { data, error } = await supabase
        .from('pets')
        .update({ name, type })
        .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
});

// Delete a pet
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.status(204).send();
});

export default router;