# Moabit Finder

## Environment Variables
Create a `.env` file in `backend/` or configure these variables in your deployment environment:

```
DATABASE_URI=<mongo_connection_string>
PAYLOAD_SECRET=<jwt_secret>
PORT=3000

# For development
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:5173

# Email config (for later)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=Moabit Finder Team
CONTACT_RECIPIENT_EMAILS=info@moafinder.de
EVENT_APPROVAL_NOTIFICATION_EMAILS=team@moafinder.de
```

`DATABASE_URI` should point to the MongoDB instance you want to use. Any operations run against the backend will write directly to this database, so consider using a test database for local development.

## Local Development
1. **Install dependencies**
   ```
   pnpm install
   ```
2. **Run the backend**
   ```
   cd backend
   pnpm dev
   ```
3. **Run the frontend**
   ```
   pnpm --dir frontend dev
   ```

## Testing
Backend tests require a running MongoDB and the env variables above:
```bash
DATABASE_URI=<mongo_connection_string> PAYLOAD_SECRET=<jwt_secret> pnpm test
```

Frontend tests can be run with:
```bash
pnpm --dir frontend test
```

## Code Quality
Generate types and run lint checks:
```bash
pnpm run generate:types
pnpm lint
```

## Deploying to AWS

### Prerequisites
- AWS CLI v2 installed locally and configured with credentials that can access Amplify, ECR and App Runner (`aws configure`).
- Docker installed locally and logged in to the daemon.
- MongoDB connection string available for `DATABASE_URI`.

### 1. Frontend (AWS Amplify)
The Amplify app is already connected to your repository and available at <https://main.d1i5ilm5fqb0i9.amplifyapp.com/>.

1. In the Amplify console open **App settings → Environment variables** and provide any frontend variables you need (for example `VITE_API_BASE_URL` if you introduce one later).
2. Add a rewrite so the static site can talk to the backend: **App settings → Rewrites and redirects** → add

   | Source | Target | Type |
   |--------|--------|------|
   | `/api/<*>` | `https://<app-runner-domain>/api/<*>` | 200 (Rewrite) |

   Replace `<app-runner-domain>` with the URL created in step 2 below once the backend is online.

Amplify rebuilds automatically whenever you push to the connected Git branch.

### 2. Backend (AWS App Runner)
Build the Docker image locally and push it to ECR. Replace `<ACCOUNT_ID>` and `<REGION>` with your AWS account and region. If you already created the repository, reuse the URI `913283587816.dkr.ecr.eu-central-1.amazonaws.com/moabit-backend`.

```bash
cd backend
pnpm install
pnpm run build
docker build -t moabit-backend .

REPO_URI=913283587816.dkr.ecr.eu-central-1.amazonaws.com/moabit-backend
aws ecr get-login-password --region eu-central-1 \
  | docker login --username AWS --password-stdin ${REPO_URI%/*}
docker tag moabit-backend:latest $REPO_URI:latest
docker push $REPO_URI:latest
```

Create or update the App Runner service:

1. AWS console → **App Runner → Create service** (or **Deploy latest image** if it already exists).
2. Select the container image you pushed to ECR and set **Port** to `3000`.
3. Configure environment variables:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URI` | MongoDB connection string |
   | `PAYLOAD_SECRET` | Secret used for Payload auth cookies |
   | `PORT` | `3000` |
   | `PAYLOAD_PUBLIC_SERVER_URL` | `https://<app-runner-domain>` |
   | `CORS_ORIGINS` | `https://main.d1i5ilm5fqb0i9.amplifyapp.com` (add other origins separated by commas) |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | SMTP credentials |
   | `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME` | Sender shown in emails |
   | `CONTACT_RECIPIENT_EMAILS` | Address that should receive contact form messages |
   | `EVENT_APPROVAL_NOTIFICATION_EMAILS` | Distribution list for event approval notifications |

4. Deploy and copy the generated App Runner domain (e.g. `https://xxxxxx.eu-central-1.awsapprunner.com`). Use it in the Amplify rewrite rule and as `PAYLOAD_PUBLIC_SERVER_URL`.

### 3. Verify routing between frontend and backend
1. Update the Amplify rewrite rule to use the App Runner URL and redeploy if necessary.
2. Visit <https://main.d1i5ilm5fqb0i9.amplifyapp.com/> and open the browser Network tab.
3. Trigger API calls (e.g. load the events list or submit the contact form). Responses should come from the App Runner domain and set cookies successfully.
4. Check the App Runner logs for any backend errors or missing environment variables.

### 4. Future deployments
- **Frontend:** push to the connected Git branch; Amplify will rebuild automatically.
- **Backend:** build and push a new Docker image, then redeploy App Runner. The sequence can be automated, but the manual commands are:

  ```bash
  cd backend
  pnpm install
  pnpm run build
  docker build -t moabit-backend .
  docker tag moabit-backend:latest $REPO_URI:latest
  docker push $REPO_URI:latest
  aws apprunner update-service \
    --service-arn <service-arn> \
    --source-configuration ImageRepository="{ImageIdentifier='$REPO_URI:latest',ImageRepositoryType='ECR'}"
  ```

Keep your `.env` file aligned with the environment variables configured in AWS to mirror production locally.
