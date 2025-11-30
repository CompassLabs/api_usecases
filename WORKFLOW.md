# Workflow: Working with api_usecases in mono repo

This folder contains a clone of the public [CompassLabs/api_usecases](https://github.com/CompassLabs/api_usecases) repository.

## Setup

The `api_usecases` folder is:
- ✅ Cloned from the public repo
- ✅ Has its own git history (separate from mono repo)
- ✅ Ignored by mono repo's `.gitignore` (won't be committed to mono)
- ✅ Can be worked on independently

## Workflow: Adding New Use Cases

### 1. Create a Branch in api_usecases

```bash
cd api_usecases
git checkout -b feature/new-use-case
```

### 2. Create Your Use Case

Add your code following the existing structure:

```
api_usecases/
  v2/
    your_use_case/
      typescript/
        src/
          index.ts
        package.json
      python/
        main.py
        pyproject.toml
```

**Important:** Add snippet markers in your code:

**TypeScript:**
```typescript
// SNIPPET START 1
import { CompassClient } from '@compass-labs/api-sdk';
// ... your code ...
// SNIPPET END 1
```

**Python:**
```python
# SNIPPET START 1
from compass_api_sdk import CompassClient
# ... your code ...
# SNIPPET END 1
```

### 3. Test Your Code

Make sure your use case works before proceeding.

### 4. Commit and Push to Public Repo

```bash
cd api_usecases
git add .
git commit -m "Add new use case: your-use-case"
git push origin feature/new-use-case
```

Then create a PR in the public repo: https://github.com/CompassLabs/api_usecases

### 5. Create Docs Page in mono Repo

Once your code is merged to `main` in the public repo:

1. Create a new `.mdx` file in `api_docs/v2/examples/your-use-case.mdx`
2. Use `GithubCodeBlock` to reference your code (see `api_docs/USE_CASES_GUIDE.md`)
3. Add the page to `api_docs/docs.json` navigation
4. Commit and push to mono repo

## Updating api_usecases

To pull latest changes from the public repo:

```bash
cd api_usecases
git checkout main
git pull origin main
```

## Current Structure

- `v0/` - Version 0 examples
- `v1/` - Version 1 examples (basic_examples, pendle, aave_looping, transaction_bundler)
- `v2/` - Version 2 examples
- `wallet-earn/` - Wallet earn demo

## Notes

- The `api_usecases` folder is **not** tracked by the mono repo
- All changes to use cases should be committed to the public repo
- Docs pages in `api_docs/` reference code via GitHub raw URLs
- Always use snippet markers for code sections you want to show in docs

