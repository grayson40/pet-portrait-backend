import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import sharp from 'sharp';
import { ImageAnnotatorClient } from '@google-cloud/vision';

dotenv.config();

const router = express.Router();
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Vision API interfaces
interface VisionAPIResult {
    labelAnnotations?: Array<{
        description: string;
        score: number;
    }>;
    webDetection?: {
        webEntities?: Array<{
            description: string;
            score: number;
        }>;
    };
}

// Response interface
interface CaptionResponse {
    caption: string;
    hashtags: string[];
}

// Initialize Vision API client
let visionClient: ImageAnnotatorClient | null = null;

// Function to initialize the Vision client with proper authentication
async function initVisionClient(): Promise<ImageAnnotatorClient> {
    if (visionClient) return visionClient;
    
    try {
        // Check if we have a credentials file path or JSON in .env
        const credentialsEnv = process.env.GOOGLE_CLOUD_VISION_API_KEY || process.env.GOOGLE_VISION_API_KEY;
        
        if (credentialsEnv) {
            console.log('Found credentials in environment variable');
            
            // If we have a path to a JSON file
            if (credentialsEnv.endsWith('.json')) {
                const fullPath = path.isAbsolute(credentialsEnv) 
                    ? credentialsEnv 
                    : path.join(process.cwd(), credentialsEnv);
                
                console.log(`Using credentials file at: ${fullPath}`);
                
                // Check if file exists
                try {
                    await fs.promises.access(fullPath);
                    // Initialize with explicit credentials file
                    visionClient = new ImageAnnotatorClient({
                        keyFilename: fullPath
                    });
                } catch (error) {
                    console.error(`Credentials file not found at ${fullPath}:`, error);
                    throw new Error('Google Cloud credentials file not found');
                }
            } 
            // If it's a Base64 encoded JSON 
            else if (credentialsEnv.includes('ewog')) {
                try {
                    console.log('Using Base64 encoded credentials');
                    // Decode the Base64 string to get the JSON content
                    const credentialsJSON = Buffer.from(credentialsEnv, 'base64').toString();
                    const credentials = JSON.parse(credentialsJSON);
                    
                    // Initialize with the parsed credentials
                    visionClient = new ImageAnnotatorClient({
                        credentials: credentials,
                        projectId: credentials.project_id,
                    });
                } catch (error) {
                    console.error('Error parsing Base64 credentials:', error);
                    throw new Error('Invalid Google Cloud credentials format');
                }
            } 
            // If it's an API key directly
            else {
                console.log('Using API key from environment variable');
                visionClient = new ImageAnnotatorClient({
                    credentials: {
                        client_email: 'dummy@example.com', // These won't be used with API key auth
                        private_key: 'dummy_key',
                    },
                    projectId: 'thumbnail-analyzer',
                });
            }
        } else {
            // Try to use default credentials (for development)
            console.log('Attempting to use default credentials');
            visionClient = new ImageAnnotatorClient();
        }
        
        return visionClient;
    } catch (error) {
        console.error('Error initializing Vision client:', error);
        throw new Error('Failed to initialize Google Cloud Vision client');
    }
}

// Generate caption endpoint
router.post('/generate', async (req: Request, res: Response): Promise<any> => {
    try {
        const { imageBase64 } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ error: 'Image data is required' });
        }

        // Step 1: Process the image with Google Vision API
        const visionResult = await analyzeImageWithVision(imageBase64);
        
        // Step 2: Generate caption and hashtags with Anthropic
        const suggestionResult = await generateCaptionWithAnthropic(visionResult);
        
        res.status(200).json(suggestionResult);
    } catch (error: any) {
        console.error('Error generating caption:', error);
        res.status(500).json({ 
            error: 'Failed to generate caption', 
            details: error.message 
        });
    }
});

// Function to analyze image with Google Vision API
async function analyzeImageWithVision(imageBase64: string): Promise<VisionAPIResult> {
    try {
        // Initialize Vision client
        const client = await initVisionClient();
        
        // Remove the data URL prefix if present
        const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        
        // Convert base64 to buffer
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Compress and resize the image to reduce payload size
        const resizedImageBuffer = await sharp(imageBuffer)
            .resize({ width: 800, height: 800, fit: 'inside' })
            .jpeg({ quality: 80 })
            .toBuffer();
        
        // Using the official Google Cloud Vision client
        const [labelDetectionResult] = await client.labelDetection(resizedImageBuffer);
        const [webDetectionResult] = await client.webDetection(resizedImageBuffer);

        // Convert to our interface format with type checking and defaults
        const labelAnnotations = labelDetectionResult.labelAnnotations?.map(label => ({
            description: label.description || '',
            score: label.score || 0
        })) || [];
        
        const webEntities = webDetectionResult.webDetection?.webEntities?.map(entity => ({
            description: entity.description || '',
            score: entity.score || 0
        })) || [];

        return {
            labelAnnotations,
            webDetection: {
                webEntities
            }
        };

    } catch (error: any) {
        console.error('Vision API error:', error);
        
        // Enhanced error handling
        if (error.code === 3) {
            throw new Error('Invalid image format or image too large');
        } else if (error.code === 4) {
            throw new Error('Vision API request quota exceeded');
        } else if (error.code === 5) {
            throw new Error('Vision API not available');
        } else {
            throw new Error(`Failed to analyze image with Vision API: ${error.message}`);
        }
    }
}

// Function to generate captions with Anthropic
async function generateCaptionWithAnthropic(visionData: VisionAPIResult): Promise<CaptionResponse> {
    try {
        // Extract labels and entities from vision data
        const labels = visionData.labelAnnotations?.map(l => l.description) || [];
        const entities = visionData.webDetection?.webEntities?.map(e => e.description) || [];
        
        // Combine all detected objects and concepts
        const allConcepts = [...labels, ...entities];
        
        // Create a prompt for Anthropic
        const prompt = `
You are an expert social media content creator specializing in pet photography. 
I have a photo of a pet, and Google Vision API detected these elements: ${allConcepts.join(', ')}.

Please create:
1. A creative, engaging Instagram caption (1-2 sentences) for this pet photo
2. A list of 3-5 relevant hashtags that would help this post get discovered

Response must be in JSON format like this:
{
  "caption": "Your creative caption here",
  "hashtags": ["#hashtag1", "#hashtag2", ...]
}
`;

        const response = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 1000,
            system: "You are a creative social media caption generator. You respond only with valid JSON containing caption and hashtags.",
            messages: [
                { role: "user", content: prompt }
            ],
        });

        // Parse the JSON response
        try {
            const content = response.content[0] as Anthropic.TextBlock;
            const result = JSON.parse(content.text);
            
            return {
                caption: result.caption,
                hashtags: result.hashtags
            };
        } catch (parseError) {
            console.error('Error parsing Anthropic response:', parseError);
            // Fallback response if parsing fails
            return {
                caption: "Enjoying precious moments with my adorable pet! ❤️🐾",
                hashtags: ["#petlife", "#cutepet", "#petlover", "#petstagram", "#animallovers"]
            };
        }
    } catch (error) {
        console.error('Anthropic API error:', error);
        throw new Error('Failed to generate caption with Anthropic');
    }
}

export default router;
