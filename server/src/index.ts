import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import recreationRoutes from './routes/recreations';
import stemRoutes from './routes/stems';
import ratingRoutes from './routes/ratings';
import requestRoutes from './routes/requests'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/recreations', recreationRoutes);
app.use('/api/stems', stemRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/requests', requestRoutes);

app.listen(PORT, () => {
  console.log(`BeatLog server running on port ${PORT}`);
});
