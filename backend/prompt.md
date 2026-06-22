# Backend scaffold — completed

Phase B foundation is in place. See [README.md](./README.md) for run instructions.

Initial setup (already done):

```bash
npm init -y
npm install express cors helmet dotenv @supabase/supabase-js @aws-sdk/client-s3 @aws-sdk/s3-request-presigner zod express-rate-limit
npm install -D typescript @types/node @types/express @types/cors ts-node nodemon
```

Then: `cp .env.example .env`, fill Supabase keys, `npm run dev`.
