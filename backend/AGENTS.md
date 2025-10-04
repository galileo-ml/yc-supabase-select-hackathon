# Repository Guidelines

## Scope of Work
All contributor activity is limited to the `backend/` directory. Treat every other path in this repository as read-only until explicit guidance is issued. When planning new features or fixes, confirm they can be delivered exclusively within `backend/` before starting implementation, and raise an issue if that constraint cannot be met.

## Change Boundaries
Do not create, edit, rename, or delete files outside `backend/`. If a change appears to require touching another directory, halt and document the dependency in your issue or pull request for review. Avoid symlinks or scripts that would indirectly modify files beyond the approved area, including git hooks or generated assets.

## Workflow Expectations
Branch from the latest main, implement changes solely under `backend/`, and run any local scripts or tests from that location. Commits should make it obvious that only backend assets were affected—for example, reference specific subpaths in the commit body when helpful. Before pushing, inspect your staged diff (`git status`, `git diff --stat`) to confirm compliance.

## Pull Request Checklist
Before opening a PR, verify your diff is confined to `backend/`, include a brief note confirming no other folders were touched, and flag any blocked work that would require broader access. Reviewers will decline PRs that modify files outside the permitted scope, so call out deliberate omissions or future follow-ups.

## Communication & Escalation
Use project discussions or issues to request exceptions, clarifications, or broader access. Document any discovered blockers that stem from the backend-only policy so the team can evaluate next steps. Until an explicit approval is recorded, assume the restriction remains in effect for all contributors.
