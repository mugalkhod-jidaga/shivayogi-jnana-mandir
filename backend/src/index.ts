import './types/express';
import 'dotenv/config';

import { env } from './config/env';
import { app } from './app';

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`API listening on port ${env.PORT} (${env.NODE_ENV})`);
});
