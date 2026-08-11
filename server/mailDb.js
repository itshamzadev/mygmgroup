import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import Database from 'better-sqlite3';

const execFileAsync = promisify(execFile);
const dbPath = process.env.MAIL_DB_PATH || '/www/vmail/postfixadmin.db';
const mailDomain = (process.env.MAIL_DOMAIN || 'mygmgroup.com').trim().toLowerCase();
const webmailUrl = process.env.WEBMAIL_URL || 'https://mail.mygmgroup.com';

function configuredDatabase() {
  if (!existsSync(dbPath)) {
    const error = new Error('Mail database is not available at ' + dbPath);
    error.code = 'MAIL_DB_UNAVAILABLE';
    throw error;
  }
}

function openDatabase() {
  configuredDatabase();
  const db = new Database(dbPath);
  db.pragma('busy_timeout = 5000');
  return db;
}

function localPartIsValid(localPart) {
  return /^[a-z0-9][a-z0-9._-]{0,63}$/i.test(localPart);
}

async function hashPassword(password) {
  const result = await execFileAsync(
    'doveadm',
    ['pw', '-s', 'MD5-CRYPT', '-p', password],
    { maxBuffer: 1024 * 1024 },
  );
  const hash = result.stdout.trim().split(/\r?\n/).pop();
  if (!hash) throw new Error('Dovecot could not create the password hash.');
  return hash;
}

export function mailSettings() {
  return {
    domain: mailDomain,
    webmailUrl,
    databasePath: dbPath,
    configured: existsSync(dbPath),
  };
}

export function listMailboxes() {
  const db = openDatabase();
  try {
    return db
      .prepare(
        'SELECT username, maildir, quota, active FROM mailbox WHERE username LIKE ? ORDER BY username ASC',
      )
      .all('%@' + mailDomain)
      .map((mailbox) => ({
        email: mailbox.username,
        maildir: mailbox.maildir,
        quota: mailbox.quota,
        active: Boolean(mailbox.active),
      }));
  } finally {
    db.close();
  }
}

export async function createMailbox({ localPart, password, quota = 10240 }) {
  const normalizedLocalPart = String(localPart || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');
  const numericQuota = Number(quota);

  if (!localPartIsValid(normalizedLocalPart)) {
    throw new Error('Use only letters, numbers, dots, underscores and hyphens in the mailbox name.');
  }
  if (normalizedPassword.length < 8) {
    throw new Error('Mailbox password must be at least 8 characters.');
  }
  if (!Number.isInteger(numericQuota) || numericQuota < 0) {
    throw new Error('Quota must be a positive whole number or 0.');
  }

  const username = normalizedLocalPart + '@' + mailDomain;
  const maildir = mailDomain + '/' + normalizedLocalPart + '/';
  const passwordHash = await hashPassword(normalizedPassword);
  const db = openDatabase();

  try {
    const existing = db.prepare('SELECT username FROM mailbox WHERE username = ?').get(username);
    if (existing) throw new Error('This mailbox already exists.');

    const transaction = db.transaction(() => {
      db.prepare(
        'INSERT INTO domain (domain, active) VALUES (?, 1) ON CONFLICT(domain) DO UPDATE SET active = 1',
      ).run(mailDomain);
      db.prepare(
        'INSERT INTO mailbox (username, password, maildir, quota, active) VALUES (?, ?, ?, ?, 1)',
      ).run(username, passwordHash, maildir, numericQuota);
    });
    transaction();
  } finally {
    db.close();
  }

  return { email: username, maildir, quota: numericQuota, active: true };
}

export async function updateMailboxPassword(email, password) {
  const normalizedPassword = String(password || '');
  if (normalizedPassword.length < 8) {
    throw new Error('Mailbox password must be at least 8 characters.');
  }

  const passwordHash = await hashPassword(normalizedPassword);
  const db = openDatabase();
  try {
    const result = db.prepare(
      'UPDATE mailbox SET password = ? WHERE username = ? AND username LIKE ?',
    ).run(passwordHash, email, '%@' + mailDomain);
    if (!result.changes) throw new Error('Mailbox not found.');
  } finally {
    db.close();
  }
}

export function updateMailboxStatus(email, active) {
  const db = openDatabase();
  try {
    const result = db.prepare(
      'UPDATE mailbox SET active = ? WHERE username = ? AND username LIKE ?',
    ).run(active ? 1 : 0, email, '%@' + mailDomain);
    if (!result.changes) throw new Error('Mailbox not found.');
  } finally {
    db.close();
  }
}

export function deleteMailbox(email) {
  const db = openDatabase();
  try {
    const result = db.prepare(
      'DELETE FROM mailbox WHERE username = ? AND username LIKE ?',
    ).run(email, '%@' + mailDomain);
    if (!result.changes) throw new Error('Mailbox not found.');
  } finally {
    db.close();
  }
}
