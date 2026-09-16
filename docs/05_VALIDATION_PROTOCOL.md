# 05 – Validation Protocol

## Before Submission

1. Assign the Firebase credential to every Firebase HTTP Request node.
2. Assign the Gemini credential in the generation workflow.
3. Assign the SMTP credential to every error-mail node.
4. Activate all five workflows.
5. Test the quota status.
6. Run a generation with a valid client IP.
7. Verify that exactly three recipes are written under `/code-a-cuisine/recipes`.
8. Test Cookbook and Recipe Detail against Firebase.
9. Verify the favorite increment.
10. Verify ingredient-catalog usage updates.
11. Test the daily quota and the controlled 429 response.

## Expected Error Paths

- Invalid request → 400
- IP/global quota reached → 429
- Firebase quota failure → 503 + email
- Gemini provider failure → controlled 5xx response + log/email
- Invalid AI output → 422 + log/email
- Firebase persistence failure → controlled 5xx response + log/email
- Firebase library failure → controlled 5xx response + log/email

## Code Check

```bash
npm run lint
npm test -- --watch=false
npm run build
```
