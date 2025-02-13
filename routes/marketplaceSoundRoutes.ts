import express, { Request, Response } from 'express';
import supabase from '../supabaseClient';

const router = express.Router();

// Get all marketplace sounds
router.get('/', async (req: Request, res: Response): Promise<any> => {
    try {
        const { data, error } = await supabase
            .from('marketplace_sounds')
            .select('*');

        if (error) throw error;
        return res.status(200).json(data);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Get marketplace sounds by category
router.get('/category/:category', async (req: Request, res: Response): Promise<any> => {
    try {
        const { category } = req.params;
        const { data, error } = await supabase
            .from('marketplace_sounds')
            .select('*')
            .eq('category', category);

        if (error) throw error;
        return res.status(200).json(data);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Add a new marketplace sound
router.post('/', async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, url, category, description, price, created_by } = req.body;
        const { data, error } = await supabase
            .from('marketplace_sounds')
            .insert([{ 
                name, 
                url, 
                category, 
                description, 
                price,
                created_by 
            }])
            .select();

        if (error) throw error;
        return res.status(201).json(data[0]);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Purchase a marketplace sound
router.post('/:id/purchase', async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;

        // Insert purchase record
        const { error: purchaseError } = await supabase
            .from('user_purchased_sounds')
            .insert([{ 
                user_id, 
                sound_id: id 
            }]);

        if (purchaseError) throw purchaseError;

        // Get the purchased sound details
        const { data: sound, error: soundError } = await supabase
            .from('marketplace_sounds')
            .select('*')
            .eq('id', id)
            .single();

        if (soundError) throw soundError;

        return res.status(200).json(sound);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Get user's purchased sounds
router.get('/purchased/:user_id', async (req: Request, res: Response): Promise<any> => {
    try {
        const { user_id } = req.params;
        const { data, error } = await supabase
            .from('user_purchased_sounds')
            .select(`
                marketplace_sounds (
                    id,
                    name,
                    url,
                    category,
                    description
                )
            `)
            .eq('user_id', user_id);

        if (error) throw error;
        return res.status(200).json(data.map(item => item.marketplace_sounds));
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Delete a marketplace sound (creator only)
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('marketplace_sounds')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return res.status(204).send();
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

export default router; 