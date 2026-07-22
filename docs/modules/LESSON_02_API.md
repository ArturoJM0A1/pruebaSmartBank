# Lesson 2: REST API Design

## What You Learned

- RESTful API principles
- HTTP methods (GET, POST, PUT, DELETE)
- Status codes and error handling
- Request/response formats
- Authentication patterns

---

## Why It Was Done This Way

### RESTful Conventions
```
GET    /api/accounts          → List accounts
GET    /api/accounts/:id      → Get account
POST   /api/accounts          → Create account
PUT    /api/accounts/:id      → Update account
DELETE /api/accounts/:id      → Delete account
```

**Why REST?**
- Industry standard (GitHub, Twitter, Stripe use REST)
- Predictable URL structure
- HTTP methods have clear semantics
- Easy to understand and implement

### Response Format
```json
{
  "success": true,
  "data": {
    "accounts": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 50
    }
  }
}
```

**Why consistent format?**
- Frontend can reliably parse responses
- Error handling is standardized
- Easy to add metadata (pagination, etc.)

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "TRANSFER_INSUFFICIENT_FUNDS",
    "message": "Insufficient funds for transfer"
  }
}
```

**Why error codes?**
- Machine-readable for programmatic handling
- Human-readable messages for users
- Consistent across all endpoints

---

## Common Mistakes

1. **Using wrong HTTP methods**
   - Mistake: Using GET for mutations
   - Fix: GET=Read, POST=Create, PUT=Update, DELETE=Delete

2. **Not validating input**
   - Mistake: Trusting client data
   - Fix: Validate on server before processing

3. **Inconsistent error formats**
   - Mistake: Different error shapes per endpoint
   - Fix: Standardize error response format

4. **Missing status codes**
   - Mistake: Always returning 200
   - Fix: Use appropriate codes (201, 400, 404, 500)

---

## Interview Questions

**Q: What is REST and its constraints?**

A: REST (Representational State Transfer) has 6 constraints:
1. Client-Server architecture
2. Stateless communication
3. Cacheable responses
4. Uniform interface
5. Layered system
6. Code on demand (optional)

**Q: When would you use PUT vs PATCH?**

A:
- PUT: Replace entire resource
- PATCH: Partial update

**Q: How do you handle authentication in REST APIs?**

A: Common methods:
1. JWT tokens (stateless)
2. Session cookies (stateful)
3. API keys (for service-to-service)
4. OAuth 2.0 (third-party access)

---

## Practice Exercises

1. **Design an API**
   - Create endpoints for a blog system
   - Include posts, comments, users
   - Define request/response formats

2. **Implement error handling**
   - Create middleware for error handling
   - Add proper status codes
   - Write error response format

3. **Add validation**
   - Validate request bodies
   - Return meaningful error messages
   - Test with invalid data
