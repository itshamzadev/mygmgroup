import { useEffect, useState } from 'react';

function request(url, token, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
      ...(options.headers || {}),
    },
  });
}

async function responseData(response) {
  const body = await response.text();

  try {
    return body ? JSON.parse(body) : {};
  } catch {
    throw new Error(
      'Express backend is not running or the mail API is not deployed. Start npm run server and refresh.',
    );
  }
}

function MailInput({ label, value, onChange, type = 'text', hint }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export default function MailAccountsPanel({ token }) {
  const [settings, setSettings] = useState({
    domain: 'mygmgroup.com',
    webmailUrl: 'https://mail.mygmgroup.com',
    configured: false,
  });
  const [mailboxes, setMailboxes] = useState([]);
  const [localPart, setLocalPart] = useState('');
  const [password, setPassword] = useState('');
  const [quota, setQuota] = useState('10240');
  const [editingEmail, setEditingEmail] = useState('');
  const [editingPassword, setEditingPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadMailboxes = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await request('/api/admin/mailboxes', token);
      const data = await responseData(response);
      if (!response.ok) throw new Error(data.message || 'Could not load mailboxes.');
      setSettings(data.settings);
      setMailboxes(data.mailboxes);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMailboxes();
  }, [token]);

  const createMailbox = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const response = await request('/api/admin/mailboxes', token, {
        method: 'POST',
        body: JSON.stringify({ localPart, password, quota: Number(quota) }),
      });
      const data = await responseData(response);
      if (!response.ok) throw new Error(data.message || 'Could not create mailbox.');

      setLocalPart('');
      setPassword('');
      setMessage(data.message);
      await loadMailboxes();
    } catch (createError) {
      setError(createError.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleMailbox = async (mailbox) => {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const response = await request(
        '/api/admin/mailboxes/' + encodeURIComponent(mailbox.email) + '/status',
        token,
        { method: 'PATCH', body: JSON.stringify({ active: !mailbox.active }) },
      );
      const data = await responseData(response);
      if (!response.ok) throw new Error(data.message || 'Could not update mailbox.');
      setMessage(data.message);
      await loadMailboxes();
    } catch (toggleError) {
      setError(toggleError.message);
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const response = await request(
        '/api/admin/mailboxes/' + encodeURIComponent(editingEmail) + '/password',
        token,
        { method: 'PATCH', body: JSON.stringify({ password: editingPassword }) },
      );
      const data = await responseData(response);
      if (!response.ok) throw new Error(data.message || 'Could not update password.');
      setEditingEmail('');
      setEditingPassword('');
      setMessage(data.message);
    } catch (passwordError) {
      setError(passwordError.message);
    } finally {
      setBusy(false);
    }
  };

  const removeMailbox = async (mailbox) => {
    if (!window.confirm('Remove ' + mailbox.email + ' from the mail server?')) return;

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const response = await request(
        '/api/admin/mailboxes/' + encodeURIComponent(mailbox.email),
        token,
        { method: 'DELETE' },
      );
      const data = await responseData(response);
      if (!response.ok) throw new Error(data.message || 'Could not remove mailbox.');
      setMessage(data.message);
      await loadMailboxes();
    } catch (removeError) {
      setError(removeError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mail-manager">
      <div className={['mail-server-banner', settings.configured ? 'mail-server-ready' : 'mail-server-offline'].join(' ')}>
        <span className="mail-server-status-dot" />
        <div>
          <strong>{settings.configured ? 'Mail server connected' : 'Mail server connector is not available here'}</strong>
          <p>{settings.configured ? 'New accounts will be created in the existing Postfix/Dovecot database.' : 'This works on the Ubuntu mail server where /www/vmail/postfixadmin.db exists.'}</p>
        </div>
        <a className="admin-secondary-button" href={settings.webmailUrl} target="_blank" rel="noreferrer">Open webmail</a>
      </div>

      <div className="mail-manager-grid">
        <form className="mail-create-card" onSubmit={createMailbox}>
          <div className="mail-card-heading">
            <div>
              <h3>Create new mailbox</h3>
              <p>Account will be created on the <strong>{settings.domain}</strong> domain.</p>
            </div>
            <span className="mail-card-icon"><i className="fa fa-plus" /></span>
          </div>
          <div className="mail-address-input">
            <MailInput label="Mailbox name" value={localPart} onChange={setLocalPart} hint="Example: info, admin or sales" />
            <span className="mail-domain-suffix">@{settings.domain}</span>
          </div>
          <MailInput label="Password" value={password} onChange={setPassword} type="password" hint="Minimum 8 characters" />
          <MailInput label="Quota value" value={quota} onChange={setQuota} type="number" hint="Use 0 for unlimited. Existing server format is used." />
          <button className="admin-button admin-full-button" type="submit" disabled={busy || !settings.configured}>
            {busy ? 'Creating...' : 'Create mailbox'}
          </button>
        </form>

        <div className="mail-list-card">
          <div className="mail-card-heading">
            <div>
              <h3>Existing mailboxes</h3>
              <p>{mailboxes.length} account{mailboxes.length === 1 ? '' : 's'} on this domain.</p>
            </div>
            <span className="mail-count-badge">{mailboxes.length}</span>
          </div>
          {loading ? (
            <p className="mail-empty-state">Loading mailboxes...</p>
          ) : mailboxes.length === 0 ? (
            <p className="mail-empty-state">No mailboxes found for {settings.domain}.</p>
          ) : (
            <div className="mailbox-list">
              {mailboxes.map((mailbox) => (
                <div className="mailbox-row" key={mailbox.email}>
                  <div className="mailbox-main">
                    <span className="mailbox-avatar"><i className="fa fa-envelope" /></span>
                    <div>
                      <strong>{mailbox.email}</strong>
                      <small>{mailbox.active ? 'Active' : 'Disabled'} · Quota {mailbox.quota}</small>
                    </div>
                  </div>
                  <div className="mailbox-actions">
                    {editingEmail === mailbox.email ? (
                      <div className="mailbox-password-edit">
                        <input type="password" placeholder="New password" value={editingPassword} onChange={(event) => setEditingPassword(event.target.value)} />
                        <button className="mail-action-button mail-action-save" type="button" onClick={savePassword} disabled={busy}>Save</button>
                        <button className="mail-action-button" type="button" onClick={() => setEditingEmail('')}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        <button className="mail-action-button" type="button" onClick={() => toggleMailbox(mailbox)} disabled={busy}>{mailbox.active ? 'Disable' : 'Enable'}</button>
                        <button className="mail-action-button" type="button" onClick={() => setEditingEmail(mailbox.email)}>Password</button>
                        <button className="mail-action-button mail-action-danger" type="button" onClick={() => removeMailbox(mailbox)} disabled={busy}>Delete</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {error && <p className="admin-error mail-message">{error}</p>}
      {message && <p className="admin-success mail-message">{message}</p>}
    </div>
  );
}
