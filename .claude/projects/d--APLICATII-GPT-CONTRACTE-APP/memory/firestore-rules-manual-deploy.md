---
name: firestore-rules-manual-deploy
description: Firestore security rules are deployed manually, not via CI
metadata:
  type: project
---

Firestore rules live in `firestore.rules` (versioned, wired in `firebase.json`) but are deployed **manually** with `firebase deploy --only firestore:rules`, NOT in CI.

**Why:** the GitHub Actions service account (created by `firebase init hosting:github`) has Firebase Hosting permissions only; a CI rules deploy would fail on IAM. User explicitly chose the manual path (option A) over granting broader IAM.

**How to apply:** do not add a Firestore-rules step to any workflow. When rules change, remind the user to run `firebase deploy --only firestore:rules` locally. The active rule is auth-only (`request.auth != null`) for all collections. See also [[user-frontend-uiux]].
