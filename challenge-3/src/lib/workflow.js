/**
 * The canonical display order for workflow states (escalated is a branch, shown separately)
 */
const DISPLAY_ORDER = ['case_created', 'awaiting_evidence', 'under_review', 'pending_decision', 'closed'];

/**
 * Get ordered workflow states for a case type
 * @param {string} caseType
 * @param {object} allWorkflows
 * @returns {Array}
 */
function getWorkflowStatesList(caseType, allWorkflows) {
  return allWorkflows.case_types[caseType]?.states || [];
}

/**
 * Get the state definition for the case's current status
 * @param {object} caseObj
 * @param {object} allWorkflows
 * @returns {object|null}
 */
function getCurrentStateDef(caseObj, allWorkflows) {
  const states = getWorkflowStatesList(caseObj.case_type, allWorkflows);
  return states.find(s => s.state === caseObj.status) || null;
}

/**
 * Build workflow step list for display with step status
 * Steps shown in canonical order; escalated cases show 'Escalated' as the current step
 * @param {object} caseObj
 * @param {object} allWorkflows
 * @returns {Array<{ state, label, description, stepStatus: 'completed'|'current'|'future' }>}
 */
function getWorkflowSteps(caseObj, allWorkflows) {
  const allStates = getWorkflowStatesList(caseObj.case_type, allWorkflows);

  // For escalated cases, show escalated as the current step in place of the normal flow
  let stepsToShow;
  if (caseObj.status === 'escalated') {
    const escalatedState = allStates.find(s => s.state === 'escalated');
    stepsToShow = [
      ...allStates.filter(s => DISPLAY_ORDER.includes(s.state)),
      ...(escalatedState ? [escalatedState] : [])
    ];
  } else {
    stepsToShow = allStates.filter(s => DISPLAY_ORDER.includes(s.state));
  }

  const currentIdx = DISPLAY_ORDER.indexOf(caseObj.status);

  return stepsToShow.map(state => {
    let stepStatus;
    if (state.state === caseObj.status) {
      stepStatus = 'current';
    } else if (state.state === 'escalated') {
      stepStatus = 'future';
    } else {
      const stateIdx = DISPLAY_ORDER.indexOf(state.state);
      stepStatus = stateIdx < currentIdx ? 'completed' : 'future';
    }
    return { ...state, stepStatus };
  });
}

/**
 * Heuristic: determine which required actions have been completed based on timeline
 * @param {object} caseObj
 * @param {object} allWorkflows
 * @returns {Array<{ action: string, completed: boolean }>}
 */
function getRequiredActions(caseObj, allWorkflows) {
  const stateDef = getCurrentStateDef(caseObj, allWorkflows);
  if (!stateDef) return [];

  const timelineEvents = new Set(caseObj.timeline.map(e => e.event));
  const timelineNotes = caseObj.timeline.map(e => e.note.toLowerCase()).join(' ');

  return stateDef.required_actions.map(action => {
    const a = action.toLowerCase();
    let completed = false;

    if (a.includes('send evidence request') || a.includes('evidence request to applicant')) {
      completed = timelineEvents.has('evidence_requested');
    } else if (a.includes('log date of evidence request') || a.includes('log request date')) {
      completed = timelineEvents.has('evidence_requested');
    } else if (a.includes('escalate to team leader') || a.includes('escalate to senior')) {
      completed = timelineEvents.has('escalated');
    } else if (a.includes('reminder')) {
      completed = timelineNotes.includes('reminder');
    } else if (a.includes('verify') || a.includes('verified')) {
      completed = timelineEvents.has('evidence_verified');
    } else if (a.includes('inspect')) {
      completed = timelineEvents.has('inspection_completed') || timelineEvents.has('site_visit');
    } else if (a.includes('consultation')) {
      completed = timelineEvents.has('consultation_opened');
    }

    return { action, completed };
  });
}

module.exports = {
  getWorkflowSteps,
  getCurrentStateDef,
  getWorkflowStatesList,
  getRequiredActions
};
