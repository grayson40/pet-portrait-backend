import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

async function seedDatabase() {
    try {
        // Create auth users first
        const authUsers = await Promise.all([
            supabase.auth.admin.createUser({
                email: 'john@example.com',
                password: 'password123',
                email_confirm: true
            }),
            supabase.auth.admin.createUser({
                email: 'jane@example.com',
                password: 'password123',
                email_confirm: true
            }),
            supabase.auth.admin.createUser({
                email: 'bob@example.com',
                password: 'password123',
                email_confirm: true
            })
        ]);

        // Check for auth user creation errors
        authUsers.forEach(({ data, error }) => {
            if (error) throw error;
        });

        // Create database users with auth user IDs
        const { data: users, error: userError } = await supabase.from('users').insert([
            {
                id: authUsers[0].data.user!.id,
                display_name: 'John Doe',
                email: 'john@example.com',
                subscription_tier: 'basic',
                subscription_valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                sound_volume: 80,
            },
            {
                id: authUsers[1].data.user!.id,
                display_name: 'Jane Smith',
                email: 'jane@example.com',
                subscription_tier: 'premium',
                subscription_valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
                sound_volume: 75,
            },
            {
                id: authUsers[2].data.user!.id,
                display_name: 'Bob Wilson',
                email: 'bob@example.com',
                subscription_tier: 'basic',
                sound_volume: 85,
            }
        ]).select();

        if (userError) throw userError;

        // Sample pets
        const { data: pets, error: petError } = await supabase.from('pets').insert([
            {
                user_id: users![0].id,
                name: 'Max',
                type: 'dog'
            },
            {
                user_id: users![0].id,
                name: 'Luna',
                type: 'cat'
            },
            {
                user_id: users![1].id,
                name: 'Rocky',
                type: 'dog'
            },
            {
                user_id: users![2].id,
                name: 'Bella',
                type: 'cat'
            }
        ]).select();

        if (petError) throw petError;

        // Sample photos - Using Pexels free stock photos
        const { data: photos, error: photoError } = await supabase.from('photos').insert([
            {
                user_id: users![0].id,
                pet_id: pets![0].id,
                image_url: 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg',
                generated_caption: 'Happy dog playing in the park',
                generated_hashtags: ['#doglife', '#happydog', '#petportrait'],
                is_perfect_shot: true
            },
            {
                user_id: users![1].id,
                pet_id: pets![2].id,
                image_url: 'https://images.pexels.com/photos/1741235/pexels-photo-1741235.jpeg',
                generated_caption: 'Sleepy dog on the couch',
                generated_hashtags: ['#sleepydog', '#doglife', '#cozydog'],
                is_perfect_shot: false
            }
        ]).select();

        if (photoError) throw photoError;

        // Sample default sounds - Using FreeSound.org public domain sounds
        const { error: defaultSoundError } = await supabase.from('default_sounds').insert([
            {
                name: 'Classic Whistle',
                url: 'https://freesound.org/data/previews/584/584096_7614679-lq.mp3',
                category: 'attention',
                description: 'A classic whistle sound'
            },
            {
                name: 'Treat Bag',
                url: 'https://freesound.org/data/previews/527/527847_6142149-lq.mp3',
                category: 'food',
                description: 'Sound of treats in a bag'
            },
            {
                name: 'Dog Clicker',
                url: 'https://freesound.org/data/previews/450/450615_9402857-lq.mp3',
                category: 'training',
                description: 'Standard training clicker sound'
            }
        ]);

        if (defaultSoundError) throw defaultSoundError;

        // Sample marketplace sounds
        const { data: marketplaceSounds, error: marketplaceSoundError } = await supabase
            .from('marketplace_sounds')
            .insert([
                {
                    name: 'Premium Squeaky Toy',
                    url: 'https://freesound.org/data/previews/436/436462_4162687-lq.mp3',
                    category: 'toys',
                    description: 'High-quality squeaky toy sound',
                    price: 0.99,
                    created_by: users![1].id
                },
                {
                    name: 'Cat Bell Deluxe',
                    url: 'https://freesound.org/data/previews/277/277021_4486188-lq.mp3',
                    category: 'cats',
                    description: 'Premium cat bell sound',
                    price: 1.99,
                    created_by: users![0].id
                }
            ]).select();

        if (marketplaceSoundError) throw marketplaceSoundError;

        // Sample user sounds
        const { error: userSoundError } = await supabase.from('user_sounds').insert([
            {
                user_id: users![0].id,
                name: 'My Dog Bark',
                url: 'https://freesound.org/data/previews/413/413047_5121236-lq.mp3',
                category: 'dogs',
                description: 'Recording of my dog',
                is_public: true
            }
        ]);

        if (userSoundError) throw userSoundError;

        // Sample sound collections
        const { data: collections, error: collectionError } = await supabase
            .from('sound_collections')
            .insert([
                {
                    user_id: users![0].id,
                    name: 'My Dog Sounds',
                    is_active: true
                },
                {
                    user_id: users![1].id,
                    name: 'Cat Collection',
                    is_active: false
                }
            ]).select();

        if (collectionError) throw collectionError;

        // Sample collection sounds
        const { error: collectionSoundError } = await supabase.from('collection_sounds').insert([
            {
                collection_id: collections![0].id,
                sound_id: marketplaceSounds![0].id,
                sound_type: 'marketplace',
                order_index: 1
            }
        ]);

        if (collectionSoundError) throw collectionSoundError;

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
}

seedDatabase();