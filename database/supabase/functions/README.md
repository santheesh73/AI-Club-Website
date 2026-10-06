# Supabase Functions Strategy

This directory is designated for serverless Edge Functions (Deno / TypeScript) when edge computation is appropriate (e.g. webhook listeners, lightweight push proxies).

## Guidelines
- Core authoritative business logic belongs in the backend service or PostgreSQL stored procedures/triggers.
- Edge functions should remain stateless and verify JWT bearer tokens.
