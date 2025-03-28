import express, { Request, Response } from 'express';
import supabase from '../supabaseClient';

interface Sound {
    id: string;
    name: string;
    url: string;
    category: string;
    description?: string;
    created_at: string;
}

interface CollectionSound {
    id: string;
    sound_id: string;
    sound_type: 'default' | 'marketplace' | 'user';
    order_index: number;
}

interface Collection {
    id: string;
    user_id: string;
    name: string;
    is_active: boolean;
    created_at: string;
    collection_sounds: CollectionSound[];
}

interface SoundInput {
    sound_id: string;
    sound_type: 'default' | 'marketplace' | 'user';
    order_index: number;
}

const router = express.Router();

// Get all collections for a user with their sounds
router.get('/:user_id', async (req: Request, res: Response): Promise<any> => {
    try {
        const { user_id } = req.params;
        const { data: collections, error: collectionsError } = await supabase
            .from('sound_collections')
            .select(`
                *,
                collection_sounds!inner (
                    sound_id,
                    sound_type,
                    order_index
                )
            `)
            .eq('user_id', user_id)
            .order('created_at');

        if (collectionsError) throw collectionsError;

        // Fetch sound details separately
        const collectionsWithSounds = await Promise.all(
            (collections as Collection[]).map(async (collection) => {
                const soundPromises = collection.collection_sounds.map(async (cs: CollectionSound) => {
                    const { data: sound } = await supabase
                        .from(cs.sound_type === 'default' ? 'default_sounds' : 'marketplace_sounds')
                        .select('*')
                        .eq('id', cs.sound_id)
                        .single();
                    
                    return {
                        ...cs,
                        sound: sound as Sound
                    };
                });
                
                const sounds = await Promise.all(soundPromises);
                return {
                    ...collection,
                    collection_sounds: sounds
                };
            })
        );

        res.status(200).json(collectionsWithSounds);
    } catch (error: any) {
        console.error('Error fetching collections:', error);
        res.status(400).json({ error: error.message });
    }
});

// Create a new collection with optional sounds
router.post('/', async (req: Request, res: Response): Promise<any> => {
    try {
        const { user_id, name, is_active = false, sounds = [] } = req.body;

        // Start a transaction
        const { data: collection, error: collectionError } = await supabase
            .from('sound_collections')
            .insert([{ 
                user_id, 
                name,
                is_active 
            }])
            .select()
            .single();

        if (collectionError) throw collectionError;

        // If sounds were provided, add them to the collection
        if (sounds.length > 0) {
            const { error: soundsError } = await supabase
                .from('collection_sounds')
                .insert(
                    sounds.map((sound: SoundInput) => ({
                        collection_id: collection.id,
                        sound_id: sound.sound_id,
                        sound_type: sound.sound_type,
                        order_index: sound.order_index
                    }))
                );

            if (soundsError) throw soundsError;
        }

        // Return the collection with its sounds
        const { data: fullCollection, error: fetchError } = await supabase
            .from('sound_collections')
            .select(`
                *,
                collection_sounds!inner (
                    sound_id,
                    sound_type,
                    order_index
                )
            `)
            .eq('id', collection.id)
            .single();

        if (fetchError) throw fetchError;

        // Fetch sound details separately
        const collectionWithSounds = {
            ...fullCollection,
            collection_sounds: await Promise.all(
                fullCollection.collection_sounds.map(async (cs: CollectionSound) => {
                    const { data: sound } = await supabase
                        .from(cs.sound_type === 'default' ? 'default_sounds' : 'marketplace_sounds')
                        .select('*')
                        .eq('id', cs.sound_id)
                        .single();
                    
                    return {
                        ...cs,
                        sound: sound as Sound
                    };
                })
            )
        };

        res.status(201).json(collectionWithSounds);
    } catch (error: any) {
        console.error('Error creating collection:', error);
        res.status(400).json({ error: error.message });
    }
});

// Add sounds to collection
router.post('/:collection_id/sounds', async (req: Request, res: Response): Promise<any> => {
    try {
        const { collection_id } = req.params;
        const { sounds } = req.body;

        if (!Array.isArray(sounds)) {
            throw new Error('Expected an array of sounds');
        }

        const { data, error } = await supabase
            .from('collection_sounds')
            .insert(sounds.map((sound: SoundInput) => ({
                collection_id,
                sound_id: sound.sound_id,
                sound_type: sound.sound_type,
                order_index: sound.order_index
            })))
            .select();

        if (error) throw error;
        return res.status(201).json(data);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Get sounds from collection
router.get('/:collection_id/sounds', async (req: Request, res: Response): Promise<any> => {
    try {
        const { collection_id } = req.params;

        // First get the collection sounds
        const { data: collectionSounds, error } = await supabase
            .from('collection_sounds')
            .select('sound_id, sound_type, order_index')
            .eq('collection_id', collection_id)
            .order('order_index');

        if (error) throw error;
        if (!collectionSounds) return res.status(404).json({ error: 'No sounds found' });

        // Then fetch the actual sound details based on sound_type
        const soundsWithDetails = await Promise.all(
            collectionSounds.map(async (cs) => {
                let soundData;
                switch (cs.sound_type) {
                    case 'default':
                        const { data: defaultSound } = await supabase
                            .from('default_sounds')
                            .select('*')
                            .eq('id', cs.sound_id)
                            .single();
                        soundData = defaultSound;
                        break;
                    case 'marketplace':
                        const { data: marketplaceSound } = await supabase
                            .from('marketplace_sounds')
                            .select('*')
                            .eq('id', cs.sound_id)
                            .single();
                        soundData = marketplaceSound;
                        break;
                    case 'user':
                        const { data: userSound } = await supabase
                            .from('user_sounds')
                            .select('*')
                            .eq('id', cs.sound_id)
                            .single();
                        soundData = userSound;
                        break;
                }
                
                return {
                    ...cs,
                    sound: soundData
                };
            })
        );

        return res.status(200).json(soundsWithDetails);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Remove sound from collection
router.delete('/:collection_id/sounds/:sound_id', async (req: Request, res: Response): Promise<any> => {
    try {
        const { collection_id, sound_id } = req.params;
        const { error } = await supabase
            .from('collection_sounds')
            .delete()
            .eq('collection_id', collection_id)
            .eq('sound_id', sound_id);

        if (error) throw error;
        return res.status(204).send();
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Update collection name
router.put('/:id', async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        
        const { data, error } = await supabase
            .from('sound_collections')
            .update({ name })
            .eq('id', id)
            .select();

        if (error) throw error;
        return res.status(200).json(data[0]);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Set active collection
router.post('/:id/activate', async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;

        // First deactivate all collections for this user
        const { error: deactivateError } = await supabase
            .from('sound_collections')
            .update({ is_active: false })
            .eq('user_id', user_id);

        if (deactivateError) throw deactivateError;

        // Then activate the selected collection
        const { data, error: activateError } = await supabase
            .from('sound_collections')
            .update({ is_active: true })
            .eq('id', id)
            .select();

        if (activateError) throw activateError;

        res.status(200).json(data[0]);
    } catch (error: any) {
        console.error('Error activating collection:', error);
        res.status(400).json({ error: error.message });
    }
});

// Delete collection
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('sound_collections')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return res.status(204).send();
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

export default router; 