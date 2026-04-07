# Controller Doc Update Checklist

Use this checklist whenever editing any controller.

1. Controller file changed? If yes, identify matching file in `memory-bank/apidocs`.
2. Verify each endpoint section reflects:
   - HTTP method
   - path
   - request body/query params
   - security requirement
   - expected response shape
3. Update cURL examples if path/body/header changed.
4. Update use/use-case text if business behavior changed.
5. Add/update entry in `memory-bank/changes-log.md`.

Completion rule: A controller code change is not complete until its API doc is updated.
