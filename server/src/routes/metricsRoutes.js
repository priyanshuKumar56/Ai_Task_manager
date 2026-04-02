const express = require('express');
const router = express.Router();

// Prometheus-style metrics endpoint
router.get('/', (req, res) => {
  const metrics = [
    `# HELP process_uptime_seconds Process uptime in seconds`,
    `# TYPE process_uptime_seconds gauge`,
    `process_uptime_seconds ${process.uptime()}`,
    `# HELP nodejs_heap_size_bytes Node.js heap size`,
    `# TYPE nodejs_heap_size_bytes gauge`,
    `nodejs_heap_size_bytes ${process.memoryUsage().heapUsed}`,
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  return res.send(metrics);
});

module.exports = router;
