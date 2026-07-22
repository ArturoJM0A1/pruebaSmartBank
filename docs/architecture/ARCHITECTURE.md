# Architecture Document - SmartBank

## Overview

SmartBank follows a layered architecture pattern that separates concerns and promotes maintainability.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │  Pages   │  │Components│  │  Layouts │  │  Hooks  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │              │         │
├───────┴──────────────┴──────────────┴──────────────┴─────────┤
│                   BUSINESS LOGIC LAYER                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ Services │  │  Store  │  │ Router  │  │  Utils  │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │              │              │              │            │
├───────┴──────────────┴──────────────┴──────────────┴────────────┤
│                      DATA LAYER                                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │   API   │  │   Auth  │  │  Cache  │  │ Storage │         │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer Separation

### Presentation Layer
**Purpose**: User interface and user interaction

**Components**:
- **Pages**: Full-screen views (Login, Dashboard, Accounts)
- **Components**: Reusable UI elements (Button, Card, Modal)
- **Layouts**: Page structure (Header, Sidebar, Footer)
- **Hooks**: Reusable stateful logic (useAuth, useFetch)

**Rules**:
- Never call API directly from components
- Pass data down via props
- Emit events up via callbacks

### Business Logic Layer
**Purpose**: Application logic and state management

**Components**:
- **Services**: API communication (AuthService, AccountService)
- **Store**: Centralized state (UserStore, AccountStore)
- **Router**: Navigation and route management
- **Utils**: Helper functions (formatCurrency, validators)

**Rules**:
- Services handle API calls and data transformation
- Store manages application state
- Utils are pure functions with no side effects

### Data Layer
**Purpose**: Data persistence and external communication

**Components**:
- **API**: HTTP client for backend communication
- **Auth**: Token management and authentication
- **Cache**: Temporary data storage
- **Storage**: Local persistence (localStorage, sessionStorage)

**Rules**:
- API handles all HTTP requests
- Auth manages tokens securely
- Cache has expiration policies

---

## Component Hierarchy

```
App
├── Router
│   ├── Layout
│   │   ├── Header
│   │   │   ├── Logo
│   │   │   ├── Navigation
│   │   │   └── UserMenu
│   │   ├── Sidebar
│   │   │   ├── NavItem (repeated)
│   │   │   └── CollapseButton
│   │   └── Footer
│   │
│   ├── Pages
│   │   ├── LoginPage
│   │   │   ├── LoginForm
│   │   │   │   ├── Input
│   │   │   │   ├── Button
│   │   │   │   └── ErrorMessage
│   │   │   └── ForgotPasswordLink
│   │   │
│   │   ├── DashboardPage
│   │   │   ├── AccountSummary
│   │   │   │   ├── AccountCard (repeated)
│   │   │   │   └── TotalBalance
│   │   │   ├── RecentTransactions
│   │   │   │   ├── TransactionItem (repeated)
│   │   │   │   └── ViewAllLink
│   │   │   └── QuickActions
│   │   │       ├── TransferButton
│   │   │       ├── PayBillButton
│   │   │       └── DepositButton
│   │   │
│   │   ├── AccountsPage
│   │   │   ├── AccountList
│   │   │   │   └── AccountDetail (repeated)
│   │   │   └── AccountFilters
│   │   │
│   │   └── TransferPage
│   │       ├── SourceAccountSelector
│   │       ├── BeneficiarySelector
│   │       ├── AmountInput
│   │       ├── ConceptInput
│   │       └── ConfirmButton
│   │
│   └── Modals
│       ├── ConfirmModal
│       ├── SuccessModal
│       └── ErrorModal
```

---

## Data Flow

```
User Action → Component → Service → API → Server
                                          ↓
                              Response ← Server
                                   ↓
Component ← Store ← Service ← Response
     ↓
  UI Update
```

### Example: User Makes Transfer

1. **User clicks "Transfer" button**
   - Component: `TransferButton`
   - Action: `onClick`

2. **Component validates input**
   - Component: `TransferForm`
   - Logic: `validateTransfer(data)`

3. **Component calls service**
   - Component: `TransferPage`
   - Service: `TransferService.execute(data)`

4. **Service calls API**
   - Service: `TransferService`
   - API: `POST /api/transfers`

5. **API sends request to server**
   - API: `HttpClient`
   - Server: `TransferController`

6. **Server processes and responds**
   - Server: `TransferService.process()`
   - Response: `{ success: true, transaction: {...} }`

7. **Service receives response**
   - Service: `TransferService`
   - Action: `handleResponse(response)`

8. **Store updates state**
   - Store: `AccountStore`
   - Action: `updateBalance(newBalance)`

9. **Component re-renders**
   - Component: `DashboardPage`
   - Action: `render()` with new balance

---

## API Design Principles

### RESTful Conventions
```
GET    /api/accounts          - List accounts
GET    /api/accounts/:id      - Get account details
POST   /api/accounts          - Create account
PUT    /api/accounts/:id      - Update account
DELETE /api/accounts/:id      - Delete account

GET    /api/transfers         - List transfers
POST   /api/transfers         - Create transfer
GET    /api/transfers/:id     - Get transfer details
```

### Response Format
```json
{
  "success": true,
  "data": {
    "accounts": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 50,
      "totalPages": 5
    }
  }
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "TRANSFER_INSUFFICIENT_FUNDS",
    "message": "Insufficient funds for transfer"
  }
}
```

---

## Error Handling Strategy

### Client-Side Error Handling
```
┌─────────────────┐
│  Component      │
│  (try/catch)    │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Service        │
│  (error transform) │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Global Handler │
│  (show notification) │
└─────────────────┘
```

### Error Types
| Type | Example | Handling |
|------|---------|----------|
| Validation | Invalid email | Show field error |
| Auth | Expired token | Redirect to login |
| Network | No internet | Show retry message |
| Server | 500 error | Show generic error |
| Timeout | Request took too long | Show timeout message |

---

## Security Considerations

### Authentication
- JWT tokens with expiration
- Refresh token rotation
- Secure token storage (HttpOnly cookies in production)

### Authorization
- Role-based access control (RBAC)
- API endpoint protection
- Frontend route guards

### Data Protection
- Input sanitization (XSS prevention)
- CSRF protection
- HTTPS enforcement
- Sensitive data masking

---

## Performance Considerations

### Loading Strategies
- **Lazy loading**: Load components on demand
- **Code splitting**: Split bundle by route
- **Image optimization**: Compress and resize images
- **Caching**: Cache API responses

### Rendering Optimization
- **Virtual scrolling**: For long lists
- **Memoization**: Cache expensive calculations
- **Debouncing**: Limit rapid API calls
- **Skeleton loading**: Show placeholders during load

---

## Scalability Notes

### Horizontal Scaling
- Stateless API design
- CDN for static assets
- Load balancing

### Vertical Scaling
- Database indexing
- Query optimization
- Connection pooling

### Code Scalability
- Modular architecture
- Clear separation of concerns
- Reusable components
- Configuration over code
