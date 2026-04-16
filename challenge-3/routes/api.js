const express = require('express');
const router = express.Router();

router.get('/summary/:caseId', (req, res) => {
  const { aiSummaries } = req.app.locals;
  const summary = aiSummaries[req.params.caseId];

  if (!summary) {
    return res.status(404).json({ error: 'Summary not found' });
  }

  res.json({ caseId: req.params.caseId, summary, generated: true });
});

module.exports = router;
