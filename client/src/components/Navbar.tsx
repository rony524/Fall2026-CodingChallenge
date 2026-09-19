
import { useState } from "react";
import "./Navbar.css";
import { SidePanel } from "./SidePanel";
import { NewCollectionsForms } from "./NewCollectionsForm";
import { NotificationBell} from "./NotificationBell";

// Shape of the logged-in user this navbar cares about.
// Keep this minimal — just what the UI needs, not your whole User type.
interface NavbarUser {
  name: string;
  avatarUrl?: string;
}

interface NavbarProps {
  appName?: string;
  user?: NavbarUser | null;       // null/undefined = signed out
  onUploadClick?: () => void;
  onProfileClick?: () => void;
  onCreateCollections: (input: { name:string; description?:string}) => Promise<void>;
}

type PanelView = "menu" | "new-collection";

export function Navbar({
  appName = "PixShare",
  user = null,
  onUploadClick,
  onProfileClick,
  onCreateCollections
}: NavbarProps) {
  
  const [menuOpen, setMenuOpen] = useState(false);
  const[panelView, setPanelView] = useState<PanelView>("menu");

  function handleCloseMenu() {
    setMenuOpen(false);
    setPanelView("menu");
  }

  return(
    <>
        <header className = "navbar">
            <div className = "navbar-left">
                <span className = "navbar-logo" aria-hidden = "true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22px" height="22px" viewBox="0 0 1024 1024" className="icon" version="1.1">
                    <path d="M964.751 210.302H61.963c-25.57 0-46.296 20.727-46.296 46.296v6.518c0 25.57 20.727 46.297 46.296 46.297h902.788c25.569 0 46.297-20.727 46.297-46.297v-6.518c0-25.57-20.728-46.296-46.297-46.296z" fill="#4A5699"/>
                    <path d="M964.751 828.887H61.963c-25.57 0-46.296 20.728-46.296 46.297v6.52c0 25.565 20.727 46.297 46.296 46.297h902.788c25.569 0 46.297-20.731 46.297-46.297v-6.52c0-25.57-20.728-46.297-46.297-46.297z" fill="#C45FA0"/>
                    <path d="M68.564 210.302h-6.601c-25.57 0-46.296 20.727-46.296 46.296v625.105c0 25.565 20.727 46.297 46.296 46.297h6.601c25.571 0 46.296-20.731 46.296-46.297V256.598c0-25.57-20.725-46.296-46.296-46.296zM964.751 210.302h-6.604c-25.569 0-46.292 20.727-46.292 46.296v625.105c0 25.565 20.723 46.297 46.292 46.297h6.604c25.569 0 46.297-20.731 46.297-46.297V256.598c0-25.57-20.728-46.296-46.297-46.296z" fill="#6277BA"/>
                    <path d="M155.907 396.561a49.6 49.555 0 1 0 99.2 0 49.6 49.555 0 1 0-99.2 0Z" fill="#F0D043"/>
                    <path d="M739.108 111.191H284.412c-25.567 0-46.296 20.727-46.296 46.296v6.518c0 25.568 20.729 46.297 46.296 46.297h454.696c25.569 0 46.293-20.729 46.293-46.297v-6.518c0-25.569-20.723-46.296-46.293-46.296z" fill="#F39A2B"/>
                    <path d="M607.586 569.65c0.037 55.423-41.429 99.896-95.959 102.036-55.394 2.173-99.965-43.03-102.043-95.958-1.141-29.074-23.423-53.393-53.392-53.393-28.241 0-54.535 24.293-53.392 53.393 4.438 113.048 94.812 202.82 208.826 202.742 113.141-0.08 202.821-98.092 202.742-208.82-0.049-68.858-106.832-68.862-106.782 0z" fill="#F39A2B"/>
                    <path d="M411.073 564.357c1.049-54.399 44.634-97.98 99.036-99.029 54.426-1.049 98.01 46.207 99.028 99.029 1.326 68.771 108.109 68.9 106.783 0-2.19-113.543-92.271-203.625-205.812-205.813-113.539-2.188-203.694 95.569-205.819 205.813-1.328 68.901 105.458 68.771 106.784 0z" fill="#E5594F"/>
                    </svg>
                </span>
            </div>

            <div className = "app-name">{appName}</div>

            <div className = "navbar-actions">
                <NotificationBell isSignedIn ={Boolean(user)} />

                <button
                 type ="button"
                 className ="navbar-btn"
                 onClick={() => setMenuOpen(true)}
                 aria-label="Open-menu">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22px" height="22px" viewBox="0 0 1024 1024" className="icon" version="1.1">
                    <path d="M91.89 238.457c-29.899 0-54.133 24.239-54.133 54.134 0 29.899 24.234 54.137 54.133 54.137s54.138-24.238 54.138-54.137c0-29.896-24.239-54.134-54.138-54.134z" fill="#E5594F"/>
                    <path d="M91.89 462.463c-29.899 0-54.133 24.239-54.133 54.139 0 29.895 24.234 54.133 54.133 54.133s54.138-24.238 54.138-54.133c0-29.9-24.239-54.139-54.138-54.139z" fill="#C45FA0"/>
                    <path d="M91.89 686.475c-29.899 0-54.133 24.237-54.133 54.133 0 29.899 24.234 54.138 54.133 54.138s54.138-24.238 54.138-54.138c0-29.896-24.239-54.133-54.138-54.133z" fill="#F39A2B"/>
                    <path d="M941.26 234.723H328.964c-28.867 0-52.263 23.4-52.263 52.268v3.734c0 28.868 23.396 52.269 52.263 52.269H941.26c28.869 0 52.269-23.401 52.269-52.269v-3.734c-0.001-28.868-23.4-52.268-52.269-52.268z" fill="#F0D043"/>
                    <path d="M941.26 682.74H328.964c-28.867 0-52.263 23.399-52.263 52.268v3.734c0 28.863 23.396 52.269 52.263 52.269H941.26c28.869 0 52.269-23.405 52.269-52.269v-3.734c-0.001-28.868-23.4-52.268-52.269-52.268z" fill="#4A5699"/>
                    <path d="M709.781 458.729H328.964c-28.867 0-52.263 23.4-52.263 52.269v3.734c0 28.873 23.396 52.269 52.263 52.269h380.817c28.866 0 52.271-23.396 52.271-52.269v-3.734c0.001-28.869-23.405-52.269-52.271-52.269z" fill="#E5594F"/></svg>
                </button>
            </div>

            <SidePanel 
             isOpen = {menuOpen}
             onClose = {handleCloseMenu}
             title = {panelView === "menu" ? "Menu": "New Collection"} 
             side = "right"
             >
                 {panelView === "menu" ? (
          <>
            {user && (
              <div className="navbar-menu-identity">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" />
                ) : (
                  // No avatar image yet? Fall back to an initial — never leave a broken <img>.
                  <span className="navbar-menu-initial">{user.name.charAt(0).toUpperCase()}</span>
                )}
                <span className="navbar-menu-identity-name">{user.name}</span>
              </div>
            )}

            {user && <div className="navbar-menu-divider" />}

            <div className="navbar-menu-account">
              <button type="button" className="navbar-menu-upload" onClick={onUploadClick}>
                Upload
              </button>

              <button type="button" className="navbar-menu-link" onClick={() => setPanelView("new-collection")}>
                New Collection
              </button>

              <button type="button" className="navbar-menu-profile" onClick={onProfileClick}>
                {user ? "Log out" : "Log in"}
              </button>
            </div>
          </>
        ) : (
          <NewCollectionsForms
            isSignedIn={Boolean(user)}
            onCreate={onCreateCollections}
            onBack={() => setPanelView("menu")}
          />
        )}
      </SidePanel>
        </header>


    </>
  );
}


    

      