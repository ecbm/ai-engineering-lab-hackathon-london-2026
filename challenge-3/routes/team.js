const express = require('express');
const router = express.Router();
const { augmentCase } = require('../lib/cases');

router.get('/', (req, res) => {
  const { cases, workflowStates } = req.app.locals;
  const allAugmented = cases.map(c => augmentCase(c, workflowStates));

  const stats = {
    total: allAugmented.length,
    escalated: allAugmented.filter(c => c.status === 'escalated').length,
    overdue: allAugmented.filter(c => c.escalationStatus && c.escalationStatus.status === 'overdue').length,
    pending_decision: allAugmented.filter(c => c.status === 'pending_decision').length,
    closed: allAugmented.filter(c => c.status === 'closed').length
  };

  const statusBreakdown = [
    { label: 'Awaiting evidence', count: allAugmented.filter(c => c.status === 'awaiting_evidence').length, cls: 'orange' },
    { label: 'Under review', count: allAugmented.filter(c => c.status === 'under_review').length, cls: 'blue' },
    { label: 'Pending decision', count: allAugmented.filter(c => c.status === 'pending_decision').length, cls: 'purple' },
    { label: 'Escalated', count: allAugmented.filter(c => c.status === 'escalated').length, cls: 'red' },
    { label: 'Closed', count: allAugmented.filter(c => c.status === 'closed').length, cls: 'grey' }
  ];
  const maxCount = Math.max(...statusBreakdown.map(s => s.count), 1);
  statusBreakdown.forEach(s => { s.pct = Math.round((s.count / stats.total) * 100); });

  // Team capacity
  const teams = {};
  allAugmented.forEach(c => {
    const team = c.assigned_to || 'unassigned';
    if (!teams[team]) teams[team] = { cases: [], statusCounts: {} };
    teams[team].cases.push(c);
    teams[team].statusCounts[c.status] = (teams[team].statusCounts[c.status] || 0) + 1;
  });

  const STATUS_LABELS = {
    awaiting_evidence: 'awaiting evidence', under_review: 'under review',
    pending_decision: 'pending decision', escalated: 'escalated', closed: 'closed',
    case_created: 'created'
  };

  const teamCapacity = Object.entries(teams).map(([name, data]) => {
    const breakdown = Object.entries(data.statusCounts)
      .map(([s, n]) => `${n} ${STATUS_LABELS[s] || s}`)
      .join(', ');
    const hasEscalated = data.cases.some(c => c.status === 'escalated');
    return { name, count: data.cases.length, breakdown, pressure: hasEscalated };
  }).sort((a, b) => a.name.localeCompare(b.name));

  // Deadline risks
  const deadlineRisks = allAugmented
    .filter(c => c.escalationStatus && c.escalationStatus.status !== 'ok')
    .map(c => {
      let riskLevel, tagClass, tagLabel;
      if (c.escalationStatus.status === 'overdue') {
        riskLevel = 'breach'; tagClass = 'govuk-tag--red'; tagLabel = 'Breach';
      } else {
        riskLevel = 'warning'; tagClass = 'govuk-tag--orange'; tagLabel = 'Approaching';
      }
      return { case: c, riskLevel, tagClass, tagLabel };
    })
    .sort((a, b) => (a.riskLevel === 'breach' ? -1 : 1));

  // Cases needing team leader action
  const actionRequired = allAugmented.filter(c =>
    c.status === 'escalated' || c.status === 'pending_decision'
  );

  // Risk rating for table
  const allCasesSorted = [...allAugmented].sort((a, b) => {
    const riskOrder = { escalated: 0, awaiting_evidence: 1 };
    const aRisk = riskOrder[a.status] ?? 2;
    const bRisk = riskOrder[b.status] ?? 2;
    if (aRisk !== bRisk) return aRisk - bRisk;
    return b.daysSinceUpdate - a.daysSinceUpdate;
  });

  allCasesSorted.forEach(c => {
    if (c.isUrgent) { c.riskLabel = 'High'; c.riskClass = 'app-risk-high'; }
    else if (c.escalationStatus && c.escalationStatus.status === 'warning') { c.riskLabel = 'Medium'; c.riskClass = 'app-risk-medium'; }
    else if (c.status === 'closed') { c.riskLabel = '—'; c.riskClass = ''; }
    else { c.riskLabel = 'Low'; c.riskClass = ''; }
  });

  res.render('team-leader.njk', {
    title: 'Team leader overview — CaseTracker',
    activePage: 'team-leader',
    stats,
    statusBreakdown,
    teamCapacity,
    deadlineRisks,
    actionRequired,
    cases: allCasesSorted
  });
});

module.exports = router;
