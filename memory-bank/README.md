# Memory Bank

This folder is the persistent project memory for this repository.

## Workflow Rule
1. Before making any code change, read:
   - `memory-bank/project-details.md`
   - `memory-bank/changes-log.md`
   - `memory-bank/apidocs/README.md` (if controller/API work is involved)
2. After making any code change, update:
   - `memory-bank/changes-log.md` (append a new dated entry)
   - `memory-bank/project-details.md` (if architecture, config, endpoints, or behavior changed)
   - `memory-bank/apidocs/<ControllerName>API.md` (mandatory when controller endpoints/behavior change)

## Purpose
- Keep project context in one place.
- Track all changes made over time.
- Reduce context loss across sessions.
