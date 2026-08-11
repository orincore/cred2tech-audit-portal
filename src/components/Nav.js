import Link from 'next/link';

const LINKS = [
  { href: '/overview', label: 'Overview' },
  { href: '/app-logs', label: 'Application Logs' },
  { href: '/server-logs', label: 'Server Logs' },
  { href: '/consent-events', label: 'Consent & Data Events' },
  { href: '/purge-events', label: 'Data Purge Events' },
  { href: '/backup-status', label: 'Backup Status' },
  { href: '/ip-monitoring', label: 'IP Monitoring' },
];

export default function Nav({ activePage }) {
  return (
    <nav className="nav">
      <span className="nav-mark">
        <span className="seal" aria-hidden="true" />
        Monitoring Services
      </span>
      <div className="nav-links">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link${activePage === link.href.slice(1) ? ' active' : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <form action="/api/auth/logout" method="POST" className="nav-signout">
        <button type="submit" formAction="/api/auth/logout" className="btn-ghost">Sign out</button>
      </form>
    </nav>
  );
}
