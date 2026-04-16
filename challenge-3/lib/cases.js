/**
 * Calculate the number of days between an ISO date string and today
 * @param {string} dateStr
 * @returns {number}
 */
function daysSince(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.floor((today - date) / (1000 * 60 * 60 * 24));
}

/**
 * Get the most recent timeline event date for a case
 * @param {object} caseObj
 * @returns {string} ISO date string
 */
function getLastEventDate(caseObj) {
  const sorted = [...caseObj.timeline].sort((a, b) => new Date(b.date) - new Date(a.date));
  return sorted[0]?.date;
}

/**
 * Get days since the most recent timeline event
 * @param {object} caseObj
 * @returns {number}
 */
function getDaysSinceUpdate(caseObj) {
  const lastDate = getLastEventDate(caseObj);
  if (!lastDate) return 0;
  return daysSince(lastDate);
}

/**
 * Find when a specific event type first occurred
 * @param {object} caseObj
 * @param {string} eventType
 * @returns {string|null} ISO date string
 */
function getEventDate(caseObj, eventType) {
  const event = caseObj.timeline.find(e => e.event === eventType);
  return event ? event.date : null;
}

/**
 * Get days badge label and CSS class for display
 * @param {number} days
 * @returns {{ label: string, cssClass: string }}
 */
function getDaysBadge(days) {
  if (days >= 56) {
    return { label: `${days} days (overdue)`, cssClass: 'app-days-badge--overdue' };
  }
  if (days >= 28) {
    return { label: `${days} days (warning)`, cssClass: 'app-days-badge--warning' };
  }
  return { label: `${days} days`, cssClass: 'app-days-badge--ok' };
}

/**
 * Get escalation status for a case based on evidence request date and policy thresholds
 * Only applies to awaiting_evidence and escalated cases with escalation_thresholds defined
 * @param {object} caseObj
 * @param {object} workflowStates - full workflow-states.json object
 * @returns {{ status: 'overdue'|'warning'|'ok', days: number, reminderDays: number, escalationDays: number, evidenceRequestedDate: string }|null}
 */
function getEscalationStatus(caseObj, workflowStates) {
  if (!['awaiting_evidence', 'escalated'].includes(caseObj.status)) return null;

  const caseTypeWorkflow = workflowStates.case_types[caseObj.case_type];
  if (!caseTypeWorkflow) return null;

  const awaitingState = caseTypeWorkflow.states.find(s => s.state === 'awaiting_evidence');
  if (!awaitingState?.escalation_thresholds) return null;

  const { reminder_days: reminderDays, escalation_days: escalationDays } = awaitingState.escalation_thresholds;

  const evidenceRequestedDate = getEventDate(caseObj, 'evidence_requested');
  if (!evidenceRequestedDate) return null;

  // For escalated cases: measure days from evidence request to escalation date
  // For awaiting_evidence cases: measure days from evidence request to today
  let daysOutstanding;
  if (caseObj.status === 'escalated') {
    const escalatedDate = getEventDate(caseObj, 'escalated');
    if (escalatedDate) {
      const reqDate = new Date(evidenceRequestedDate);
      const escDate = new Date(escalatedDate);
      daysOutstanding = Math.floor((escDate - reqDate) / (1000 * 60 * 60 * 24));
    } else {
      daysOutstanding = daysSince(evidenceRequestedDate);
    }
  } else {
    daysOutstanding = daysSince(evidenceRequestedDate);
  }

  let status = 'ok';
  if (escalationDays && daysOutstanding >= escalationDays) {
    status = 'overdue';
  } else if (reminderDays && daysOutstanding >= reminderDays) {
    status = 'warning';
  }

  return { status, days: daysOutstanding, reminderDays, escalationDays, evidenceRequestedDate };
}

/**
 * Evidence items expected per case type, with keywords for receipt detection
 */
const EVIDENCE_ITEMS = {
  benefit_review: [
    { key: 'proof_of_address', label: 'Proof of address', keywords: ['proof of address received'] },
    { key: 'income_statement', label: 'Income statement', keywords: ['income statement received', 'income statement verified'] },
    { key: 'signed_declaration', label: 'Signed declaration', keywords: ['signed declaration received', 'declaration received', 'declaration verified'] }
  ],
  licence_application: [
    { key: 'proof_of_identity', label: 'Proof of identity', keywords: ['identity documents verified', 'identity verified'] },
    { key: 'site_plan', label: 'Site plan', keywords: ['site plan received', 'site plan verified'] },
    { key: 'documentation', label: 'Supporting documents', keywords: ['all supporting documents included', 'all documents received', 'all documents verified'] }
  ],
  compliance_check: [
    { key: 'documentation', label: 'Requested documentation', keywords: ['full documentation package received', 'documentation received', 'documentation package received'] },
    { key: 'site_visit', label: 'Site visit record', keywords: ['site visit conducted', 'inspection completed', 'inspection passed'] }
  ]
};

/**
 * Derive evidence item statuses from timeline events
 * @param {object} caseObj
 * @param {object} workflowStates
 * @returns {Array<{ key, label, status, statusLabel, statusClass }>}
 */
function getEvidenceItems(caseObj, workflowStates) {
  const items = EVIDENCE_ITEMS[caseObj.case_type] || [];
  const escalation = getEscalationStatus(caseObj, workflowStates);

  const receiptEvents = caseObj.timeline.filter(
    e => e.event === 'evidence_received' || e.event === 'evidence_verified'
  );

  return items.map(item => {
    const notesText = receiptEvents.map(e => e.note.toLowerCase()).join(' ');
    const received = item.keywords.some(kw => notesText.includes(kw));

    if (received) {
      return { ...item, status: 'received', statusLabel: 'Received', statusClass: 'govuk-tag--green' };
    }

    if (caseObj.status === 'awaiting_evidence' && escalation && escalation.status === 'overdue') {
      return { ...item, status: 'overdue', statusLabel: 'Overdue', statusClass: 'govuk-tag--red' };
    }

    return { ...item, status: 'not_received', statusLabel: 'Not received', statusClass: 'govuk-tag--red' };
  });
}

/**
 * Augment a case object with computed display properties
 * @param {object} caseObj
 * @param {object} workflowStates
 * @returns {object}
 */
function augmentCase(caseObj, workflowStates) {
  const days = getDaysSinceUpdate(caseObj);
  const badge = getDaysBadge(days);
  const escalation = getEscalationStatus(caseObj, workflowStates);

  return {
    ...caseObj,
    daysSinceUpdate: days,
    daysBadge: badge,
    escalationStatus: escalation,
    isUrgent: caseObj.status === 'escalated' || (escalation && escalation.status === 'overdue')
  };
}

module.exports = {
  daysSince,
  getDaysSinceUpdate,
  getLastEventDate,
  getEventDate,
  getDaysBadge,
  getEscalationStatus,
  getEvidenceItems,
  augmentCase
};
