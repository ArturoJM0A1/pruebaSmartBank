# Sprint Planning - SmartBank

## Sprint Planning Ceremony

**Duration**: 2-4 hours (depending on sprint length)
**Participants**: Product Owner, Scrum Master, Development Team
**Purpose**: Decide what work to accomplish in the upcoming sprint

---

## Sprint Details

| Field | Value |
|-------|-------|
| Sprint Number | 1 |
| Sprint Goal | Complete user authentication and basic dashboard |
| Start Date | 2024-07-01 |
| End Date | 2024-07-14 |
| Sprint Length | 2 weeks |
| Team Velocity | 20 story points (estimated) |

---

## Capacity Planning

| Team Member | Available Days | Capacity (points) |
|-------------|---------------|-------------------|
| Developer 1 | 10 | 10 |
| Developer 2 | 8 | 8 |
| Developer 3 | 10 | 10 |
| **Total** | **28** | **28** |

**Buffer**: 20% for unexpected work → **Effective capacity: ~22 points**

---

## Selected Stories

| ID | Story | Points | Assignee |
|----|-------|--------|----------|
| US-001 | User Login | 3 | Dev 1 |
| US-002 | User Registration | 5 | Dev 2 |
| US-003 | View Dashboard | 3 | Dev 1 |
| US-004 | View Accounts | 3 | Dev 3 |
| US-005 | View Transactions | 5 | Dev 2 |
| US-007 | View Beneficiaries | 3 | Dev 3 |
| **Total** | | **22** | |

---

## Sprint Tasks Breakdown

### US-001: User Login (3 points)
- [ ] Create login form HTML/CSS
- [ ] Implement email validation
- [ ] Implement password validation
- [ ] Create auth service (API call)
- [ ] Store JWT token
- [ ] Redirect to dashboard on success
- [ ] Show error message on failure
- [ ] Write unit tests

### US-002: User Registration (5 points)
- [ ] Create registration form
- [ ] Implement multi-step form
- [ ] Add form validation
- [ ] Create registration API call
- [ ] Handle email verification
- [ ] Write unit tests

### US-003: View Dashboard (3 points)
- [ ] Create dashboard layout
- [ ] Display account summary
- [ ] Show recent transactions
- [ ] Display notifications count
- [ ] Responsive design

### US-004: View Accounts (3 points)
- [ ] Create accounts list view
- [ ] Display account balance
- [ ] Show account type icon
- [ ] Navigate to account detail

### US-005: View Transactions (5 points)
- [ ] Create transactions list
- [ ] Implement pagination
- [ ] Add transaction filters
- [ ] Display transaction details
- [ ] Handle empty state

### US-007: View Beneficiaries (3 points)
- [ ] Create beneficiaries list
- [ ] Display beneficiary info
- [ ] Add favorite indicator
- [ ] Navigate to add beneficiary

---

## Definition of Done

A story is "Done" when:
- [ ] Code is written and follows style guide
- [ ] Unit tests are written and passing
- [ ] Code is reviewed by at least one developer
- [ ] Feature works in Chrome, Firefox, Edge
- [ ] No critical or high bugs
- [ ] Documentation is updated
- [ ] Product Owner has accepted the story

---

## Velocity

**Planned**: 22 points
**Completed**: (to be filled at sprint end)
**Velocity Trend**: (track over sprints)

### Why Velocity Matters
- Helps predict how much work can be done in future sprints
- Identifies team capacity changes over time
- Assists in sprint planning (commit to what you can deliver)
