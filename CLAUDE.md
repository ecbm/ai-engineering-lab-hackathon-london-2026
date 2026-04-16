# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A hackathon challenge kit for the AI Engineering Lab Hackathon (London, April 2026). This CLAUDE.md is scoped to **Challenge 3: Supporting casework decisions**. There is no existing prototype — the goal is to build one from scratch using the starter data in `challenge-3/`.

Full brief: `challenge-03-supporting-casework-decisions.md`

## Challenge 3 — data files

All data is in `challenge-3/`. There are no build tools, package files, or APIs in this repo.

### `cases.json` — 10 synthetic cases

```
case_id        string    e.g. "CASE-2026-00042"
case_type      enum      "benefit_review" | "licence_application" | "compliance_check"
status         string    matches a state name in workflow-states.json
applicant      object    name, reference, date_of_birth
assigned_to    string    e.g. "team_b"
created_date   date
last_updated   date
timeline       array     { date, event, note }
case_notes     string    free-text summary
```

### `policy-extracts.json` — 10 policy documents

```
policy_id              string    e.g. "POL-BR-003"
title                  string
applicable_case_types  array     one or more of the three case types
body                   string    full policy text including thresholds and rules
```

Policy IDs by case type: `POL-BR-001..004` (benefit_review), `POL-LA-001..003` (licence_application), `POL-CC-001..003` (compliance_check). Match policies to a case by filtering on `applicable_case_types`.

### `workflow-states.json` — state machine

Keyed by case type → `states[]`. Each state has:

```
state                  string    matches status values in cases.json
allowed_transitions    array     valid next states
required_actions       array     what the caseworker must do in this state
escalation_thresholds  object    reminder_days / escalation_days (present on some states only)
```

State flow (all three case types share the same shape):
`case_created → awaiting_evidence → under_review → pending_decision → closed`
`escalated` is reachable from most states and can transition back into the flow.

## Key business rules (embedded in the data)

These are the rules worth surfacing in the UI — they are encoded in `policy-extracts.json` and `workflow-states.json` but worth calling out explicitly:

- **benefit_review / awaiting_evidence**: reminder if evidence outstanding >28 days; escalate to team leader if >56 days
- **licence_application / under_review**: 28-day public consultation required; refer to senior caseworker if 2+ substantive objections
- **compliance_check / pending_decision**: serious breach → escalate to senior officer within 2 working days
- **benefit_review / pending_decision**: team leader sign-off required if award increase >£50/week; mandatory reconsideration notice if reducing/ceasing benefit

## What a complete prototype looks like

A non-AI prototype that does the following is explicitly considered complete by the judging rubric:

1. Display a single case — applicant details, timeline, case notes
2. Surface matching policies alongside the case (filter `applicable_case_types` by `case_type`)
3. Show current workflow state, required actions, and valid next transitions
4. Flag overdue thresholds (compare `timeline` event dates against `escalation_thresholds`)

AI summarisation (e.g. case summary generation) can be mocked — design the interface so the mock endpoint can be swapped for a real model call without changing the rest of the system. A mocked AI prototype scores the same as a live one.

## Useful references

- GOV.UK design system: https://design-system.service.gov.uk
- GOV.UK Content API: https://content-api.publishing.service.gov.uk
