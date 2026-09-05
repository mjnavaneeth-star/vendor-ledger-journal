# Production Directives Security Workbench

A production-grade web application built to enforce OWASP Top 10 Web and LLM standards, structured agentic threat modeling across 5 threat zones, Google Cloud Secret Manager integration, zero-crash database persistence, and resilient Gemini AI model fallback ladders.

---

## 1. Prerequisites & Environment Setup

1. **Install Google Cloud SDK and Firebase CLI**:
```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Install Firebase CLI
npm install -g firebase-tools
```

2. **Authenticate and set your active Google Cloud project**:
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

3. **Enable required Google Cloud APIs**:
```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com
```

---

## 2. Secret Management Setup (Zero-Hardcoding Hygiene)

Per **Production Directive 4**, all operational credentials must be stored in Google Cloud Secret Manager and injected at runtime. Hardcoded credentials are strictly prohibited.

1. **Create and populate the `GEMINI_API_KEY` secret**:
```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
```

2. **Grant the default Cloud Run runtime service account permission to read the secret**:
```bash
# Retrieve your project number
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

# Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Database Security Configuration (Secure Firestore Rules)

Per **Production Directive 3**, never output `allow read, write: if true;`. All collections enforce owner-bound path checking and authenticated state integrity.

Deploy the following `firestore.rules` configuration:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Owner-bound user interaction isolation
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Role-based administrative access control lookup
    match /system/audit_logs/{logId} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if false; // Server-side admin SDK write only
    }

    // Explicit default denial
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Deploy with Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Cloud Run Deployment Flow

Deploy the containerized service directly to Google Cloud Run:

```bash
# Build and deploy container to Cloud Run
gcloud run deploy production-security-workbench \
  --source=. \
  --platform=managed \
  --region=asia-east1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --set-env-vars="NODE_ENV=production"
```

---

## 5. Required Campaign Labeling (Verification Binding)

To satisfy the mandatory challenge verification requirement, register the service by applying the resource label:

```bash
gcloud run services update production-security-workbench \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-east1
```

---

## 6. Architecture & Resilient Gemini Fallback Ladder

This application implements the 4-tier model fallback ladder:
1. **Primary**: `gemini-3.6-flash`
2. **High-Availability Fallback**: `gemini-3.1-flash-lite`
3. **Dynamic Alias**: `gemini-flash-latest`
4. **Deep Reasoning Fallback**: `gemini-3.7-flash`

Status codes `503 UNAVAILABLE`, `429 RESOURCE_EXHAUSTED`, `404 NOT_FOUND`, and `500 INTERNAL` trigger automatic recovery to the subsequent tier without terminating user sessions.
