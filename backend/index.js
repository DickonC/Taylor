const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

app.use(cors());
app.use(express.json());

//MongoDB connection
mongoose.connect('mongodb+srv://dickoncollins:ocwTzVbU3oo8cBRP@taylor.iz6teta.mongodb.net/taylor?retryWrites=true&w=majority')
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.log('Could note connect to MongoDB', err));

// Import routes and middleware
const authRoutes = require('./routes/auth');
const measurementRoutes = require('./routes/measurements');
const auth = require('./middleware/auth');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/measurements', measurementRoutes);

app.get('/', (req, res) => res.send('Hello from Taylor API'));

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});