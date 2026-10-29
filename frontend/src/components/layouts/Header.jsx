import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";


function Header({ config, session, handleLogout }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    setSettingsOpen(false);
    navigate(path);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target)
      ) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-mark">{config.appName}</div>

        <div>
          <h1>{config.subTitle}</h1>

          <p className="muted">
            {config.shortDescription}
          </p>
        </div>
      </div>

      <div className="user-badge">
        <div className="user-badge-info">
          <span className="user-name">
            {session.user.name}
          </span>

          <span className="user-role">
            {session.user.role}
          </span>
        </div>

        {/* Settings Dropdown */}
        <div className="settings-dropdown" ref={settingsRef}>
          <button
            type="button"
            className="btn-outline settings-btn"
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            ⚙ Settings
            <span className="dropdown-arrow">▾</span>
          </button>

          {settingsOpen && (
            <div className="settings-menu">

              {/* Profile */}
              <button
                type="button"
                onClick={() => handleNavigate("/profile")}
              >
                👤 Profile
              </button>

              <div className="menu-divider" />

              {/* User */}
              <div className="menu-section-title">
                User
              </div>

              <button
                type="button"
                onClick={() => handleNavigate("/users")}
              >
                📋 User List
              </button>

              <button
                type="button"
                onClick={() => handleNavigate("/users/create")}
              >
                ➕ Add User
              </button>

              <div className="menu-divider" />

              {/* Project */}
              <div className="menu-section-title">
                Project
              </div>

              <button
                type="button"
                onClick={() => handleNavigate("/projects")}
              >
                📋 Project List
              </button>

              <button
                type="button"
                onClick={() => handleNavigate("/projects/create")}
              >
                ➕ Create Project
              </button>

              <div className="menu-divider" />

              {/* Logout */}
              <button
                type="button"
                className="logout-item"
                onClick={() => {
                  setSettingsOpen(false);
                  handleLogout();
                }}
              >
                🚪 Logout
              </button>

            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;