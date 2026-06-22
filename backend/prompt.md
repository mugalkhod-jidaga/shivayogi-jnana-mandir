# 1. Create the backend folder and move into it
mkdir backend
cd backend

# 2. Initialize the package.json
npm init -y

# 3. Install core production dependencies
npm install express cors helmet dotenv @supabase/supabase-js @aws-sdk/client-s3 @aws-sdk/s3-request-presigner zod express-rate-limit

# 4. Install development dependencies (TypeScript types and tools)
npm install -D typescript @types/node @types/express @types/cors ts-node nodemon

# 5. Initialize the TypeScript configuration file (tsconfig.json)
npx tsc --init