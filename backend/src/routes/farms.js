const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Farm = require('../models/Farm');
const FarmBatch = require('../models/FarmBatch');
const GradingRecord = require('../models/GradingRecord');

/**
 * Farm Management routes with in-memory fallback.
 * When MongoDB is disconnected, uses a process-local store so the
 * feature still works for demos/development without a database.
 */

const isDbConnected = () => mongoose.connection.readyState === 1;

/* ── In-memory fallback store ──────────────────────────────── */
const memStore = {
  farms: [],
  batches: [],
  nextFarmId: 1,
  nextBatchId: 1,
};

const makeId = (prefix, n) => `${prefix}_${Date.now().toString(36)}_${n}`;

/* ── GET /api/farms ────────────────────────────────────────── */
router.get('/', async (_req, res) => {
  try {
    if (isDbConnected()) {
      const farms = await Farm.find().sort({ name: 1 }).lean();
      return res.json(farms);
    }
    const sorted = [...memStore.farms].sort((a, b) => a.name.localeCompare(b.name));
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/farms ───────────────────────────────────────── */
router.post('/', async (req, res) => {
  try {
    const { name, location = '', contact = '', notes = '' } = req.body;
    if (!name) return res.status(400).json({ error: 'Farm name is required' });

    if (isDbConnected()) {
      const farm = await Farm.create({ name, location, contact, notes });
      return res.status(201).json(farm);
    }
    const farm = {
      _id: makeId('farm', memStore.nextFarmId++),
      name,
      location,
      contact,
      notes,
      createdAt: new Date().toISOString(),
    };
    memStore.farms.push(farm);
    res.status(201).json(farm);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ── DELETE /api/farms/:id ─────────────────────────────────── */
router.delete('/:id', async (req, res) => {
  try {
    if (isDbConnected()) {
      await Farm.findByIdAndDelete(req.params.id);
      await FarmBatch.deleteMany({ farmId: req.params.id });
      return res.json({ success: true });
    }
    memStore.farms = memStore.farms.filter((f) => f._id !== req.params.id);
    memStore.batches = memStore.batches.filter((b) => b.farmId !== req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/farms/:id/batches ────────────────────────────── */
router.get('/:id/batches', async (req, res) => {
  try {
    if (isDbConnected()) {
      const batches = await FarmBatch.find({ farmId: req.params.id })
        .sort({ dateFrom: -1 })
        .lean();
      return res.json(batches);
    }
    const batches = memStore.batches
      .filter((b) => b.farmId === req.params.id)
      .sort((a, b) => new Date(b.dateFrom).getTime() - new Date(a.dateFrom).getTime());
    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/farms/:id/batches ───────────────────────────── */
router.post('/:id/batches', async (req, res) => {
  try {
    const { dateFrom, dateTo, notes = '' } = req.body;
    if (!dateFrom || !dateTo) {
      return res.status(400).json({ error: 'dateFrom and dateTo are required' });
    }

    if (isDbConnected()) {
      const batch = await FarmBatch.create({
        farmId: req.params.id,
        dateFrom,
        dateTo,
        notes,
      });
      return res.status(201).json(batch);
    }
    const batch = {
      _id: makeId('batch', memStore.nextBatchId++),
      farmId: req.params.id,
      dateFrom,
      dateTo,
      notes,
      createdAt: new Date().toISOString(),
    };
    memStore.batches.push(batch);
    res.status(201).json(batch);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ── GET /api/farms/stats/:id ──────────────────────────────── */
router.get('/stats/:id', async (req, res) => {
  try {
    if (isDbConnected()) {
      const batches = await FarmBatch.find({ farmId: req.params.id }).lean();
      if (!batches.length) return res.json({ total: 0, grades: {} });

      const dateRanges = batches.map((b) => ({
        $and: [
          { timestamp: { $gte: b.dateFrom } },
          { timestamp: { $lte: b.dateTo } },
        ],
      }));

      const records = await GradingRecord.aggregate([
        { $match: { $or: dateRanges } },
        { $group: { _id: '$grade', count: { $sum: 1 } } },
      ]);

      const grades = {};
      let total = 0;
      records.forEach(({ _id, count }) => {
        grades[_id] = count;
        total += count;
      });

      return res.json({ total, grades });
    }
    // In-memory: we don't track grading records without a DB, so return empty stats
    res.json({ total: 0, grades: {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
