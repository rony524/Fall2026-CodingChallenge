import { useState } from "react";
import { SidePanel } from "./SidePanel";
import { NotificationBell } from "./NotificationBell";
import { NewCollectionsForms } from "./NewCollectionsForm.tsx";
import { LoginForm } from "./LoginForm";
import { UploadImageForm } from "./UploadImageForm.tsx";
import "./Navbar.css";

interface NavbarUser {
  name: string;
  avatarUrl?: string;
}

interface NavbarProps {
  appName?: string;
  user?: NavbarUser | null;
  onSignIn: (username: string, password: string) => Promise<void>;
  onLogOut: () => void;
  onCreateCollection: (input: { name: string; description?: string }) => Promise<void>;
  onUpload: (input: { url: string; caption: string }) => Promise<void>;
}

type PanelView = "menu" | "new-collection" | "login" | "upload";

export function Navbar({
  appName = "Pixshare",
  user = null,
  onSignIn,
  onLogOut,
  onCreateCollection,
  onUpload,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelView, setPanelView] = useState<PanelView>("menu");

  function handleCloseMenu() {
    setMenuOpen(false);
    setPanelView("menu");
  }

  function panelTitle() {
    if (panelView === "new-collection") return "New Collection";
    if (panelView === "login") return "Log in";
    if (panelView === "upload") return "Upload Photo";
    return "Menu";
  }

  return (
    <header className="navbar">
      <div className="navbar-left">
        <span className="navbar-logo" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="11" r="2.5" />
            <path d="M21 16l-4.5-4.5a2 2 0 0 0-2.8 0L9 16" />
          </svg>
        </span>
      </div>
      <div className="navbar-brand">{appName}</div>
      <div className="navbar-actions">
        <NotificationBell isSignedIn={Boolean(user)} />
        <button type="button" className="navbar-menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
      <SidePanel isOpen={menuOpen} onClose={handleCloseMenu} title={panelTitle()} side="right">
        {panelView === "menu" && (
          <>
            {user && (
              <div className="navbar-menu-identity">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" />
                ) : (
                  <span className="navbar-menu-initial">{user.name.charAt(0).toUpperCase()}</span>
                )}
                <span className="navbar-menu-identity-name">{user.name}</span>
              </div>
            )}
            {user && <div className="navbar-menu-divider" />}
            <div className="navbar-menu-account">
              <button type="button" className="navbar-menu-upload" onClick={() => setPanelView("upload")}>
                Upload
              </button>
              <button type="button" className="navbar-menu-link" onClick={() => setPanelView("new-collection")}>
                New Collection
              </button>
              <button
                type="button"
                className="navbar-menu-profile"
                onClick={user ? onLogOut : () => setPanelView("login")}
              >
                {user ? "Log out" : "Log in"}
              </button>
            </div>
          </>
        )}

        {panelView === "new-collection" && (
          <NewCollectionsForms
            isSignedIn={Boolean(user)}
            onCreate={onCreateCollection}
            onBack={() => setPanelView("menu")}
          />
        )}

        {panelView === "login" && <LoginForm onSignIn={onSignIn} onBack={() => setPanelView("menu")} />}

        {panelView === "upload" && (
          <UploadImageForm isSignedIn={Boolean(user)} onUpload={onUpload} onBack={() => setPanelView("menu")} />
        )}
      </SidePanel>
    </header>
  );
}
