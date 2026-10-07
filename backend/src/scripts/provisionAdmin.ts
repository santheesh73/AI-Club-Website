/**
 * AI CLUB - Administrative Account Provisioning Utility
 *
 * Secure server-side provisioning for the authoritative admin account:
 * santheesh651@gmail.com
 *
 * Usage:
 *   npx ts-node src/scripts/provisionAdmin.ts [optional-password]
 */

import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../services/supabase';
import { AUTHORIZED_ADMIN_EMAIL, normalizeEmail } from '../middleware/auth';
import { logger } from '../utils/logger';

async function provisionAdminAccount() {
  if (!supabaseAdmin) {
    console.error('ERROR: Supabase service role client is not configured. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const targetEmail = normalizeEmail(AUTHORIZED_ADMIN_EMAIL);
  const password = process.argv[2] || process.env.ADMIN_INITIAL_PASSWORD || 'AiClubAdmin2026!Secure';

  console.log(`[PROVISION] Checking existence of authoritative admin account: ${targetEmail}...`);

  try {
    // 1. List users from Supabase Auth admin API
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      throw new Error(`Failed to query Supabase Auth users: ${listError.message}`);
    }

    let adminUser = listData.users.find((u) => normalizeEmail(u.email) === targetEmail);

    if (!adminUser) {
      console.log(`[PROVISION] Creating user in Supabase Auth...`);
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: targetEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: 'AI CLUB Administrator',
          role: 'admin',
        },
        app_metadata: {
          role: 'admin',
        },
      });

      if (createError || !createData.user) {
        throw new Error(`Failed to create Supabase Auth user: ${createError?.message}`);
      }

      adminUser = createData.user;
      console.log(`[PROVISION] Auth user created successfully with ID: ${adminUser.id}`);
    } else {
      console.log(`[PROVISION] Found existing Auth user ID: ${adminUser.id}. Updating metadata...`);
      // Update app metadata and password if requested
      await supabaseAdmin.auth.admin.updateUserById(adminUser.id, {
        app_metadata: { role: 'admin' },
        user_metadata: { ...adminUser.user_metadata, role: 'admin' },
        email_confirm: true,
      });
    }

    // 2. Upsert profile in PostgreSQL public.profiles with role = 'admin'
    console.log(`[PROVISION] Syncing public.profiles table...`);
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: adminUser.id,
          email: targetEmail,
          full_name: 'AI CLUB Administrator',
          role: 'admin',
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (profileError) {
      throw new Error(`Failed to upsert profiles row: ${profileError.message}`);
    }

    console.log(`[PROVISION] Profile verified in PostgreSQL:`, {
      id: profileData.id,
      email: profileData.email,
      role: profileData.role,
    });

    console.log(`[PROVISION] ✅ SUCCESS: ${targetEmail} is fully provisioned with admin role.`);
    process.exit(0);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Admin provisioning failed', { error: msg });
    console.error(`[PROVISION] ❌ FAILED: ${msg}`);
    process.exit(1);
  }
}

provisionAdminAccount();
