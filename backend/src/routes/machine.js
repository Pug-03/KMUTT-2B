const express = require('express');
const router = express.Router();
const MachineLog = require('../models/MachineLog');

// In-memory machine state (would be replaced by actual hardware interface)
const machineState = {
  conveyorSpeed: 50,
  isRunning: false,
  startedAt: null,
  bins: {
    damaged: { capacity: 100, current: 0 },
    old: { capacity: 100, current: 0 },
    ripe: { capacity: 200, current: 0 },
    unripe: { capacity: 150, current: 0 },
  },
  connected: false,
  machineId: 'proprietary-001',
};

// GET /api/machine-control - Get current machine status
router.get('/', (_req, res) => {
  const uptime = machineState.isRunning && machineState.startedAt
    ? Date.now() - machineState.startedAt
    : 0;

  res.json({
    ...machineState,
    uptime,
  });
});

// POST /api/machine-control - Send commands to the conveyor belt
router.post('/', async (req, res) => {
  try {
    const { action, value, machineId } = req.body;
    const io = req.app.get('io');

    switch (action) {
      case 'setSpeed':
        machineState.conveyorSpeed = Math.max(0, Math.min(100, Number(value)));
        break;
      case 'start':
        machineState.isRunning = true;
        machineState.startedAt = Date.now();
        break;
      case 'stop':
        machineState.isRunning = false;
        machineState.startedAt = null;
        break;
      case 'connect':
        machineState.connected = true;
        machineState.machineId = machineId || machineState.machineId;
        break;
      case 'disconnect':
        machineState.connected = false;
        break;
      case 'resetBins':
        Object.keys(machineState.bins).forEach((key) => {
          machineState.bins[key].current = 0;
        });
        break;
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    // Log the action
    try {
      await MachineLog.create({
        machineId: machineState.machineId,
        action,
        value,
      });
    } catch {
      // DB might not be connected — non-critical
    }

    const uptime = machineState.isRunning && machineState.startedAt
      ? Date.now() - machineState.startedAt
      : 0;

    const stateUpdate = { ...machineState, uptime };
    io.emit('machine:status', stateUpdate);

    res.json({ success: true, state: stateUpdate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
