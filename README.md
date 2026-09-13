# Abouna Q&A

A Q&A site where community members anonymously ask a priest a question, and priests answer,
categorize, and optionally publish it. See `prisma/schema.prisma` for the data model.

## Stack

- **Next.js (App Router)** on Node — deployed to **Azure App Service (Linux)**
- **PostgreSQL** (Azure Database for PostgreSQL Flexible Server in prod) via **Prisma**
- **iron-session** for encrypted-cookie priest sessions, backed by a `PriestSession` DB row for revocation
- **Azure Communication Services Email** for invite, magic-link, and answered-notification emails

## Local setup

1. Copy `.env.example` to `.env` and fill in real values (a local/dev Postgres connection string is
   enough to start; email sending needs a real Azure Communication Services resource — see below).
2. Install dependencies:
   ```
   npm install --legacy-peer-deps
   ```
   (`--legacy-peer-deps` works around a known npm/Next 16 peer-dependency resolution bug.)
3. Apply the database schema:
   ```
   npx prisma migrate deploy
   ```
   The first migration (`prisma/migrations/20260101000000_init`) includes a hand-added generated
   `tsvector` column + GIN index for full-text search — Prisma can't model that natively.
4. Seed the first admin priest account (reads `ADMIN_SEED_EMAIL` / `ADMIN_SEED_NAME` from `.env`):
   ```
   npx prisma db seed
   ```
5. Run the dev server:
   ```
   npm run dev
   ```
6. Sign in as the seeded admin at `/priest/sign-in` — this sends a real email via ACS, so
   `ACS_CONNECTION_STRING` / `EMAIL_FROM_ADDRESS` must point at a working Azure Communication
   Services Email resource even in local dev (use a test mailbox you control).

Every priest account after the first is created via `/admin/invite` (admin-only), which emails a
one-time invite link — there is no public sign-up.

## Environment variables

See `.env.example` for the full list: `DATABASE_URL`, `ACS_CONNECTION_STRING`,
`EMAIL_FROM_ADDRESS`, `SESSION_SECRET` (32+ random bytes), `PUBLIC_BASE_URL`, and the
seed-only `ADMIN_SEED_EMAIL` / `ADMIN_SEED_NAME`.

## Azure Setup

One-time provisioning for a real environment, using the tiers picked for "designing for growth
without overpaying before there's real traffic" — Basic/Burstable to start, each resizable later
via a tier change, not a rebuild. Requires the [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli)
(`az login` first) and, for the GitHub Actions steps, the [GitHub CLI](https://cli.github.com/) or
repo admin access to set secrets manually.

Pick names/values for the placeholders once and reuse them throughout:

```bash
RESOURCE_GROUP="abouna-qa-rg"
LOCATION="eastus"
DB_SERVER_NAME="abouna-qa-db"           # must be globally unique
DB_ADMIN_USER="aboudadmin"
DB_NAME="abouna_qa"
WEBAPP_NAME="abouna-qa"                 # must match AZURE_WEBAPP_NAME in .github/workflows/deploy.yml
APP_SERVICE_PLAN="abouna-qa-plan"
ACS_NAME="abouna-qa-acs"
EMAIL_SERVICE_NAME="abouna-qa-email"
KEYVAULT_NAME="abouna-qa-kv"            # must be globally unique
APPINSIGHTS_NAME="abouna-qa-insights"
GITHUB_REPO="your-org/abouna-qa"        # owner/repo, for the OIDC federated credential
```

### 1. Resource group

```bash
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
```

### 2. Database — Postgres Flexible Server (Burstable B2s)

```bash
az postgres flexible-server create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$DB_SERVER_NAME" \
  --location "$LOCATION" \
  --admin-user "$DB_ADMIN_USER" \
  --admin-password "$(openssl rand -base64 24)" \
  --sku-name Standard_B2s \
  --tier Burstable \
  --storage-size 32 \
  --storage-auto-grow Enabled \
  --version 16 \
  --public-access AzureServices \
  --backup-retention 7

az postgres flexible-server db create \
  --resource-group "$RESOURCE_GROUP" \
  --server-name "$DB_SERVER_NAME" \
  --database-name "$DB_NAME"
```

Save the generated admin password — `az postgres flexible-server create` prints it once. Build
`DATABASE_URL` from it:

```
postgresql://<admin-user>:<password>@<DB_SERVER_NAME>.postgres.database.azure.com:5432/<DB_NAME>?sslmode=require
```

`--public-access AzureServices` is the minimum needed for the App Service (and GitHub Actions'
migration step) to reach it; tighten this to a VNet integration later if you outgrow public access.

### 3. App hosting — App Service (Linux, B2)

```bash
az appservice plan create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_SERVICE_PLAN" \
  --is-linux \
  --sku B2

az webapp create \
  --resource-group "$RESOURCE_GROUP" \
  --plan "$APP_SERVICE_PLAN" \
  --name "$WEBAPP_NAME" \
  --runtime "NODE:22-lts"

az webapp identity assign \
  --resource-group "$RESOURCE_GROUP" \
  --name "$WEBAPP_NAME"
```

`$WEBAPP_NAME` must match `AZURE_WEBAPP_NAME` in `.github/workflows/deploy.yml` (it's currently
set to `"abouna-qa"`) — update the workflow if you pick a different name. The managed identity
enabled above is what lets the app read secrets from Key Vault without a stored credential.

### 4. Email — Azure Communication Services

```bash
az communication create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$ACS_NAME" \
  --location Global \
  --data-location UnitedStates

az communication email create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$EMAIL_SERVICE_NAME" \
  --location Global \
  --data-location UnitedStates

# Provision the free Azure-managed sending subdomain (zero DNS setup)
az communication email domain create \
  --resource-group "$RESOURCE_GROUP" \
  --email-service-name "$EMAIL_SERVICE_NAME" \
  --domain-name AzureManagedDomain \
  --domain-management AzureManaged

# Link the managed domain to the ACS resource, then fetch the connection string
az communication update \
  --resource-group "$RESOURCE_GROUP" \
  --name "$ACS_NAME" \
  --linked-domains "<resource-id-of-the-domain-from-the-previous-command>"

az communication list-key \
  --resource-group "$RESOURCE_GROUP" \
  --name "$ACS_NAME"
```

The `list-key` output's connection string is `ACS_CONNECTION_STRING`. `EMAIL_FROM_ADDRESS` is the
sender shown on the managed domain resource, of the form `DoNotReply@<guid>.azurecomm.net` — check
the domain resource in the portal (or `az communication email domain show`) for the exact address.
Before public launch, replace `AzureManagedDomain` with a verified custom domain (adds SPF/DKIM/DMARC
DNS records) for better deliverability — see the ACS docs for that flow when you get there.

### 5. Secrets — Key Vault

```bash
az keyvault create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$KEYVAULT_NAME" \
  --location "$LOCATION"

az keyvault secret set --vault-name "$KEYVAULT_NAME" --name "DATABASE-URL" --value "<the DATABASE_URL built in step 2>"
az keyvault secret set --vault-name "$KEYVAULT_NAME" --name "ACS-CONNECTION-STRING" --value "<the connection string from step 4>"
az keyvault secret set --vault-name "$KEYVAULT_NAME" --name "SESSION-SECRET" --value "$(openssl rand -base64 32)"

# Let the Web App's managed identity read secrets
PRINCIPAL_ID=$(az webapp identity show --resource-group "$RESOURCE_GROUP" --name "$WEBAPP_NAME" --query principalId -o tsv)
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee "$PRINCIPAL_ID" \
  --scope "$(az keyvault show --name "$KEYVAULT_NAME" --query id -o tsv)"

# Wire the app's env vars: secrets as Key Vault references, the rest as plain values
az webapp config appsettings set --resource-group "$RESOURCE_GROUP" --name "$WEBAPP_NAME" --settings \
  DATABASE_URL="@Microsoft.KeyVault(SecretUri=$(az keyvault secret show --vault-name "$KEYVAULT_NAME" --name DATABASE-URL --query id -o tsv))" \
  ACS_CONNECTION_STRING="@Microsoft.KeyVault(SecretUri=$(az keyvault secret show --vault-name "$KEYVAULT_NAME" --name ACS-CONNECTION-STRING --query id -o tsv))" \
  SESSION_SECRET="@Microsoft.KeyVault(SecretUri=$(az keyvault secret show --vault-name "$KEYVAULT_NAME" --name SESSION-SECRET --query id -o tsv))" \
  EMAIL_FROM_ADDRESS="<from step 4>" \
  PUBLIC_BASE_URL="https://$WEBAPP_NAME.azurewebsites.net" \
  NODE_ENV="production"
```

### 6. Monitoring — Application Insights

```bash
az monitor app-insights component create \
  --resource-group "$RESOURCE_GROUP" \
  --app "$APPINSIGHTS_NAME" \
  --location "$LOCATION" \
  --workspace "$(az monitor log-analytics workspace create --resource-group "$RESOURCE_GROUP" --workspace-name "$APPINSIGHTS_NAME-logs" --query id -o tsv)"

az webapp config appsettings set --resource-group "$RESOURCE_GROUP" --name "$WEBAPP_NAME" --settings \
  APPLICATIONINSIGHTS_CONNECTION_STRING="$(az monitor app-insights component show --resource-group "$RESOURCE_GROUP" --app "$APPINSIGHTS_NAME" --query connectionString -o tsv)"
```

### 7. GitHub Actions OIDC (for `.github/workflows/deploy.yml`)

```bash
APP_ID=$(az ad app create --display-name "abouna-qa-github-deploy" --query appId -o tsv)
az ad sp create --id "$APP_ID"

# Federated credential scoped to pushes on main
az ad app federated-credential create --id "$APP_ID" --parameters '{
  "name": "abouna-qa-main-branch",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:'"$GITHUB_REPO"':ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}'

# The workflow also gates on a "production" GitHub Environment — add a matching credential for it
az ad app federated-credential create --id "$APP_ID" --parameters '{
  "name": "abouna-qa-production-environment",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:'"$GITHUB_REPO"':environment:production",
  "audiences": ["api://AzureADTokenExchange"]
}'

az role assignment create \
  --assignee "$APP_ID" \
  --role "Contributor" \
  --scope "$(az group show --name "$RESOURCE_GROUP" --query id -o tsv)"
```

Then set these as GitHub secrets (repo Settings → Secrets and variables → Actions, or `gh secret set`):

| Secret | Value |
|---|---|
| `AZURE_CLIENT_ID` | `$APP_ID` from above |
| `AZURE_TENANT_ID` | `az account show --query tenantId -o tsv` |
| `AZURE_SUBSCRIPTION_ID` | `az account show --query id -o tsv` |
| `DATABASE_URL` | same value as the Key Vault `DATABASE-URL` secret (step 5) — used directly by the workflow's `prisma migrate deploy` step, separate from the Key Vault copy the running app reads |

### Verification

`az postgres flexible-server show --name "$DB_SERVER_NAME" --resource-group "$RESOURCE_GROUP"` and
`az webapp show --name "$WEBAPP_NAME" --resource-group "$RESOURCE_GROUP"` should both come back
`Succeeded`/`Running`. Once you push to `main`, the rest of the checks (Key Vault references
resolving, Application Insights receiving traces, the email flows working end-to-end) are covered
by the "After deploying to Azure" list under Deploying below.

## Deploying

`.github/workflows/deploy.yml` builds, runs `prisma migrate deploy`, and deploys to Azure App
Service on push to `main` via OIDC (no publish-profile secret). It expects these GitHub secrets:
`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `DATABASE_URL`. In Azure itself,
`DATABASE_URL`, `ACS_CONNECTION_STRING`, and `SESSION_SECRET` should be stored in Key Vault and
referenced from the App Service's Application Settings, not set as plain values.
