import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

async function seedDatabase() {
    try {
        // First create auth users
        const authUsers = await Promise.all([
            supabase.auth.admin.createUser({
                email: 'pet.lover@example.com',
                password: 'password123',
                email_confirm: true
            }),
            supabase.auth.admin.createUser({
                email: 'trainer@example.com',
                password: 'password123',
                email_confirm: true
            }),
            supabase.auth.admin.createUser({
                email: 'catlady@example.com',
                password: 'password123',
                email_confirm: true
            })
        ]);

        // Now create database users with auth IDs
        const { data: users, error: userError } = await supabase.from('users').insert([
            {
                id: authUsers[0].data.user!.id,
                display_name: 'Pet Lover',
                email: 'pet.lover@example.com',
                phone: '+1234567890',
                avatar_url: 'https://example.com/avatars/petlover.jpg',
                subscription_tier: 'premium',
                subscription_valid_until: new Date(2025, 1, 1).toISOString(),
                subscription_auto_renew: true,
                sound_volume: 75,
                push_notifications: true,
                default_filter: 'natural',
                photo_count: 15,
                storage_used: 1500000,
                last_active: new Date().toISOString()
            },
            {
                id: authUsers[1].data.user!.id,
                display_name: 'Dog Trainer',
                email: 'trainer@example.com',
                phone: '+1987654321',
                avatar_url: 'https://example.com/avatars/trainer.jpg',
                subscription_tier: 'premium',
                subscription_valid_until: new Date(2025, 3, 1).toISOString(),
                subscription_auto_renew: true,
                sound_volume: 85,
                push_notifications: true,
                default_filter: 'vibrant',
                photo_count: 25,
                storage_used: 2500000,
                last_active: new Date().toISOString()
            },
            {
                id: authUsers[2].data.user!.id,
                display_name: 'Cat Lady',
                email: 'catlady@example.com',
                phone: '+1122334455',
                avatar_url: 'https://example.com/avatars/catlady.jpg',
                subscription_tier: 'basic',
                subscription_valid_until: null,
                subscription_auto_renew: false,
                sound_volume: 60,
                push_notifications: false,
                default_filter: 'warm',
                photo_count: 8,
                storage_used: 800000,
                last_active: new Date().toISOString()
            }
        ]).select();

        if (userError) throw userError;

        // Pet types
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
                user_id: users![1].id,
                name: 'Cooper',
                type: 'dog'
            },
            {
                user_id: users![2].id,
                name: 'Milo',
                type: 'cat'
            },
            {
                user_id: users![2].id,
                name: 'Oliver',
                type: 'cat'
            }
        ]).select();

        if (petError) throw petError;

        // Photos with metadata
        const { data: photos, error: photoError } = await supabase.from('photos').insert([
            {
                user_id: users![0].id,
                pet_id: pets![0].id,
                image_url: 'https://example.com/photos/max_park.jpg',
                caption: 'Perfect day at the park!',
                likes_count: 12,
                is_perfect_shot: true,
                metadata: {
                    location: 'Central Park',
                    device: 'iPhone 13 Pro',
                    filter_applied: 'natural',
                    size_bytes: 2500000
                }
            },
            {
                user_id: users![0].id,
                pet_id: pets![1].id,
                image_url: 'https://example.com/photos/luna_window.jpg',
                caption: 'Luna watching birds',
                likes_count: 8,
                is_perfect_shot: true,
                metadata: {
                    location: 'Home',
                    device: 'iPhone 13 Pro',
                    filter_applied: 'warm',
                    size_bytes: 1800000
                }
            },
            {
                user_id: users![1].id,
                pet_id: pets![2].id,
                image_url: 'https://example.com/photos/rocky_training.jpg',
                caption: 'Training session success!',
                likes_count: 15,
                is_perfect_shot: true,
                metadata: {
                    location: 'Dog Park',
                    device: 'Pixel 6',
                    filter_applied: 'vibrant',
                    size_bytes: 3000000
                }
            }
        ]).select();

        if (photoError) throw photoError;

        // Comments
        const { error: commentError } = await supabase.from('comments').insert([
            {
                photo_id: photos![0].id,
                user_id: users![1].id,
                content: 'Such a happy pup! What treats do you use to get their attention?'
            },
            {
                photo_id: photos![0].id,
                user_id: users![2].id,
                content: 'Perfect timing on this shot! 📸'
            },
            {
                photo_id: photos![1].id,
                user_id: users![1].id,
                content: 'Bird watching is the best entertainment!'
            },
            {
                photo_id: photos![2].id,
                user_id: users![0].id,
                content: 'Would love to know your training techniques!'
            }
        ]);

        if (commentError) throw commentError;

        // Likes for engagement metrics
        const { error: likeError } = await supabase.from('likes').insert([
            {
                photo_id: photos![0].id,
                user_id: users![1].id
            },
            {
                photo_id: photos![0].id,
                user_id: users![2].id
            },
            {
                photo_id: photos![1].id,
                user_id: users![1].id
            },
            {
                photo_id: photos![2].id,
                user_id: users![0].id
            },
            {
                photo_id: photos![2].id,
                user_id: users![2].id
            }
        ]);

        if (likeError) throw likeError;

        // Comprehensive sound library
        const { error: soundError } = await supabase.from('attention_sounds').insert([
            {
                name: 'Whistle',
                url: 'https://example.com/sounds/whistle.mp3',
                category: 'training',
                is_premium: false
            },
            {
                name: 'Treat',
                url: 'https://example.com/sounds/treat.mp3',
                category: 'food',
                is_premium: false
            },
            {
                name: 'Squeaky',
                url: 'https://example.com/sounds/squeaky.mp3',
                category: 'toys',
                is_premium: false
            },
            {
                name: 'Clicker',
                url: 'https://example.com/sounds/clicker.mp3',
                category: 'training',
                is_premium: true
            },
            {
                name: 'Bird Chirp',
                url: 'https://example.com/sounds/bird_chirp.mp3',
                category: 'cats',
                is_premium: false
            },
            {
                name: 'Bell',
                url: 'https://example.com/sounds/bell.mp3',
                category: 'training',
                is_premium: true
            }
        ]);

        if (soundError) throw soundError;

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
}

seedDatabase();