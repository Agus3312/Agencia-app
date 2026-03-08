---
description: Push all changes to GitHub so Railway and Netlify redeploy automatically
---

// turbo-all

1. Stage all changes:
```
git add .
```

2. Commit with a descriptive message (use the context to describe what changed):
```
git commit -m "Deploy: [describe changes here]"
```

3. Push to main branch:
```
git push origin main
```

4. Confirm success by reporting the output of the push command to the user, and let them know Railway (backend) and Netlify (frontend) will automatically redeploy in about 1-2 minutes.
