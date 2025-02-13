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

// // Get user's sound collections with their sounds
// router.get('/collections/:id', async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { id: userId } = req.params;
//         if (!userId) {
//             return res.status(401).json({ error: 'Unauthorized' });
//         }

//         // First get all collections
//         const { data: collections, error: collectionsError } = await supabase
//             .from('sound_collections')
//             .select('*')
//             .eq('user_id', userId);

//         if (collectionsError) throw collectionsError;

//         // For each collection, get its sounds
//         const collectionsWithSounds = await Promise.all(collections.map(async (collection) => {
//             const { data: collectionSounds, error: soundsError } = await supabase
//                 .from('collection_sounds')
//                 .select(`
//                     order_index,
//                     custom_sounds (
//                         id,
//                         name,
//                         url,
//                         is_purchased,
//                         price
//                     )
//                 `)
//                 .eq('collection_id', collection.id)
//                 .order('order_index');

//             if (soundsError) throw soundsError;

//             // Format the sounds array
//             const sounds = collectionSounds.map(cs => ({
//                 ...cs.custom_sounds,
//                 order_index: cs.order_index
//             }));

//             return {
//                 ...collection,
//                 sounds: sounds
//             };
//         }));

//         return res.status(200).json({ collections: collectionsWithSounds });
//     } catch (error) {
//         console.error('Error fetching collections:', error);
//         return res.status(500).json({ error: 'Failed to fetch sound collections' });
//     }
// });

// Activate a sound collection
// router.post('/collections/:id/activate', async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { id } = req.params;
//         const userId = req.user?.id;

//         if (!userId) {
//             return res.status(401).json({ error: 'Unauthorized' });
//         }

//         // Start a transaction to update collection statuses
//         const { error } = await supabase
//             .rpc('activate_sound_collection', {
//                 p_collection_id: id,
//                 p_user_id: userId
//             });

//         if (error) throw error;

//         return res.status(200).json({ success: true });
//     } catch (error) {
//         console.error('Error activating collection:', error);
//         return res.status(500).json({ error: 'Failed to activate sound collection' });
//     }
// });

export default router;