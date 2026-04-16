const express = require('express');
const router = express.Router();
const { augmentCase } = require('../lib/cases');

router.get('/', (req, res) => {
  const { search, status, case_type } = req.query;
  const { cases, workflowStates } = req.app.locals;

  // Augment all cases with computed properties
  const allAugmented = cases.map(c => augmentCase(c, workflowStates));

  // Stats computed from the full unfiltered dataset
  const stats = {
    total: allAugmented.length,
    escalated: allAugmented.filter(c => c.status === 'escalated').length,
    awaiting_evidence: allAugmented.filter(c => c.status === 'awaiting_evidence').length,
    closed: allAugmented.filter(c => c.status === 'closed').length
  };

  // Urgent cases: escalated or evidence overdue beyond 56-day threshold
  const urgentCases = allAugmented.filter(c => c.isUrgent);

  // Apply filters
  let filtered = allAugmented;

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(c =>
      c.case_id.toLowerCase().includes(q) ||
      c.applicant.name.toLowerCase().includes(q) ||
      c.applicant.reference.toLowerCase().includes(q)
    );
  }

  if (status) {
    filtered = filtered.filter(c => c.status === status);
  }

  if (case_type) {
    filtered = filtered.filter(c => c.case_type === case_type);
  }

  // Sort: escalated first, then by days since last update descending
  filtered.sort((a, b) => {
    if (a.status === 'escalated' && b.status !== 'escalated') return -1;
    if (a.status !== 'escalated' && b.status === 'escalated') return 1;
    return b.daysSinceUpdate - a.daysSinceUpdate;
  });

  res.render('dashboard.njk', {
    title: 'Your cases — CaseTracker',
    cases: filtered,
    stats,
    urgentCases,
    filters: { search: search || '', status: status || '', case_type: case_type || '' },
    resultCount: filtered.length
  });
});

module.exports = router;
