/**
 * Tabs Component
 * 
 * Tabbed interface for organizing content
 */

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
}

/**
 * Tabs component for organizing content
 */
export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab = tabs[0]?.id,
  onTabChange,
  variant = 'default',
}) => {
  const active = activeTab || tabs[0]?.id;

  return (
    <div className={`tabs tabs-${variant}`}>
      {/* TODO: Tab headers */}
      <div className="tabs-header">
        <div className="tabs-list" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${active === tab.id ? 'active' : ''} ${
                tab.disabled ? 'disabled' : ''
              }`}
              onClick={() => !tab.disabled && onTabChange?.(tab.id)}
              disabled={tab.disabled}
              role="tab"
              aria-selected={active === tab.id}
              aria-controls={`tab-panel-${tab.id}`}
            >
              {/* Tab icon if provided */}
              {tab.icon && <span className="tab-icon">{tab.icon}</span>}
              {/* Tab label */}
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TODO: Tab content panels */}
      <div className="tabs-content">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`tab-panel-${tab.id}`}
            className={`tab-panel ${active === tab.id ? 'active' : ''}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            hidden={active !== tab.id}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
