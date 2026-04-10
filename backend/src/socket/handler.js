// Defect mapping (same as AI server)
const DEFECT_MAP = {
  rotten: 'spoilage',
  wilted: 'bruise',
  gradeC: 'blackSpot',
};

// Anomaly detection thresholds (percentage of total)
const ANOMALY_THRESHOLDS = {
  rotten: 0.15,   // alert if >15% rotten
  wilted: 0.15,   // alert if >15% wilted
  unripe: 0.25,   // alert if >25% unripe
};
const ANOMALY_MIN_SAMPLES = 10; // need at least N samples before alerting
const ANOMALY_COOLDOWN_MS = 60_000; // don't re-alert within 60s

function setupSocket(io) {
  // Track connected clients
  let clientCount = 0;
  let lastAnomalyAlert = {};

  // Simulated live data interval (for demo purposes)
  let simulationInterval = null;
  const counters = { gradeA: 0, gradeB: 0, gradeC: 0, unripe: 0, rotten: 0, wilted: 0, total: 0 };

  function checkAnomalies() {
    if (counters.total < ANOMALY_MIN_SAMPLES) return;
    const now = Date.now();
    for (const [grade, threshold] of Object.entries(ANOMALY_THRESHOLDS)) {
      const ratio = counters[grade] / counters.total;
      if (ratio > threshold) {
        if (lastAnomalyAlert[grade] && now - lastAnomalyAlert[grade] < ANOMALY_COOLDOWN_MS) continue;
        lastAnomalyAlert[grade] = now;
        io.emit('anomaly:alert', {
          grade,
          ratio: Math.round(ratio * 100),
          threshold: Math.round(threshold * 100),
          count: counters[grade],
          total: counters.total,
          timestamp: now,
        });
      }
    }
  }

  io.on('connection', (socket) => {
    clientCount++;
    console.log(`Client connected (${clientCount} total)`);

    // Send current state on connection
    socket.emit('counters:update', counters);

    // Handle grading result from frontend AI
    socket.on('grading:result', (data) => {
      const { grade, fruitType, confidence, defect, farmOrigin, farmOriginName } = data;
      if (counters[grade] !== undefined) {
        counters[grade]++;
        counters.total++;
      }
      // Broadcast to all clients
      io.emit('counters:update', counters);
      io.emit('grading:live', { grade, fruitType, confidence, defect: defect || null, farmOrigin, farmOriginName, timestamp: Date.now() });
      checkAnomalies();
    });

    // Handle simulation toggle (for demo/testing)
    socket.on('simulation:start', (data) => {
      if (simulationInterval) return;
      const farmOrigin = data?.farmOrigin || null;
      const farmOriginName = data?.farmOriginName || null;
      simulationInterval = setInterval(() => {
        const grades = ['gradeA', 'gradeB', 'gradeC', 'unripe', 'rotten', 'wilted'];
        const weights = [0.35, 0.25, 0.15, 0.10, 0.08, 0.07]; // Grade A most common
        const rand = Math.random();
        let cumulative = 0;
        let selectedGrade = 'gradeA';
        for (let i = 0; i < grades.length; i++) {
          cumulative += weights[i];
          if (rand <= cumulative) {
            selectedGrade = grades[i];
            break;
          }
        }
        counters[selectedGrade]++;
        counters.total++;
        io.emit('counters:update', counters);
        const defect = DEFECT_MAP[selectedGrade] || null;
        io.emit('grading:live', {
          grade: selectedGrade,
          fruitType: 'tomato',
          confidence: 0.7 + Math.random() * 0.3,
          defect,
          timestamp: Date.now(),
          farmOrigin,
          farmOriginName,
        });
        checkAnomalies();
      }, 1500);
    });

    socket.on('simulation:stop', () => {
      if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
      }
    });

    socket.on('counters:reset', () => {
      counters.gradeA = 0;
      counters.gradeB = 0;
      counters.gradeC = 0;
      counters.unripe = 0;
      counters.rotten = 0;
      counters.wilted = 0;
      counters.total = 0;
      io.emit('counters:update', counters);
    });

    socket.on('disconnect', () => {
      clientCount--;
      console.log(`Client disconnected (${clientCount} total)`);
      if (clientCount === 0 && simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
      }
    });
  });
}

module.exports = { setupSocket };
