import { connectDB } from '../src/lib/mongodb';
import { hashPassword } from '../src/lib/auth';
import { User } from '../src/models/User';

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] ?? email?.split('@')[0] ?? 'Admin';
  const role = (process.argv[5] as 'admin' | 'staff') ?? 'admin';

  if (!email || !password) {
    console.error('Usage: npm run create-user -- <email> <password> [name] [admin|staff]');
    process.exit(1);
  }

  await connectDB();
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    existing.passwordHash = await hashPassword(password);
    if (name) existing.name = name;
    if (role) existing.role = role;
    await existing.save();
    console.log(`Updated existing user: ${email} (role: ${existing.role})`);
  } else {
    await User.create({ name, email: email.toLowerCase(), passwordHash: await hashPassword(password), role });
    console.log(`Created user: ${email} / ${password} (role: ${role})`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
