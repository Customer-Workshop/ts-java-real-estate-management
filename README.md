[![GitHub Repo stars](https://img.shields.io/github/stars/eevan7a9/real-estate-management?style=social)](https://github.com/eevan7a9/real-estate-management/stargazers)
[![License](https://img.shields.io/badge/License-Apache_License_2.0-blue.svg)](LICENSE)


# real-estate-management

A web and mobile property management solution built with Ionic, Angular and Nodejs Fastify.
Designed for managing residential, commercial, and land properties the app allows users to explore available estates via an interactive map and directly send inquiries to property owners.


🚧 **frontend/** work in progress 🚧.

🚧 **backend-fastify/** work in progress 🚧.

### **[LIVE WEB PREVIEW](https://real-estate-management.netlify.app/)**

# 🎨 Themes
## 📱 Android (Pixel 7)
<p float="left">
  <img src="./screenshots/mobile-light.webp" width="200" style="margin-right: 20px;"/>
  <img src="./screenshots/mobile-dark.webp" width="200"/>
</p>

## 💻 Desktop Browser
### ☀️ Light Theme

<p float="left">
  <img src="./screenshots/map-light.webp" width="350" style="margin-right:8px" />
  <img src="./screenshots/list-light.webp" width="350" style="margin-right:8px" />
  <img src="./screenshots/detail-light.webp" width="350" />
</p>

### 🌙 Dark Theme

<p float="left">
  <img src="./screenshots/map-dark.webp" width="350" style="margin-right:8px" />
  <img src="./screenshots/list-dark.webp" width="350" style="margin-right:8px" />
  <img src="./screenshots/detail-dark.webp" width="350" />
</p>


# **🗃️ Dependencies**

### **Frontend**
- [Ionic 8+](https://ionicframework.com/)
- [Angular 19+](https://angular.io/)
- [tailwindcss 4+](https://tailwindcss.com/)
- [leaflet 1.7+](https://leafletjs.com/)
- [chartjs 3.5+](https://www.chartjs.org/)

### **Backend**
- [Node](https://nodejs.org/en/)
- [fastify 4+](https://www.fastify.io/)
- [mongoDB](https://www.mongodb.com/)

# **🧑‍💻 SETUP**

## **Frontend web setup**

### **1.1 navigate to `frontend/` directory.**

```
#  navigate to frontend 
$ cd frontend
```

### **1.2 Fill the desired environment variables:**  
- navigate to `frontend/src/environments`
- set values to variables (ex. api.url) 
```
  api: {
    server: 'http://localhost:8000/', <-- server URL
    mapKey: '', <-- Leaflet map key,
    googleAuthClientId: '', <-- google Auth CLient ID for Social signin
    webSocketUrl: 'ws://localhost:8000/websocket' <-- websocket URL
  }
```

### **2. then install dependencies & run ionic serve**

In terminal - command
```
# install dependencies
$ npm install

# serve frontend
$ ionic serve
```

Tailwindcss Build Styles
```
# Build to Generate styles
$ npm run tailwind:build

# Build to Generate styles & Watch
$ npm run tailwind:watch
```
## **📱 Android setup**

sync any chages from web to android:
```
npx cap sync android
```

If Android is not available **(Optional)**
```
npx cap add android
```

run to open Android Studio
```
npx cap open android
```

To run the project on Emulator or Device **(Alternative)**
```
npx cap run android
```

<br>

## **Backend-Fastify setup**
### **1.1 navigate to `backend-fastify/` directory.**
```
cd backend-fastify/
```
### **1.2 create `.env` file & add variables:**
- copy `.env.example` & re-name it to `.env`
- set your desired variable value
```
PORT=8000
LOGGER=true
SALT=12
SECRET_KEY='secret'
DB_CONNECT=mongodb://localhost:27017/rem-db
```
### **2. then install dependencies & run dev**

In terminal - command
```
#  navigate to backend-fastify 
$ cd backend-fastify

# install dependencies
$ npm install

# start server
$ npm start `or` $ npm run dev

```

### **2.1 Database seeder(optional)**
- Make sure `.env` is configured & dependencies are installed
- Will populate database with dummy data.

⚠️ This will delete existing records in the database document. 

⚠️ Make a backup if needed
```
$ npm run db:seeder
```

dummy user:
```
  fullName: "test tester",
  email: "test@email.com",
  password: "password"

  You can use this to signin.
```
## Routes
```
/docs/
/users/
/auth/
/properties/
/enquiries/
```

# **🔄 CI / CD**

## Continuous integration — `.github/workflows/ci.yml`

Runs on pushes to `main`/`master`, on every pull request, and on manual dispatch.
A `dorny/paths-filter` job decides which side of the repo needs to run, so a
frontend-only change skips the backend suite and vice versa. The aggregate
`CI status` job always runs and treats skipped jobs as success — make that the
single required status check in branch protection.

| Job | What it does |
| --- | --- |
| `Frontend (lint)` | `npm run lint` (Angular ESLint) |
| `Frontend (typecheck)` | `npm run typecheck` (`tsc -p tsconfig.app.json --noEmit`) |
| `Frontend (test)` | `npm run test:ci` — Karma/Jasmine in headless Chrome with coverage, uploaded as `frontend-coverage` |
| `Frontend (build)` | `npm run build:prod` — production Angular build, uploaded as `frontend-dist` |
| `Backend` | `npm run lint`, `npm test` (Node test runner against a `mongo:7` service container) and a boot/HTTP smoke check |
| `Dependency audit` | `npm audit --audit-level=high` per workspace, advisory only |
| `Dependency review` | `actions/dependency-review-action` on pull requests, fails on new high-severity dependencies |
| `CI status` | Aggregate gate for branch protection |

Notes:

- Node version comes from `.nvmrc`; npm caching is keyed per workspace lockfile.
- `Frontend (test)` is currently non-blocking: three specs import
  `src/app/shared/directives/custom-validators.directive`, which was deleted in
  commit `8009526`, and `src/test.ts` still imports `zone.js/dist/zone-testing`
  (removed in zone.js 0.15). Fix those and drop the `continue-on-error` flag.
- `Dependency audit` is advisory-only because both workspaces already carry known
  high/critical transitive advisories; results are written to the job summary.
- `Dependency review` is also non-blocking today: GitHub's Dependency graph is
  disabled for this repository, so the action cannot run. Enable it under
  Settings → Code security and drop the step's `continue-on-error`.

## Continuous deployment — `.github/workflows/cd.yml`

**This pipeline is a mocked demo. Every AWS identifier in it is a placeholder
and no step touches real infrastructure.**

Flow: build the frontend and backend container images (real `docker build`,
artifacts only) → deploy job bound to a GitHub environment → push to Amazon ECR
→ roll ECS services → optional S3 + CloudFront publish of the static Angular
bundle. An EKS variant is included as commented reference commands.

Three independent guards keep it inert:

1. `workflow_dispatch` only — it never triggers on push or merge.
2. The `dry_run` input defaults to `true`; a dry run prints the AWS commands.
3. Even with `dry_run=false`, the run stays in dry-run mode unless the
   repository variable `ALLOW_REAL_DEPLOY` is `true`.

Mocked placeholder values (in the workflow `env:` block):

| Key | Placeholder |
| --- | --- |
| `AWS_ACCOUNT_ID` / `ECR_REGISTRY` | `123456789012` / `123456789012.dkr.ecr.us-east-1.amazonaws.com` |
| `AWS_REGION` | `us-east-1` |
| `ECR_REPOSITORY_FRONTEND` / `_BACKEND` | `demo-real-estate/frontend` / `demo-real-estate/backend` |
| `ECS_CLUSTER` / services | `demo-real-estate-cluster` / `demo-real-estate-frontend`, `demo-real-estate-backend` |
| `K8S_NAMESPACE` | `demo-real-estate` |
| `OIDC_ROLE_ARN` | `arn:aws:iam::123456789012:role/demo-real-estate-github-deploy` |
| `STATIC_BUCKET` / `CLOUDFRONT_DISTRIBUTION_ID` | `s3://demo-real-estate-web` / `E123456789ABCD` |

### Required configuration for a real deployment

No repository *secrets* are needed — authentication uses GitHub OIDC
(`permissions: id-token: write`) via `aws-actions/configure-aws-credentials`.

| Type | Name | Purpose |
| --- | --- | --- |
| Repository variable | `ALLOW_REAL_DEPLOY` | Must be `true` to leave dry-run mode |
| Environment | `staging` | Auto-deploy target |
| Environment | `production` | Configure required reviewers so promotion needs approval |
| AWS IAM role | replaces `OIDC_ROLE_ARN` | Trust policy for `token.actions.githubusercontent.com`, scoped to this repo; permissions for ECR push, `ecs:UpdateService`, and (optional) S3 + CloudFront |

Replace the `env:` placeholders with real account, region, repository, cluster
and distribution values before enabling `ALLOW_REAL_DEPLOY`.

## Container images

- `frontend/Dockerfile` — Node 22 build of the production Angular bundle, served
  by nginx (`frontend/nginx.conf`, SPA fallback to `index.html`), port 80.
- `backend-fastify/Dockerfile` — Node 22 runtime, non-root, port 8000,
  configured through the environment variables in `.env.example`.

```
docker build -t rem-frontend frontend
docker build -t rem-backend backend-fastify
```

## Dependency updates

`.github/dependabot.yml` schedules weekly updates for npm (`frontend/` and
`backend-fastify/`, with Angular/Ionic/Fastify update groups), GitHub Actions,
and the Dockerfile base images.
