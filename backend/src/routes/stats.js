const express = require('express');
const router = express.Router();
const GradingRecord = require('../models/GradingRecord');

// GET /api/stats - Fetch total counts and grade history
router.get('/', async (req, res) => {
  try {
    const { fruitType, from, to, limit = 100 } = req.query;

    const filter = {};
    if (fruitType) filter.fruitType = fruitType;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const [totalCount, gradeCounts, recentRecords] = await Promise.all([
      GradingRecord.countDocuments(filter),
      GradingRecord.aggregate([
        { $match: filter },
        { $group: { _id: '$grade', count: { $sum: 1 } } },
      ]),
      GradingRecord.find(filter)
        .sort({ timestamp: -1 })
        .limit(Number(limit))
        .lean(),
    ]);

    const grades = { gradeA: 0, gradeB: 0, gradeC: 0, unripe: 0, rotten: 0, wilted: 0 };
    gradeCounts.forEach(({ _id, count }) => {
      grades[_id] = count;
    });

    res.json({
      total: totalCount,
      grades,
      history: recentRecords,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stats - Record a new grading result
router.post('/', async (req, res) => {
  try {
    const { fruitType, grade, confidence, modelUsed, farmOrigin, defect } = req.body;
    const record = await GradingRecord.create({ fruitType, grade, confidence, modelUsed, farmOrigin, defect: defect || null });

    const io = req.app.get('io');
    io.emit('grading:new', record);

    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
