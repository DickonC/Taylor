const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());



//MongoDB connection
mongoose.connect('mongodb+srv://dickoncollins:ocwTzVbU3oo8cBRP@taylor.iz6teta.mongodb.net/taylor?retryWrites=true&w=majority')
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.log('Could note connect to MongoDB', err));

// Import and use auth routes
const authRoutes = require('./routes/auth');
const measurementRoutes = require('./routes/measurements');

app.use('/api/auth', authRoutes);
app.use('/api/measurements', measurementRoutes);
app.get('/', (req, res) => res.send('Hello from Taylor API'));

app.listen(3001, () => console.log('Server running on http://localhost:3001'));