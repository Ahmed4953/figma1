/* eslint-disable */
// Shared Portal chrome — header + sidebar

function PortalHeader(props) {
  const mobile = !!props.mobile;
  return (
    <header className="pl-header">
      <div className="pl-menu" aria-label="Close menu">
        <svg width={mobile ? 14 : 18} height={mobile ? 14 : 18} viewBox="0 0 18 18" fill="none">
          <path d="M4 4L14 14M14 4L4 14" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="pl-bar">
        <div className="pl-left">
          <img className="pl-logo" src="assets/PORTAL.svg" alt="PORTAL" />
          {!mobile && (
            <div className="pl-search" role="button" tabIndex={0}>
              <span className="label">All accounts</span>
              <button type="button" aria-label="Clear">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              </button>
              <button type="button" aria-label="Open">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          )}
          {mobile && (
            <div className="pl-search" role="button" tabIndex={0}>
              <span className="label">All accounts</span>
              <button type="button" aria-label="Open">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          )}
        </div>
        <div className="pl-right">
          {!mobile && <span className="pl-email">test@nyris.io</span>}
          <div className="pl-avatar">T</div>
        </div>
      </div>
    </header>
  );
}

function PortalSidebar(props) {
  const active = props.active || 'prompts';
  const NavItem = (id, label, icon, hasChev) => (
    <div className={"pl-nav" + (active === id ? " is-active" : "")} key={id}>
      <img src={"assets/icon-" + icon + ".svg"} alt="" />
      <span>{label}</span>
      {hasChev && <span className="chev"></span>}
    </div>
  );
  return (
    <div className="pl-sidebar-wrap">
      <aside className="pl-sidebar">
        <div className="pl-nav-group">
          {NavItem('dashboard', 'Dashboard', 'dashboard')}
          <div className="pl-divider">Admin Hub</div>
          {NavItem('accounts', 'Accounts', 'accounts', true)}
          {NavItem('indexes', 'Indexes', 'indexes', true)}
          {NavItem('prompts', 'Prompts', 'prompts')}
          <div className="pl-divider">Catalogue</div>
          {NavItem('requests', 'Requests', 'requests')}
          {NavItem('items', 'Items', 'items')}
          <div className="pl-divider">3D &amp; Rendering</div>
          {NavItem('machines', 'Machines', 'machines', true)}
          {NavItem('cad', 'CAD rendering', 'cad')}
        </div>
        <div className="pl-foot">
          <img src="assets/poweredby-nyris.svg" alt="Powered by nyris" />
        </div>
      </aside>
    </div>
  );
}

window.PortalHeader = PortalHeader;
window.PortalSidebar = PortalSidebar;
