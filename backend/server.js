require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const aiRoutes = require('./routes/aiRoutes');
const chatRoutes = require('./routes/chatRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);

// Database connection
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log('MongoDB connected'))
        .catch(err => console.error('MongoDB connection error:', err));
} else {
    console.log('MongoDB URI is not defined. Skipping DB connection.');
}

const path = require('path');

// Serve static frontend in production
if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_STATIC_URL) {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend/dist', 'index.html'));
    });
} else {
    // Basic route for development
    app.get('/', (req, res) => {
        res.send('Muslim Namja API is running');
    });
}

// Bot Setup
const setupBot = require('./bot');
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://google.com'; // Fallback until we start ngrok
setupBot(process.env.TELEGRAM_BOT_TOKEN, FRONTEND_URL);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
