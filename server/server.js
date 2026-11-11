import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '2mb' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'FixFlow API' }));
app.use('/api/auth', authRoutes); app.use('/api/tickets', ticketRoutes); app.use('/api/admin', adminRoutes); app.use('/api/notifications', notificationRoutes); app.use('/api/assets', assetRoutes);
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 11000) return res.status(409).json({ message: 'A record with this value already exists' });
  if (err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE')
    return res.status(413).json({ message: 'Images must be no larger than 5 MB' });
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});
const PORT = process.env.PORT || 5000;
connectDB().then(() => app.listen(PORT, () => console.log(`FixFlow API running on port ${PORT}`))).catch(err => { console.error('Database connection failed:', err.message); process.exit(1); });
