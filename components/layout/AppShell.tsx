/**
 * AppShell Component
 * 
 * Main layout wrapper that combines Navbar, Sidebar, and main content area
 */

interface AppShellProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showDetailDrawer?: boolean;
}

/**
 * Main application shell component providing the overall layout structure
 */
export const AppShell: React.FC<AppShellProps> = ({
  children,
  showSidebar = true,
  showDetailDrawer = true,
}) => {
  return (
    <div className="app-shell">
      {/* TODO: Top navigation bar */}
      <header className="app-header">
        {/* Navbar component */}
      </header>

      <div className="app-container">
        {/* TODO: Left sidebar navigation */}
        {showSidebar && (
          <aside className="app-sidebar">
            {/* Sidebar component */}
          </aside>
        )}

        {/* TODO: Main content area */}
        <main className="app-main">
          {children}
        </main>

        {/* TODO: Right detail drawer */}
        {showDetailDrawer && (
          <aside className="app-drawer">
            {/* DetailDrawer component */}
          </aside>
        )}
      </div>

      {/* TODO: Footer if needed */}
      <footer className="app-footer">
        {/* Footer content */}
      </footer>
    </div>
  );
};

export default AppShell;
