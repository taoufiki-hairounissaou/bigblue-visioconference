const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/health.routes');
const roomsRoutes = require('./routes/rooms.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api/health', healthRoutes);
app.use('/api/rooms', roomsRoutes);

module.exports = app;
