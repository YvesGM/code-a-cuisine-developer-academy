# Code-a-Cuisine: Mandatory Working Rules

- Existing-system-first: understand the existing components, services, data contracts, and n8n flows before changing them.
- Identify the root cause before making changes; modify the existing owner instead of introducing parallel solutions.
- Keep Angular intentionally simple: components for UI, services for state and external communication, models for types, and guards for navigation.
- Do not add architecture or abstraction layers without a concrete need.
- External communication belongs exclusively in Angular services, never in components.
- Persistent data belongs exclusively in Firebase Realtime Database and is read or written server-side through n8n only.
- Never add Firebase service credentials, AI secrets, or SMTP secrets to the Angular bundle or repository.
- n8n is the frontend's only backend gateway and validates requests again on the server side.
- Do not change established Figma or responsive styling as a side effect. Touch HTML/SCSS only when the task explicitly concerns UI.
- Keep custom domain functions and methods short and focused; target a maximum of 14 lines per function body.
- Use complete JSDoc for custom domain functions, methods, and central classes. Include `@param`, `@returns`, and `@throws` where applicable.
- Keep handwritten application files focused and easy to understand.
- After changes, run TypeScript/lint checks, existing tests, and the production build.
- Keep text files in UTF-8 and verify special characters after changes.
