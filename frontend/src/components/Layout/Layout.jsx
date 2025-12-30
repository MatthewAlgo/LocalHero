import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon">🦸</span>
          <span className="logo-text">LocalHero</span>
        </div>
        
        <nav>
          <ul className="nav-menu">
            <li>
              <NavLink 
                to="/" 
                end
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">📊</span>
                <span className="nav-text">Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/locations"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">📍</span>
                <span className="nav-text">Locations</span>
              </NavLink>
            </li>
          </ul>
        </nav>
        
        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <div className="text-sm text-muted mb-4">
              Signed in as
            </div>
            <div className="font-semibold" style={{ marginBottom: '0.5rem' }}>
              {user?.email}
            </div>
            {user?.companyName && (
              <div className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
                {user.companyName}
              </div>
            )}
            <button 
              onClick={handleLogout}
              className="btn btn-ghost btn-sm w-full"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
