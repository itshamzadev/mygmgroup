import { useEffect, useState } from 'react';
import defaultContent from '../shared/defaultContent.js';
import './admin.css';
import MailAccountsPanel from './MailAccountsPanel.jsx';

const tokenKey = 'mygm_admin_token';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function apiRequest(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
}

function Field({ label, value, onChange, type = 'text', multiline = false, hint }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
      )}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function EditorSection({ id, title, description, children }) {
  return (
    <section className="admin-section" id={id}>
      <div className="admin-section-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function ItemActions({ onRemove }) {
  return (
    <button className="admin-remove-button" type="button" onClick={onRemove}>
      Remove
    </button>
  );
}

export default function AdminPanel() {
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey) || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [content, setContent] = useState(clone(defaultContent));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const logout = () => {
    localStorage.removeItem(tokenKey);
    setToken('');
    setMessage('');
  };

  const setPath = (path, value) => {
    setContent((current) => {
      const next = clone(current);
      let target = next;
      path.slice(0, -1).forEach((part) => {
        target = target[part];
      });
      target[path[path.length - 1]] = value;
      return next;
    });
  };

  const setListItem = (listName, index, key, value) => {
    setContent((current) => {
      const next = clone(current);
      next[listName][index][key] = value;
      return next;
    });
  };

  const addListItem = (listName, item) => {
    setContent((current) => ({
      ...clone(current),
      [listName]: [...current[listName], item],
    }));
  };

  const removeListItem = (listName, index) => {
    setContent((current) => ({
      ...clone(current),
      [listName]: current[listName].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const setContactListItem = (listName, index, value) => {
    setContent((current) => {
      const next = clone(current);
      next.contact[listName][index] = value;
      return next;
    });
  };

  const addContactListItem = (listName) => {
    setContent((current) => ({
      ...clone(current),
      contact: {
        ...current.contact,
        [listName]: [...current.contact[listName], ''],
      },
    }));
  };

  const removeContactListItem = (listName, index) => {
    setContent((current) => ({
      ...clone(current),
      contact: {
        ...current.contact,
        [listName]: current.contact[listName].filter((_, itemIndex) => itemIndex !== index),
      },
    }));
  };

  const loadContent = async (authToken) => {
    setBusy(true);
    setError('');

    try {
      const response = await apiRequest('/api/admin/site-content', {
        headers: { Authorization: 'Bearer ' + authToken },
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) logout();
        throw new Error(data.message || 'Could not load website content.');
      }

      setContent(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (token) loadContent(token);
  }, [token]);

  const login = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Login failed.');

      localStorage.setItem(tokenKey, data.token);
      setToken(data.token);
      setPassword('');
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setBusy(false);
    }
  };

  const saveContent = async () => {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const response = await apiRequest('/api/admin/site-content', {
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + token },
        body: JSON.stringify(content),
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) logout();
        throw new Error(data.message || 'Could not save website content.');
      }

      setContent(data);
      setMessage('Changes saved successfully. Public website is updated.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  };

  const resetContent = async () => {
    if (!window.confirm('Reset all website content to the original defaults?')) return;

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const response = await apiRequest('/api/admin/site-content/reset', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Could not reset website content.');

      setContent(data);
      setMessage('Default content restored.');
    } catch (resetError) {
      setError(resetError.message);
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <main className="admin-shell admin-login-shell">
        <section className="admin-login-card">
          <p className="admin-eyebrow">MYGM GROUP</p>
          <h1>Admin Panel</h1>
          <p className="admin-muted">Manage your website content from one simple dashboard.</p>
          <form onSubmit={login}>
            <Field label="Email" value={email} onChange={setEmail} type="email" />
            <Field label="Password" value={password} onChange={setPassword} type="password" />
            {error && <p className="admin-error">{error}</p>}
            <button className="admin-button admin-full-button" type="submit" disabled={busy}>
              {busy ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <a className="admin-back-link" href="/">Back to website</a>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <section className="admin-editor-card">
        <div className="admin-header">
          <div>
            <p className="admin-eyebrow">MYGM GROUP</p>
            <h1>Website Manager</h1>
            <p className="admin-muted">Update your website without touching code.</p>
          </div>
          <div className="admin-actions">
            <a className="admin-secondary-button" href="/">View website</a>
            <button className="admin-secondary-button" type="button" onClick={logout}>Logout</button>
          </div>
        </div>

        <div className="admin-summary-grid">
          <div className="admin-summary-card">
            <span className="admin-summary-icon"><i className="fa fa-chart-line" /></span>
            <div><strong>{content.stats.length}</strong><span>Statistics</span></div>
          </div>
          <div className="admin-summary-card">
            <span className="admin-summary-icon"><i className="fa fa-tools" /></span>
            <div><strong>{content.services.length}</strong><span>Services</span></div>
          </div>
          <div className="admin-summary-card">
            <span className="admin-summary-icon"><i className="fa fa-users" /></span>
            <div><strong>{content.owners.length}</strong><span>Team members</span></div>
          </div>
          <div className="admin-summary-card">
            <span className="admin-summary-icon"><i className="fa fa-phone-alt" /></span>
            <div><strong>{content.contact.whatsappNumbers.length}</strong><span>WhatsApp contacts</span></div>
          </div>
        </div>

        <div className="admin-dashboard-body">
          <aside className="admin-sidebar">
            <p className="admin-sidebar-label">CONTENT MENU</p>
            {[
              ['mail-accounts', 'Email accounts', 'fa-envelope'],
              ['basic-info', 'Basic information', 'fa-building'],
              ['social-links', 'Social links', 'fa-share-alt'],
              ['office-info', 'Office information', 'fa-map-marker-alt'],
              ['hero-slides', 'Hero slides', 'fa-images'],
              ['features', 'Why choose us', 'fa-star'],
              ['statistics', 'Statistics', 'fa-chart-line'],
              ['services', 'Services', 'fa-tools'],
              ['owners', 'Owners and team', 'fa-users'],
              ['contact-page', 'Contact page', 'fa-phone-alt'],
            ].map(([id, label, icon]) => (
              <a key={id} href={'#' + id} className="admin-sidebar-link">
                <i className={'fa ' + icon} />
                <span>{label}</span>
              </a>
            ))}
          </aside>

          <div className="admin-content-column">
        <EditorSection id="mail-accounts" title="Email accounts" description="Create and manage real mailboxes on your Ubuntu Postfix/Dovecot server.">
          <MailAccountsPanel token={token} />
        </EditorSection>

        <EditorSection id="basic-info" title="Basic information" description="Your company name and main phone number.">
          <div className="admin-grid admin-grid-two">
            <Field label="Company name" value={content.brandName} onChange={(value) => setPath(['brandName'], value)} />
            <Field label="Main phone number" value={content.phone} onChange={(value) => setPath(['phone'], value)} />
          </div>
        </EditorSection>

        <EditorSection id="social-links" title="Social links" description="These links appear in the top bar, footer and owner contact buttons.">
          <div className="admin-grid admin-grid-two">
            <Field label="Facebook URL" value={content.socialLinks.facebook} onChange={(value) => setPath(['socialLinks', 'facebook'], value)} />
            <Field label="Instagram URL" value={content.socialLinks.instagram} onChange={(value) => setPath(['socialLinks', 'instagram'], value)} />
            <Field label="Younas WhatsApp URL" value={content.socialLinks.younas} onChange={(value) => setPath(['socialLinks', 'younas'], value)} />
            <Field label="Shakeel WhatsApp URL" value={content.socialLinks.shakeel} onChange={(value) => setPath(['socialLinks', 'shakeel'], value)} />
          </div>
        </EditorSection>

        <EditorSection id="office-info" title="Office information" description="Address, email and opening hours shown throughout the website.">
          <div className="admin-grid admin-grid-two">
            <Field label="Office address" value={content.office.address} onChange={(value) => setPath(['office', 'address'], value)} />
            <Field label="Office email" value={content.office.email} onChange={(value) => setPath(['office', 'email'], value)} type="email" />
            <Field label="Working days" value={content.office.days} onChange={(value) => setPath(['office', 'days'], value)} />
            <Field label="Working hours" value={content.office.hours} onChange={(value) => setPath(['office', 'hours'], value)} />
            <Field label="Closed day" value={content.office.closedDay} onChange={(value) => setPath(['office', 'closedDay'], value)} />
            <Field label="Closed text" value={content.office.closedText} onChange={(value) => setPath(['office', 'closedText'], value)} />
          </div>
        </EditorSection>

        <EditorSection id="hero-slides" title="Hero slides" description="The large banners shown on the home page.">
          <div className="admin-repeat-list">
            {content.heroSlides.map((slide, index) => (
              <div className="admin-repeat-card" key={'slide-' + index}>
                <div className="admin-repeat-heading">
                  <h3>Slide {index + 1}</h3>
                  <ItemActions onRemove={() => removeListItem('heroSlides', index)} />
                </div>
                <div className="admin-grid admin-grid-two">
                  <Field label="Image filename" value={slide.image} onChange={(value) => setListItem('heroSlides', index, 'image', value)} hint="Example: carousel-1.jpg" />
                  <Field label="Button text" value={slide.cta} onChange={(value) => setListItem('heroSlides', index, 'cta', value)} />
                  <Field label="Slide text" value={slide.text} onChange={(value) => setListItem('heroSlides', index, 'text', value)} multiline />
                  <Field label="Button link" value={slide.link} onChange={(value) => setListItem('heroSlides', index, 'link', value)} />
                </div>
              </div>
            ))}
          </div>
          <button className="admin-add-button" type="button" onClick={() => addListItem('heroSlides', { image: 'carousel-1.jpg', text: 'New slide text', cta: 'Explore More', link: '/service' })}>+ Add slide</button>
        </EditorSection>

        <EditorSection id="features" title="Why choose us" description="The three feature points shown on the home page.">
          <div className="admin-repeat-list">
            {content.features.map((feature, index) => (
              <div className="admin-repeat-card" key={'feature-' + index}>
                <div className="admin-repeat-heading">
                  <h3>Feature {index + 1}</h3>
                  <ItemActions onRemove={() => removeListItem('features', index)} />
                </div>
                <Field label="Title" value={feature.title} onChange={(value) => setListItem('features', index, 'title', value)} />
                <Field label="Description" value={feature.description} onChange={(value) => setListItem('features', index, 'description', value)} multiline />
              </div>
            ))}
          </div>
          <button className="admin-add-button" type="button" onClick={() => addListItem('features', { title: 'New feature', description: 'Describe this feature.' })}>+ Add feature</button>
        </EditorSection>

        <EditorSection id="statistics" title="Statistics" description="Numbers shown in the statistics strip.">
          <div className="admin-repeat-list">
            {content.stats.map((stat, index) => (
              <div className="admin-repeat-card" key={'stat-' + index}>
                <div className="admin-repeat-heading">
                  <h3>Statistic {index + 1}</h3>
                  <ItemActions onRemove={() => removeListItem('stats', index)} />
                </div>
                <div className="admin-grid admin-grid-three">
                  <Field label="Icon class" value={stat.icon} onChange={(value) => setListItem('stats', index, 'icon', value)} hint="Example: fa-users" />
                  <Field label="Number" value={stat.value} onChange={(value) => setListItem('stats', index, 'value', value)} />
                  <Field label="Label" value={stat.label} onChange={(value) => setListItem('stats', index, 'label', value)} />
                </div>
              </div>
            ))}
          </div>
          <button className="admin-add-button" type="button" onClick={() => addListItem('stats', { icon: 'fa-chart-line', value: '0', label: 'New statistic' })}>+ Add statistic</button>
        </EditorSection>

        <EditorSection id="services" title="Services" description="Service cards shown on the home and services pages.">
          <div className="admin-repeat-list">
            {content.services.map((service, index) => (
              <div className="admin-repeat-card" key={'service-' + index}>
                <div className="admin-repeat-heading">
                  <h3>Service {index + 1}</h3>
                  <ItemActions onRemove={() => removeListItem('services', index)} />
                </div>
                <div className="admin-grid admin-grid-two">
                  <Field label="Image filename" value={service.image} onChange={(value) => setListItem('services', index, 'image', value)} hint="Example: service-1.jpg" />
                  <Field label="Service title" value={service.title} onChange={(value) => setListItem('services', index, 'title', value)} />
                  <Field label="Description" value={service.description} onChange={(value) => setListItem('services', index, 'description', value)} multiline />
                </div>
              </div>
            ))}
          </div>
          <button className="admin-add-button" type="button" onClick={() => addListItem('services', { image: 'service-1.jpg', title: 'New service', description: 'Describe this service.' })}>+ Add service</button>
        </EditorSection>

        <EditorSection id="owners" title="Owners and team" description="Team members and their WhatsApp contact links.">
          <div className="admin-repeat-list">
            {content.owners.map((owner, index) => (
              <div className="admin-repeat-card" key={'owner-' + index}>
                <div className="admin-repeat-heading">
                  <h3>Team member {index + 1}</h3>
                  <ItemActions onRemove={() => removeListItem('owners', index)} />
                </div>
                <div className="admin-grid admin-grid-two">
                  <Field label="Image filename" value={owner.image} onChange={(value) => setListItem('owners', index, 'image', value)} hint="Example: team-1.jpg" />
                  <Field label="Name" value={owner.name} onChange={(value) => setListItem('owners', index, 'name', value)} />
                  <Field label="Role" value={owner.role} onChange={(value) => setListItem('owners', index, 'role', value)} />
                  <Field label="WhatsApp link" value={owner.whatsapp} onChange={(value) => setListItem('owners', index, 'whatsapp', value)} />
                </div>
              </div>
            ))}
          </div>
          <button className="admin-add-button" type="button" onClick={() => addListItem('owners', { image: 'team-1.jpg', name: 'New team member', role: 'Role', whatsapp: 'https://wa.me/' })}>+ Add team member</button>
        </EditorSection>

        <EditorSection id="contact-page" title="Contact page" description="WhatsApp numbers, email addresses, office phones and map links.">
          <div className="admin-repeat-list">
            <div className="admin-repeat-card">
              <div className="admin-repeat-heading"><h3>WhatsApp numbers</h3></div>
              {content.contact.whatsappNumbers.map((number, index) => (
                <div className="admin-inline-field" key={'whatsapp-' + index}>
                  <Field label={'Number ' + (index + 1)} value={number} onChange={(value) => setContactListItem('whatsappNumbers', index, value)} />
                  <ItemActions onRemove={() => removeContactListItem('whatsappNumbers', index)} />
                </div>
              ))}
              <button className="admin-add-button" type="button" onClick={() => addContactListItem('whatsappNumbers')}>+ Add number</button>
            </div>
            <div className="admin-repeat-card">
              <div className="admin-repeat-heading"><h3>Email addresses</h3></div>
              {content.contact.emails.map((address, index) => (
                <div className="admin-inline-field" key={'email-' + index}>
                  <Field label={'Email ' + (index + 1)} value={address} onChange={(value) => setContactListItem('emails', index, value)} type="email" />
                  <ItemActions onRemove={() => removeContactListItem('emails', index)} />
                </div>
              ))}
              <button className="admin-add-button" type="button" onClick={() => addContactListItem('emails')}>+ Add email</button>
            </div>
            <div className="admin-repeat-card">
              <div className="admin-repeat-heading"><h3>Office phones</h3></div>
              {content.contact.officePhones.map((number, index) => (
                <div className="admin-inline-field" key={'office-phone-' + index}>
                  <Field label={'Phone ' + (index + 1)} value={number} onChange={(value) => setContactListItem('officePhones', index, value)} />
                  <ItemActions onRemove={() => removeContactListItem('officePhones', index)} />
                </div>
              ))}
              <button className="admin-add-button" type="button" onClick={() => addContactListItem('officePhones')}>+ Add phone</button>
            </div>
          </div>
          <div className="admin-grid admin-grid-two admin-contact-links">
            <Field label="Google Maps direction URL" value={content.contact.directionUrl} onChange={(value) => setPath(['contact', 'directionUrl'], value)} />
            <Field label="Google Maps embed URL" value={content.contact.mapEmbedUrl} onChange={(value) => setPath(['contact', 'mapEmbedUrl'], value)} multiline />
          </div>
        </EditorSection>

        <div className="admin-save-bar">
          <div>
            {error && <p className="admin-error">{error}</p>}
            {message && <p className="admin-success">{message}</p>}
          </div>
          <div className="admin-actions">
            <button className="admin-secondary-button" type="button" onClick={resetContent} disabled={busy}>Reset defaults</button>
            <button className="admin-button" type="button" onClick={saveContent} disabled={busy}>{busy ? 'Saving...' : 'Save all changes'}</button>
          </div>
        </div>
          </div>
        </div>
      </section>
    </main>
  );
}
