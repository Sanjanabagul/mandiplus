import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { config } from '../config/env.js';
import { User } from '../models/User.js';

export const seedAdmin = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const email = (config.adminEmail || 'admin@mandiplus.com').trim().toLowerCase();
    const initialPassword = config.adminInitialPassword || 'Password123!';

    console.log(`[SeedAdmin] Checking administrator provisioning for: ${email}...`);

    const existingUser = await User.findOne({
      $or: [{ email }, { normalizedEmail: email }]
    });

    if (existingUser) {
      if (existingUser.role !== 'admin') {
        throw new Error(
          `Security Conflict: An account with email '${email}' already exists with role '${existingUser.role}'. Ordinary accounts cannot be automatically promoted to admin.`
        );
      }

      // Ensure active flags are preserved
      let modified = false;
      if (existingUser.approvalStatus !== 'not_required') {
        existingUser.approvalStatus = 'not_required';
        modified = true;
      }
      if (!existingUser.isActive) {
        existingUser.isActive = true;
        modified = true;
      }
      if (existingUser.status !== 'active') {
        existingUser.status = 'active';
        modified = true;
      }
      if (modified) {
        await existingUser.save();
        console.log(`[SeedAdmin] Existing admin account state confirmed active.`);
      } else {
        console.log(`[SeedAdmin] Admin account is already provisioned and active.`);
      }
      return existingUser;
    }

    // Create new admin user (pre-save hook hashes password and sets normalizedEmail)
    const adminUser = await User.create({
      name: 'Mandi+ Administrator',
      email,
      normalizedEmail: email,
      password: initialPassword,
      phone: '+91 99999 88888',
      role: 'admin',
      businessName: 'Mandi+ Central Operations',
      locality: 'Mumbai HQ',
      status: 'active',
      approvalStatus: 'not_required',
      isActive: true
    });

    console.log(`[SeedAdmin] Administrator provisioned successfully with email: ${email} ✅`);
    return adminUser;
  } catch (err) {
    console.error('[SeedAdmin] Failed to provision administrator:', err.message);
    throw err;
  }
};

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('seedAdmin.js')) {
  seedAdmin()
    .then(() => disconnectDB())
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
