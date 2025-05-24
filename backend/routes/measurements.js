const express = require('express');
const router = express.Router();
const Measurement = require('../models/Measurement');
const auth = require('../middleware/auth');

// Get measurements for a user
router.get('/get', auth, async (req, res) => {
  try {
    const measurements = await Measurement.findOne({
      userId: req.userId,
      garmentType: req.query.garmentType
    }).sort({ createdAt: -1 }); // Get the most recent measurements

    if (!measurements) {
      return res.json({ measurements: null });
    }

    res.json({ measurements });
  } catch (error) {
    console.error('Error fetching measurements:', error);
    res.status(500).json({ message: 'Error fetching measurements' });
  }
});

router.post('/save', auth, async (req, res) => {
  try {
    const { garmentType, measurements } = req.body;

    // First, try to find an existing measurement
    const existingMeasurement = await Measurement.findOne({
      userId: req.userId,
      garmentType: garmentType
    });

    if (existingMeasurement) {
      // Update existing measurement
      existingMeasurement.measurements = measurements;
      existingMeasurement.unit = 'cm';
      existingMeasurement.createdAt = new Date();
      await existingMeasurement.save();
    } else {
      // Create new measurement
      const measurement = new Measurement({
        userId: req.userId,
        garmentType,
        measurements,
        unit: 'cm',
        createdAt: new Date()
      });
      await measurement.save();
    }

    res.status(200).json({ message: 'Measurements saved successfully' });
  } catch (error) {
    console.error('Error saving measurements:', error);
    res.status(500).json({ message: 'Error saving measurements' });
  }
});

module.exports = router;