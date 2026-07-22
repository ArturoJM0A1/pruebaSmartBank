# User Stories - SmartBank

## Overview

This document contains detailed user stories for all SmartBank features. Each story follows the standard format and includes acceptance criteria in Given/When/Then format.

---

## INVEST Criteria

Each story must be:
- **I**ndependent: Can be developed without other stories
- **N**egotiable: Details can be discussed
- **V**aluable: Delivers value to users
- **E**stimable: Team can estimate effort
- **S**mall: Can be completed in one sprint
- **T**estable: Has clear acceptance criteria

---

## Login/Auth Stories

### US-001: User Login

**As a** registered user,
**I want to** log in with my email and password,
**So that** I can access my banking dashboard.

**Story Points**: 3
**Priority**: Must Have

**Acceptance Criteria**:
```
Given I am on the login page
When I enter a valid email and password
And I click the "Login" button
Then I should be redirected to the dashboard
And I should see my name in the header

Given I am on the login page
When I enter invalid credentials
And I click the "Login" button
Then I should see an error message
And I should remain on the login page

Given I am on the login page
When I enter an invalid email format
Then I should see a validation error
And the login button should be disabled
```

---

### US-002: User Registration

**As a** new user,
**I want to** create an account with my personal information,
**So that** I can start using SmartBank services.

**Story Points**: 5
**Priority**: Must Have

**Acceptance Criteria**:
```
Given I am on the registration page
When I fill in all required fields correctly
And I click "Register"
Then my account should be created
And I should receive a verification email

Given I am on the registration page
When I enter an email that already exists
Then I should see an error message
And I should be able to use a different email

Given I am on the registration page
When I enter a weak password
Then I should see password strength requirements
And the form should not submit
```

---

### US-003: User Logout

**As a** logged-in user,
**I want to** log out of my account,
**So that** my account is secure when I leave.

**Story Points**: 1
**Priority**: Must Have

**Acceptance Criteria**:
```
Given I am logged in
When I click the "Logout" button
Then my session should be terminated
And I should be redirected to the login page
And my token should be removed from storage
```

---

## Dashboard Stories

### US-004: View Dashboard

**As a** logged-in user,
**I want to** see an overview of my accounts and recent activity,
**So that** I can quickly understand my financial status.

**Story Points**: 3
**Priority**: Must Have

**Acceptance Criteria**:
```
Given I am on the dashboard
When the page loads
Then I should see my total balance across all accounts
And I should see a list of my accounts
And I should see recent transactions

Given I am on the dashboard
When I have no accounts
Then I should see an empty state message
And I should see a "Create Account" button
```

---

### US-005: View Account Summary

**As a** user on the dashboard,
**I want to** see a summary card for each account,
**So that** I can quickly check balances.

**Story Points**: 2
**Priority**: Must Have

**Acceptance Criteria**:
```
Given I am on the dashboard
When I view my accounts
Then each account should show:
  - Account name
  - Account number (masked)
  - Current balance
  - Account type icon
```

---

## Account Management Stories

### US-006: View Accounts List

**As a** user,
**I want to** see a list of all my accounts,
**So that** I can manage my different accounts.

**Story Points**: 3
**Priority**: Must Have

**Acceptance Criteria**:
```
Given I navigate to the Accounts page
When the page loads
Then I should see all my accounts listed
And each account should show:
  - Account name
  - Account number
  - Balance
  - Account type
  - Status (active/inactive)
```

---

### US-007: View Account Detail

**As a** user,
**I want to** see detailed information about a specific account,
**So that** I can see full transaction history and account details.

**Story Points**: 3
**Priority**: Must Have

**Acceptance Criteria**:
```
Given I am on the accounts list
When I click on an account
Then I should see the account detail page
And I should see:
  - Full account information
  - CLABE number
  - Transaction history
  - Available actions (transfer, pay bill)
```

---

## Card Management Stories

### US-008: View Cards

**As a** user,
**I want to** see my debit and credit cards,
**So that** I can manage my card usage.

**Story Points**: 3
**Priority**: Should Have

**Acceptance Criteria**:
```
Given I navigate to the Cards page
When the page loads
Then I should see all my cards
And each card should show:
  - Card number (last 4 digits)
  - Card type (debit/credit)
  - Card brand (Visa/Mastercard)
  - Expiration date
  - Status (active/blocked)
```

---

### US-009: Block/Unblock Card

**As a** user,
**I want to** temporarily block my card,
**So that** I can prevent unauthorized use if lost or stolen.

**Story Points**: 2
**Priority**: Should Have

**Acceptance Criteria**:
```
Given I am on the cards page
When I click "Block Card" on an active card
Then I should see a confirmation dialog
And after confirming, the card status should change to "Blocked"
And I should see a success message

Given I have a blocked card
When I click "Unblock Card"
Then the card should become active again
And I should see a confirmation message
```

---

## Transaction Stories

### US-010: View Transactions

**As a** user,
**I want to** see my transaction history,
**So that** I can track my spending and income.

**Story Points**: 5
**Priority**: Must Have

**Acceptance Criteria**:
```
Given I navigate to the Transactions page
When the page loads
Then I should see a list of my transactions
And each transaction should show:
  - Date
  - Description
  - Amount (colored by type)
  - Category
  - Status

Given I am on the transactions page
When I have more than 10 transactions
Then I should see pagination controls
And I can navigate between pages
```

---

### US-011: Filter Transactions

**As a** user,
**I want to** filter my transactions by type, date, or amount,
**So that** I can find specific transactions quickly.

**Story Points**: 3
**Priority**: Should Have

**Acceptance Criteria**:
```
Given I am on the transactions page
When I select a filter (type, date range, amount range)
Then the transaction list should update
And I should see the number of results

Given I have applied filters
When I click "Clear Filters"
Then all filters should be removed
And I should see all transactions again
```

---

### US-012: Search Transactions

**As a** user,
**I want to** search transactions by description,
**So that** I can find specific transactions.

**Story Points**: 3
**Priority**: Should Have

**Acceptance Criteria**:
```
Given I am on the transactions page
When I type in the search box
Then transactions should filter in real-time
And matching text should be highlighted

Given I search for a term with no results
Then I should see "No transactions found"
And I should see a suggestion to clear the search
```

---

## Transfer Stories

### US-013: Make Transfer

**As a** user,
**I want to** transfer money to another account,
**So that** I can send money to friends, family, or businesses.

**Story Points**: 8
**Priority**: Must Have

**Acceptance Criteria**:
```
Given I am on the transfer page
When I select a source account
And I enter a beneficiary
And I enter an amount
And I enter a concept
And I click "Transfer"
Then I should see a confirmation dialog
And after confirming, the transfer should be processed
And I should see a success message with the reference number

Given I try to transfer more than my balance
Then I should see an "Insufficient funds" error
And the transfer should not proceed

Given I enter an amount less than $1 MXN
Then I should see a validation error
And the transfer button should be disabled
```

---

### US-014: View Transfer Receipt

**As a** user who completed a transfer,
**I want to** see a receipt with all transfer details,
**So that** I have proof of the transaction.

**Story Points**: 2
**Priority**: Should Have

**Acceptance Criteria**:
```
Given I just completed a transfer
When the success message appears
Then I should see:
  - Transaction reference
  - Amount transferred
  - Source account
  - Destination account
  - Date and time
  - Status
```

---

## Beneficiary Stories

### US-015: View Beneficiaries

**As a** user,
**I want to** see my saved beneficiaries,
**So that** I can quickly select them for transfers.

**Story Points**: 3
**Priority**: Must Have

**Acceptance Criteria**:
```
Given I navigate to the Beneficiaries page
When the page loads
Then I should see a list of my beneficiaries
And each beneficiary should show:
  - Name
  - Bank name
  - Account number (masked)
  - Favorite indicator
```

---

### US-016: Add Beneficiary

**As a** user,
**I want to** save a new beneficiary,
**So that** I don't have to enter their details every time.

**Story Points**: 3
**Priority**: Must Have

**Acceptance Criteria**:
```
Given I am on the add beneficiary form
When I enter valid beneficiary details
And I click "Save"
Then the beneficiary should be added to my list
And I should see a success message

Given I enter an invalid CLABE
Then I should see a validation error
And the form should not submit
```

---

### US-017: Mark Beneficiary as Favorite

**As a** user,
**I want to** mark a beneficiary as favorite,
**So that** they appear at the top of the list.

**Story Points**: 1
**Priority**: Could Have

**Acceptance Criteria**:
```
Given I am on the beneficiaries list
When I click the star icon on a beneficiary
Then it should be marked as favorite
And it should appear at the top of the list
```

---

## Bill Payment Stories

### US-018: View Bills

**As a** user,
**I want to** see my pending bills,
**So that** I know what needs to be paid.

**Story Points**: 3
**Priority**: Should Have

**Acceptance Criteria**:
```
Given I navigate to the Bills page
When the page loads
Then I should see my pending bills
And each bill should show:
  - Biller name
  - Amount
  - Due date
  - Status (pending/paid/overdue)
```

---

### US-019: Pay Bill

**As a** user,
**I want to** pay a bill,
**So that** I can manage my payments in one place.

**Story Points**: 3
**Priority**: Should Have

**Acceptance Criteria**:
```
Given I am on the bills page
When I select a bill to pay
And I confirm the payment
Then the bill should be marked as paid
And I should see a success message
And the amount should be deducted from my account
```

---

## Notification Stories

### US-020: View Notifications

**As a** user,
**I want to** see my notifications,
**So that** I stay informed about my account activity.

**Story Points**: 2
**Priority**: Should Have

**Acceptance Criteria**:
```
Given I click the notification bell
When I have notifications
Then I should see a dropdown with my notifications
And unread notifications should be highlighted
And I should see the notification count badge
```

---

### US-021: Mark Notification as Read

**As a** user,
**I want to** mark notifications as read,
**So that** I know which ones I've seen.

**Story Points**: 1
**Priority**: Could Have

**Acceptance Criteria**:
```
Given I have unread notifications
When I click on a notification
Then it should be marked as read
And the unread count should decrease
```

---

## Settings Stories

### US-022: Update Profile

**As a** user,
**I want to** update my personal information,
**So that** my account details are current.

**Story Points**: 2
**Priority**: Should Have

**Acceptance Criteria**:
```
Given I navigate to my profile
When I update my information
And I click "Save"
Then my profile should be updated
And I should see a success message
```

---

### US-023: Change Password

**As a** user,
**I want to** change my password,
**So that** I can keep my account secure.

**Story Points**: 2
**Priority**: Should Have

**Acceptance Criteria**:
```
Given I am on the change password page
When I enter my current password
And I enter a new strong password
And I confirm the new password
And I click "Change Password"
Then my password should be updated
And I should be asked to log in again
```

---

### US-024: Update Preferences

**As a** user,
**I want to** update my app preferences (theme, language, notifications),
**So that** the app works the way I like.

**Story Points**: 2
**Priority**: Could Have

**Acceptance Criteria**:
```
Given I am on the settings page
When I change my theme to "Dark"
Then the app should switch to dark mode immediately
And my preference should be saved

Given I disable email notifications
Then I should not receive email notifications
And I should still see in-app notifications
```

---

## Search Stories

### US-025: Global Search

**As a** user,
**I want to** search across accounts, transactions, and beneficiaries,
**So that** I can quickly find what I'm looking for.

**Story Points**: 3
**Priority**: Could Have

**Acceptance Criteria**:
```
Given I type in the global search bar
When I enter a search term
Then I should see results across all categories
And results should be grouped by type
And I should be able to click to navigate

Given my search has no results
Then I should see "No results found"
And I should see suggestions to refine my search
```

---

## Story Points Summary

| Category | Stories | Total Points |
|----------|---------|--------------|
| Auth | 3 | 9 |
| Dashboard | 2 | 5 |
| Accounts | 2 | 6 |
| Cards | 2 | 5 |
| Transactions | 3 | 11 |
| Transfers | 2 | 10 |
| Beneficiaries | 3 | 7 |
| Bills | 2 | 6 |
| Notifications | 2 | 3 |
| Settings | 3 | 6 |
| Search | 1 | 3 |
| **Total** | **25** | **71** |

---

## Estimation Guide

| Points | Description |
|--------|-------------|
| 1 | Simple change, few hours |
| 2 | Small feature, half day |
| 3 | Medium feature, 1 day |
| 5 | Large feature, 2-3 days |
| 8 | Very large, needs splitting |
| 13 | Epic, must be broken down |
| 21 | Too large, decompose first |
