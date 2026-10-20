# CareerBot — Latest Fix

## Project Ideas duplicate fix
The Project Ideas page had two competing render paths: its page-level renderer and the global `script.js` Supabase integration. The global integration is now the backend render path, and it filters by the authenticated user and selected career.

Supabase project rows are also deduplicated by normalized project title before HTML rendering. This prevents repeated projects when older assessment runs have created duplicate rows.

## Expected Software Developer project titles
- Personal Portfolio Website
- Task Management App
- Expense Tracker
- Weather Application
- E-Commerce Website
- Career Recommendation System

## Security
The frontend uses the Supabase publishable key only. No service-role key is included.

## Testing performed
- Verified the project ZIP extracts successfully.
- Verified `project-ideas.html` has one projects container.
- Verified `script.js` has one `loadProjects()` path for the page.
- Added authenticated-user filtering and title deduplication.
- JavaScript syntax is checked before delivery.
