import dotenv from 'dotenv';
dotenv.config();
import http from 'http';
import cookieParser from 'cookie-parser';

import express from 'express';
import { connectDB } from './db/database.js';
import cors from 'cors';
import userRoutes from './routes/user.routes.js';
import captainRoutes from './routes/captain.routes.js';
import mapRoutes from './routes/maps.routes.js';
import rideRoutes from './routes/ride.routes.js';
import { initializeSocket } from './socket.js';

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',                  //'http://localhost:5173'
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/users', userRoutes);
app.use('/captains', captainRoutes);
app.use('/maps', mapRoutes);
app.use('/rides', rideRoutes);
connectDB();
app.get('/', (req, res) => {
  res.send('Server is running');
});
const server = http.createServer(app);

try {
    const io = initializeSocket(server);
    app.set('io', io);
    console.log('Socket.io initialized');
} catch (error) {
    console.error('Failed to initialize socket.io:', error);
}

const PORT = process.env.PORT || 4000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
