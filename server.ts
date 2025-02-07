import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Basic route
app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to the PetPortrait API');
});

// Import routes
import userRoutes from './routes/userRoutes';
import petRoutes from './routes/petRoutes';
import photoRoutes from './routes/photoRoutes';
import commentRoutes from './routes/commentRoutes';
import likeRoutes from './routes/likeRoutes';
import soundRoutes from './routes/soundRoutes';

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/sounds', soundRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});