function setupSocket(io) {
  // Track connected clients
  let clientCount = 0;

  // Simulated live data interval (for demo purposes)
  let simulationInterval = null;
  const counters = { damaged: 0, old: 0, ripe: 0, unripe: 0, total: 0 };

  io.on('connection', (socket) => {
    clientCount++;
    console.log(`Client connected (${clientCount} total)`);

    // Send current state on connection
    socket.emit('counters:update', counters);

    // Handle grading result from frontend AI
    socket.on('grading:result', (data) => {
      const { grade, fruitType, confidence } = data;
      if (counters[grade] !== undefined) {
        counters[grade]++;
        counters.total++;
      }
      // Broadcast to all clients
      io.emit('counters:update', counters);
      io.emit('grading:live', { grade, fruitType, confidence, timestamp: Date.now() });
    });

    // Handle simulation toggle (for demo/testing)
    socket.on('simulation:start', () => {
      if (simulationInterval) return;
      simulationInterval = setInterval(() => {
        const grades = ['damaged', 'old', 'ripe', 'unripe'];
        const weights = [0.1, 0.15, 0.5, 0.25]; // ripe is most common
        const rand = Math.random();
        let cumulative = 0;
        let selectedGrade = 'ripe';
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
        io.emit('grading:live', {
          grade: selectedGrade,
          fruitType: 'apple',
          confidence: 0.7 + Math.random() * 0.3,
          timestamp: Date.now(),
        });
      }, 1500);
    });

    socket.on('simulation:stop', () => {
      if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
      }
    });

    socket.on('counters:reset', () => {
      counters.damaged = 0;
      counters.old = 0;
      counters.ripe = 0;
      counters.unripe = 0;
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
