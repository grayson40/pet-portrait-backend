import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { webhookHandler } from './routes/subscriptionRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Move this BEFORE other middleware
app.post('/api/subscription/webhook', 
    express.raw({ type: 'application/json' }), 
    webhookHandler
);

// Then add the other middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Basic route
app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to the PetPortrait API');
});

// Import routes
import userRoutes from './routes/userRoutes';
import petRoutes from './routes/petRoutes';
import photoRoutes from './routes/photoRoutes';
import defaultSoundRoutes from './routes/defaultSoundRoutes';
import marketplaceSoundRoutes from './routes/marketplaceSoundRoutes';
import userSoundRoutes from './routes/userSoundRoutes';
import soundCollectionRoutes from './routes/soundCollectionRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import captionRoutes from './routes/captionRoutes';

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/photos', photoRoutes);

// Sound-related routes
app.use('/api/sounds/default', defaultSoundRoutes);
app.use('/api/sounds/marketplace', marketplaceSoundRoutes);
app.use('/api/sounds/user', userSoundRoutes);
app.use('/api/sounds/collections', soundCollectionRoutes);

// Subscription routes
app.use('/api/subscription', subscriptionRoutes);

// Caption routes
app.use('/api/captions', captionRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: Function) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;