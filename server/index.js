import 'dotenv/config';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Admin from './models/Admin.js';
import SiteContent from './models/SiteContent.js';
import { requireAuth } from './auth.js';
import defaultContent from '../shared/defaultContent.js';
import {
  createMailbox,
  deleteMailbox,
  listMailboxes,
  mailSettings,
  updateMailboxPassword,
  updateMailboxStatus,
} from './mailDb.js';

const app = express();
const port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mygm_group';
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distPath = path.join(projectRoot, 'dist');

app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
  }),
);
app.use(express.json({ limit: '1mb' }));

function databaseIsReady() {
  return mongoose.connection.readyState === 1;
}

async function ensureAdminAccount() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '');

  if (!email || !password || password.startsWith('REPLACE_WITH_')) {
    console.warn('ADMIN_EMAIL or ADMIN_PASSWORD is not configured; admin login is not seeded.');
    return;
  }

  const existing = await Admin.findOne({ email });
  const passwordHash = await bcrypt.hash(password, 12);

  if (!existing) {
    await Admin.create({ email, passwordHash });
    console.log('Initial admin account created for:', email);
    return;
  }

  const passwordMatches = await bcrypt.compare(password, existing.passwordHash);
  if (!passwordMatches) {
    existing.passwordHash = passwordHash;
    await existing.save();
    console.log('Admin password synchronized from environment for:', email);
  }
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    database: databaseIsReady() ? 'connected' : 'disconnected',
  });
});

app.get('/api/site-content', async (req, res) => {
  if (!databaseIsReady()) {
    return res.json(defaultContent);
  }

  try {
    const record = await SiteContent.findOne({ key: 'main' }).lean();
    if (!record) {
      await SiteContent.create({ key: 'main', data: defaultContent });
      return res.json(defaultContent);
    }
    return res.json(record.data);
  } catch (error) {
    console.error('Could not read site content:', error.message);
    return res.json(defaultContent);
  }
});

app.post('/api/auth/login', async (req, res) => {
  if (!databaseIsReady()) {
    return res.status(503).json({ message: 'Database is not connected.' });
  }

  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const admin = await Admin.findOne({ email });
    const matches = admin ? await bcrypt.compare(password, admin.passwordHash) : false;

    if (!matches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: admin._id.toString(), email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    return res.json({ token, admin: { email: admin.email } });
  } catch (error) {
    console.error('Admin login failed:', error.message);
    return res.status(500).json({ message: 'Login failed.' });
  }
});

app.get('/api/admin/site-content', requireAuth, async (req, res) => {
  try {
    const record = await SiteContent.findOne({ key: 'main' }).lean();
    return res.json(record?.data || defaultContent);
  } catch (error) {
    console.error('Could not read admin content:', error.message);
    return res.status(500).json({ message: 'Could not load site content.' });
  }
});

app.put('/api/admin/site-content', requireAuth, async (req, res) => {
  if (!req.body || Array.isArray(req.body) || typeof req.body !== 'object') {
    return res.status(400).json({ message: 'Content must be a JSON object.' });
  }

  try {
    const record = await SiteContent.findOneAndUpdate(
      { key: 'main' },
      { key: 'main', data: req.body },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();

    return res.json(record.data);
  } catch (error) {
    console.error('Could not save site content:', error.message);
    return res.status(500).json({ message: 'Could not save site content.' });
  }
});

app.post('/api/admin/site-content/reset', requireAuth, async (req, res) => {
  try {
    const record = await SiteContent.findOneAndUpdate(
      { key: 'main' },
      { key: 'main', data: defaultContent },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();

    return res.json(record.data);
  } catch (error) {
    console.error('Could not reset site content:', error.message);
    return res.status(500).json({ message: 'Could not reset site content.' });
  }
});

function mailErrorResponse(res, error) {
  const status = error.code === 'MAIL_DB_UNAVAILABLE' ? 503 : 400;
  return res.status(status).json({ message: error.message });
}

app.get('/api/admin/mail-settings', requireAuth, (req, res) => {
  return res.json(mailSettings());
});

app.get('/api/admin/mailboxes', requireAuth, (req, res) => {
  try {
    return res.json({ settings: mailSettings(), mailboxes: listMailboxes() });
  } catch (error) {
    return mailErrorResponse(res, error);
  }
});

app.post('/api/admin/mailboxes', requireAuth, async (req, res) => {
  try {
    const mailbox = await createMailbox(req.body || {});
    return res.status(201).json({ mailbox, message: 'Mailbox created successfully.' });
  } catch (error) {
    return mailErrorResponse(res, error);
  }
});

app.patch('/api/admin/mailboxes/:email/password', requireAuth, async (req, res) => {
  try {
    await updateMailboxPassword(decodeURIComponent(req.params.email), req.body?.password);
    return res.json({ message: 'Mailbox password updated.' });
  } catch (error) {
    return mailErrorResponse(res, error);
  }
});

app.patch('/api/admin/mailboxes/:email/status', requireAuth, (req, res) => {
  try {
    updateMailboxStatus(decodeURIComponent(req.params.email), Boolean(req.body?.active));
    return res.json({ message: 'Mailbox status updated.' });
  } catch (error) {
    return mailErrorResponse(res, error);
  }
});

app.delete('/api/admin/mailboxes/:email', requireAuth, (req, res) => {
  try {
    deleteMailbox(decodeURIComponent(req.params.email));
    return res.json({ message: 'Mailbox removed from the mail database.' });
  } catch (error) {
    return mailErrorResponse(res, error);
  }
});

if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    return next();
  });
}

mongoose.set('strictQuery', true);
mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log('MongoDB connected.');
    try {
      await ensureAdminAccount();
    } catch (error) {
      console.error('Could not initialize admin account:', error.message);
    }
  })
  .catch((error) => {
    console.warn('MongoDB is not connected:', error.message);
    console.warn('The public site will use default content until MongoDB is available.');
  });

app.listen(port, () => {
  console.log('MYGM API running on http://localhost:' + port);
});
