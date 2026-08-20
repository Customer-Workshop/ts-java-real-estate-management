# CI/CD

Two GitHub Actions pipelines cover this repository:

| Workflow | File | Trigger |
| --- | --- | --- |
| CI | `.github/workflows/ci.yml` | push to `main`, every pull request |
| CD | `.github/workflows/cd.yml` | push to `main`, `workflow_dispatch` with an `environment` input |

Both use concurrency groups, npm caching (`actions/setup-node`), least-privilege
`permissions:` and actions pinned to commit SHAs (with the version in a trailing
comment) so Dependabot can bump them safely.

## Stack

Despite the repository name there is no Java/Maven service: the app is an
Angular 19 / Ionic frontend (`frontend/`) and a Fastify + MongoDB/Mongoose
backend (`backend-fastify/`). The only Gradle surface is the Capacitor Android
wrapper in `frontend/android`, which CI does not build.

## CI jobs

- **validate** — frontend `npm run typecheck` (`tsc -p tsconfig.app.json --noEmit`),
  `npm ci` in both packages (lockfile drift check) and `node --check` over every
  backend module. There is no Prettier/format config in the repo, so the parse
  check is the backend's format-gate stand-in.
- **frontend** (matrix: `lint`, `test`, `build`) — `ng lint`, headless Karma via
  the `ChromeHeadlessCI` launcher (`--no-sandbox`), and a production `ng build`.
  Coverage (`frontend/coverage/`) and the built bundle (`frontend/www/`) are
  uploaded as artifacts.
- **backend** — ESLint (flat config) plus `node --test` unit and integration
  tests running against a `mongo:7` service container; a JUnit XML report is
  uploaded as an artifact.
- **docker** — builds both container images with Buildx (never pushes).
- **actionlint** — lints the workflow files themselves.

### Known-broken check

`frontend` / `test` runs with `continue-on-error` because the specs are broken in
the baseline repository, independently of CI:

- three specs import `src/app/shared/directives/custom-validators.directive`,
  which does not exist (the helper lives at `src/app/shared/validators/custom.validator.ts`);
- `src/test.ts` imports `zone.js/dist/zone-testing`, a path zone.js 0.15 no
  longer exports;
- `@types/jasmine` is not installed, so every spec fails to typecheck.

Fix those, then remove `soft_fail: true` from the `test` matrix entry in
`ci.yml` (it drives `continue-on-error` on the run step) to make the check
blocking.

## CD pipeline

`build-images` → `deploy-staging` → `deploy-production`.

Images are built for both components, tagged `<sha7>` and `latest`, pushed to
Amazon ECR, and each environment is rolled out with
`aws ecs update-service --force-new-deployment` followed by
`aws ecs wait services-stable` and an HTTP smoke check. Credentials come from
GitHub OIDC role assumption (`aws-actions/configure-aws-credentials` with
`id-token: write`) — there are no long-lived AWS keys anywhere in the pipeline.

The manual approval gate is the `production` GitHub Environment: add required
reviewers under *Settings → Environments → production*. `deploy-production`
never runs before `deploy-staging` succeeds.

### Everything AWS here is mocked

This is a demo repository. All AWS identifiers are fake defaults supplied via
Actions variables, and the guard variable `DEPLOY_ENABLED` (default `false`)
makes every real call a no-op:

- `docker/build-push-action` runs with `push: ${{ env.DEPLOY_ENABLED == 'true' }}`,
  so images are built but never pushed;
- `configure-aws-credentials` and `amazon-ecr-login` are skipped entirely;
- ECS deploy and smoke-check steps print the exact command they *would* run.

| Variable (Actions *variable*) | Mock default |
| --- | --- |
| `DEPLOY_ENABLED` | `false` (guard — set to `true` only with real infrastructure) |
| `AWS_REGION` | `us-east-1` |
| `AWS_ACCOUNT_ID` | `123456789012` |
| `ECR_REGISTRY` | `123456789012.dkr.ecr.us-east-1.amazonaws.com` |
| `ECR_REPOSITORY_FRONTEND` / `ECR_REPOSITORY_BACKEND` | `demo/rem-frontend` / `demo/rem-backend` |
| `AWS_OIDC_ROLE_ARN` | `arn:aws:iam::123456789012:role/demo-github-oidc-deploy` |
| `AWS_OIDC_ROLE_ARN_STAGING` | `arn:aws:iam::123456789012:role/demo-staging-github-oidc-deploy` |
| `AWS_OIDC_ROLE_ARN_PRODUCTION` | `arn:aws:iam::123456789012:role/demo-prod-github-oidc-deploy` |
| `ECS_CLUSTER_STAGING` / `ECS_CLUSTER_PRODUCTION` | `demo-staging-cluster` / `demo-prod-cluster` |
| `ECS_SERVICE_FRONTEND_STAGING` / `ECS_SERVICE_BACKEND_STAGING` | `demo-staging-rem-frontend` / `demo-staging-rem-backend` |
| `ECS_SERVICE_FRONTEND_PRODUCTION` / `ECS_SERVICE_BACKEND_PRODUCTION` | `demo-prod-rem-frontend` / `demo-prod-rem-backend` |
| `K8S_NAMESPACE_STAGING` / `K8S_NAMESPACE_PRODUCTION` | `demo-staging` / `demo-prod` (EKS variant) |
| `STAGING_HEALTHCHECK_URL` / `PRODUCTION_HEALTHCHECK_URL` | `https://rem-staging.demo.invalid/healthz` / `https://rem.demo.invalid/healthz` |
| `PRODUCTION_URL` | `https://rem.demo.invalid` |

No repository **secrets** are required: OIDC replaces access keys. Application
runtime configuration (`DB_CONNECT`, `SECRET_KEY`, …) belongs in the ECS task
definition / SSM Parameter Store, not in Actions secrets.

### Swapping mock → real

1. Create the ECR repositories and the ECS clusters/services (or the EKS
   namespaces) in the target account.
2. Create an IAM role trusting `token.actions.githubusercontent.com`, scoped to
   this repository, with permissions for `ecr:*` (push) and
   `ecs:UpdateService`/`ecs:DescribeServices`.
3. Set the Actions variables in the table above to the real values.
4. Configure the `staging` and `production` GitHub Environments (reviewers,
   branch restrictions).
5. Set `DEPLOY_ENABLED=true` last — until then the pipeline stays in dry-run.

## Container images

- `frontend/Dockerfile` — Node build stage (`npm run build:prod`) then
  `nginx:1.27-alpine` serving `www/` with an SPA fallback (`frontend/nginx.conf`,
  health endpoint at `/healthz`).
- `backend-fastify/Dockerfile` — `node:22-alpine`, production-only deps,
  runs as the non-root `node` user on port 8000.

## Running the same checks locally

```bash
# frontend
cd frontend && npm ci
npm run lint && npm run typecheck && npm run build:prod
CHROME_BIN=$(which google-chrome) npm run test:ci   # currently fails, see above

# backend (needs MongoDB)
docker run -d --name rem-mongo -p 27017:27017 mongo:7
cd backend-fastify && npm ci
npm run lint
DB_CONNECT=mongodb://127.0.0.1:27017/rem-db-test npm test
```
