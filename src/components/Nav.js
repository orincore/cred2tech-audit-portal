import Link from 'next/link';

const LINKS = [
  { href: '/overview', label: 'Overview' },
  { href: '/app-logs', label: 'Application Logs' },
  { href: '/server-logs', label: 'Server Logs' },
  { href: '/consent-events', label: 'Consent & Data Events' },
  { href: '/backup-status', label: 'Backup Status' },
];

export default function Nav({ activePage }) {
  return (
    <nav style={{ display: 'flex', gap: 16, padding: '12px 24px', borderBottom: '1px solid #333', fontFamily: 'system-ui, sans-serif' }}>
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          style={{ fontWeight: activePage === link.href.slice(1) ? 700 : 400 }}
        >
          {link.label}
        </Link>
      ))}
      <form action="/api/auth/logout" method="POST" style={{ marginLeft: 'auto' }}>
        <button type="submit" formAction="/api/auth/logout">Sign out</button>
      </form>
    </nav>
  );
}
