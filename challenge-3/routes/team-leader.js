const express = require('express');
const router = express.Router();
const { augmentCase } = require('../lib/cases');

const STATUS_LABELS = {
  case_created: 'Case created',
  awaiting_evidence: 'Awaiting evidence',
  under_review: 'Under review',
  pending_decision: 'Pending decision',
  escalated: 'Escalated',
  closed: 'Closed'
};

router.get('/', (req, res) => {
  const { cases, workflowStates } = req.app.locals;
  const all = cases.map(c => augmentCase(c, workflowStates));

  // Headline stats
  const stats = {
    total: all.length,
    escalated: all.filter(c => c.status === 'escalated').length,
    overdue: all.filter(c => c.escalationStatus && c.escalationStatus.status === 'overdue').length,
    pending_decision: all.filter(c => c.status === 'pending_decision').length,
    closed: all.filter(c => c.status === 'closed').length
  };

  // Status counts for bar chart
  const statusCounts = {};
  all.forEach(c => {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  });
  const barChartData = [
    { status: 'awaiting_evidence', label: 'Awaiting evidence', count: statusCounts.awaiting_evidence || 0, cls: 'bar-fill--orange' },
    { status: 'under_review',      label: 'Under review',      count: statusCounts.under_review || 0,      cls: 'bar-fill--blue' },
    { status: 'pending_decision',  label: 'Pending decision',  count: statusCounts.pending_decision || 0,  cls: 'bar-fill--purple' },
    { status: 'escalated',         label: 'Escalated',         count: statusCounts.escalated || 0,         cls: 'bar-fill--red' },
    { status: 'closed',            label: 'Closed',            count: statusCounts.closed || 0,            cls: 'bar-fill--grey' }
  ];
  const maxCount = Math.max(...barChartData.map(d => d.count), 1);

  // Team capacity — group by assigned_to
  const teamMap = {};
  all.forEach(c => {
    const team = c.assigned_to || 'unassigned';
    if (!teamMap[team]) teamMap[team] = [];
    teamMap[team].push(c);
  });
  const teams = Object.entries(teamMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([team, teamCases]) => {
      const hasEscalated = teamCases.some(c => c.status === 'escalated');
      const hasOverdue = teamCases.some(c => c.escalationStatus && c.escalationStatus.status === 'overdue');
      const breakdown = Object.entries(
        teamCases.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {})
      ).map(([s, n]) => `${n} ${STATUS_LABELS[s] || s}`.toLowerCase()).join(', ');
      return { team, cases: teamCases, count: teamCases.length, underPressure: hasEscalated || hasOverdue, breakdown };
    });

  // Deadline risks — cases with escalation status, sorted worst first
  const deadlineRisks = all
    .filter(c => c.escalationStatus)
    .sort((a, b) => b.escalationStatus.days - a.escalationStatus.days);

  // Action required: escalated + pending decision needing sign-off
  const actionRequired = all.filter(c =>
    c.status === 'escalated' || c.status === 'pending_decision'
  );

  // All cases table — sort escalated first, then by days since update
  const allSorted = [...all].sort((a, b) => {
    if (a.status === 'escalated' && b.status !== 'escalated') return -1;
    if (a.status !== 'escalated' && b.status === 'escalated') return 1;
    return b.daysSinceUpdate - a.daysSinceUpdate;
  });

  res.render('team-leader.njk', {
    title: 'Team leader overview — CaseTracker',
    activePage: 'team-leader',
    stats,
    barChartData,
    maxCount,
    teams,
    deadlineRisks,
    actionRequired,
    allCases: allSorted
  });
});

module.exports = router;
