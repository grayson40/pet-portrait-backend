import express, { Request, Response } from 'express';
import supabase from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// List User Sounds
// GET /api/user-sounds
router.get('/', async (req: Request, res: Response): Promise<any> => {
    try {
        // Get user ID from auth header or token
        const userId = req.headers['user-id'] as string;
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const { data, error } = await supabase
            .from('user_sounds')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return res.status(200).json(data);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Upload Sound Recording
// POST /api/user-sounds
router.post('/', async (req: Request, res: Response): Promise<any> => {
    try {
        // Get user ID from auth header or token
        const userId = req.headers['user-id'] as string;
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const { name, category, file, isPremium } = req.body;
        
        // Validate required fields
        if (!name || !category || !file) {
            return res.status(400).json({ error: 'Name, category and file are required' });
        }
        
        // Validate category
        const validCategories = ['attention', 'reward', 'training'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ 
                error: `Category must be one of: ${validCategories.join(', ')}` 
            });
        }
        
        // Generate a unique ID for the sound file
        const soundId = uuidv4();
        const fileName = `${soundId}.m4a`;
        const filePath = `${userId}/${fileName}`;
        
        // Decode the base64 file
        const fileData = Buffer.from(file.replace(/^data:audio\/\w+;base64,/, ''), 'base64');
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase
            .storage
            .from('sounds')
            .upload(filePath, fileData, {
                contentType: 'audio/m4a',
                cacheControl: '3600'
            });

        if (uploadError) throw uploadError;
        
        // Get the public URL for the file
        const { data: { publicUrl } } = supabase
            .storage
            .from('sounds')
            .getPublicUrl(filePath);
        
        // Save the sound metadata to the database
        const { data, error: dbError } = await supabase
            .from('user_sounds')
            .insert([{ 
                id: soundId,
                user_id: userId,
                name, 
                category,
                url: publicUrl,
                created_at: new Date().toISOString(),
                isPublic: true
            }])
            .select();

        if (dbError) throw dbError;
        
        return res.status(201).json({
            id: data![0].id,
            name: data![0].name,
            category: data![0].category,
            url: data![0].url,
            created_at: data![0].created_at,
            isPremium: data![0].is_premium
        });
    } catch (error: any) {
        console.error('Error uploading sound:', error);
        return res.status(400).json({ error: error.message });
    }
});

// Delete User Sound
// DELETE /api/user-sounds/:id
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
    try {
        // Get user ID from auth header or token
        const userId = req.headers['user-id'] as string;
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const { id } = req.params;
        
        // First check if sound exists and belongs to the user
        const { data: soundData, error: fetchError } = await supabase
            .from('user_sounds')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
            
        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Sound not found or access denied' });
            }
            throw fetchError;
        }
        
        // Delete the file from storage
        const filePath = `${userId}/${id}.m4a`;
        const { error: storageError } = await supabase
            .storage
            .from('sounds')
            .remove([filePath]);
            
        if (storageError) {
            console.error('Warning: Could not delete file from storage:', storageError);
            // Continue with database deletion even if storage deletion fails
        }
        
        // Delete the record from the database
        const { error: dbError } = await supabase
            .from('user_sounds')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (dbError) throw dbError;
        
        return res.status(200).json({ message: 'Sound deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting sound:', error);
        return res.status(400).json({ error: error.message });
    }
});

export default router; 