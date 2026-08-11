import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Admin from './models/Admin.js';

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mygm_group';
const email = String(process.env.ADMIN_EMAIL || 'admin@mygmgroup.com').trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || 'ChangeMe@12345');

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set. Add it to your .env file before using the admin panel.');
}

try {
  await mongoose.connect(mongoUri);
  const passwordHash = await bcrypt.hash(password, 12);
  await Admin.findOneAndUpdate(
    { email },
    { email, passwordHash },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  console.log('Admin account is ready for:', email);
} catch (error) {
  console.error('Could not seed admin:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
