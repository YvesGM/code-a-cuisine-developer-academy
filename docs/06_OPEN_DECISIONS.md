# 06 – Open Decisions

There are no open architecture decisions for the current submission state.

## Final Decisions

- Firebase Realtime Database is the only persistent database.
- Angular communicates exclusively with n8n.
- External requests belong in Angular services, not UI components.
- There is no additional repository, provider, or InjectionToken layer.
- Page components live under `src/app/components/`, each in its own folder.
- Reusable UI components live under `src/app/shared/`.
- Existing Figma styling and responsive behavior remain unchanged unless a task explicitly concerns UI.
- n8n workflows handle validation, Gemini requests, Firebase access, quota handling, and technical error handling.

## Finalization

The main flow was verified again after the Firebase-only refactor. No additional architecture extensions are planned for the Academy submission.
