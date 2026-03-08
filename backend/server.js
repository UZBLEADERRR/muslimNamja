require('dotenv').config();
const express = require('express');
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
const orderRoutes = require('./routes/orderRoutes');
const { setBot } = require('./utils/globals');
const setupBot = require('./bot');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/orders', orderRoutes);

// Database connection
const sequelize = require('./config/database');

sequelize.authenticate()
    .then(() => {
        console.log('PostgreSQL connected');
        return sequelize.sync({ alter: true }); // Sync models to database
    })
    .then(() => console.log('Database synced'))
    .catch(err => console.error('PostgreSQL connection error:', err));

const path = require('path');

// Serve static frontend in production
if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_STATIC_URL) {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));

    app.get('/:path*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend/dist', 'index.html'));
    });
} else {
    // Basic route for development
    app.get('/', (req, res) => {
        res.send('Muslim Namja API is running');
    });
}

// Bot Setup
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const bot = setupBot(process.env.TELEGRAM_BOT_TOKEN, FRONTEND_URL);
setBot(bot);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
