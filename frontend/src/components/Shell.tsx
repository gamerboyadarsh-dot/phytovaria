import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Leaf, FlaskConical, BarChart3,
  Lightbulb, CloudRain, FileText, PlusCircle, List,
  Dna, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const NAV = [
  {
    section: 'Overview',
    items: [
      { path: '/dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
      { path: '/plants', icon: <List size={16} />, label: 'All Plants' },
      { path: '/environment', icon: <CloudRain size={16} />, label: 'Environment' },
    ],
  },
  {
    section: 'Analysis',
    items: [
      { path: '/plants/register', icon: <PlusCircle size={16} />, label: 'Register Plant' },
    ],
  },
];

export function Shell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
            zIndex: 99, display: 'none',
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">
              <Dna size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div className="logo-text">PhytoVaria</div>
              <div className="logo-sub">Genomic Intelligence</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((section) => (
            <div className="nav-section" key={section.section}>
              <div className="nav-section-label">{section.section}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: 11, color: 'var(--clr-text-3)', lineHeight: 1.5 }}>
            <strong>PhytoVaria v1.0</strong><br />
            Product Preview<br />
            <em>Demonstration environment</em>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content fade-in">
        <Outlet />
      </main>
    </div>
  );
}
