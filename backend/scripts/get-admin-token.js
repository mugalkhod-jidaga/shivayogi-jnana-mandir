// scripts/get-admin-token.js

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      phone: process.env.BOOTSTRAP_ADMIN_PHONE,
      password: process.env.BOOTSTRAP_ADMIN_PASSWORD,
    });

    if (error) throw error;

    const token = data.session.access_token;

    const outputPath = path.join(__dirname, "../admin-token.txt");
    fs.writeFileSync(outputPath, token);

    console.log("✅ Admin token generated");
    console.log(`📄 Saved to: ${outputPath}`);
  } catch (err) {
    console.error("❌ Failed to generate token");
    console.error(err);
    process.exit(1);
  }
})();