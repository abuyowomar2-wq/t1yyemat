// ينشئ حسابات المشرفين في Supabase Auth دفعة وحدة.
//
// الاستخدام:
//   1) انسخ scripts/admins.example.json إلى scripts/admins.local.json
//      وعبّي بيانات الحسابات (هذا الملف مستثنى من git تلقائيًا).
//   2) npm run create-admins
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "لازم تشغّل هذا السكربت مع NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY " +
      "في البيئة (مثلاً: node --env-file=.env.local scripts/create-admins.mjs)."
  );
  process.exit(1);
}

const adminsFile = join(__dirname, "admins.local.json");
let admins;
try {
  // Strip a possible UTF-8 BOM — common when the file is saved from
  // Windows editors (Notepad, PowerShell's default encoding, ...).
  const raw = readFileSync(adminsFile, "utf-8").replace(/^﻿/, "");
  admins = JSON.parse(raw);
} catch {
  console.error(
    `ما لقيت ${adminsFile}.\n` +
      "انسخ scripts/admins.example.json إلى scripts/admins.local.json وعبّي بيانات الحسابات."
  );
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

for (const admin of admins) {
  const { error } = await supabaseAdmin.auth.admin.createUser({
    email: admin.email,
    password: admin.password,
    email_confirm: true,
    user_metadata: { full_name: admin.full_name },
  });

  if (error) {
    console.error(`❌ ${admin.email}: ${error.message}`);
  } else {
    console.log(`✅ تم إنشاء ${admin.full_name} (${admin.email})`);
  }
}
