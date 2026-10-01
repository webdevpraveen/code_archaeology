/**
 * Overview Component
 * 
 * High-level summary statistics and metrics about the repository
 */

interface RepositoryMetrics {
  totalCommits: number;
  totalContributors: number;
  totalBranches: number;
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  lastCommitDate: Date;
  averageCommitSize: number;
}

interface OverviewProps {
  metrics?: RepositoryMetrics;
  isLoading?: boolean;
  onMetricClick?: (metric: string) => void;
}

/**
 * Overview component displaying key repository metrics
 */
export const Overview: React.FC<OverviewProps> = ({
  metrics,
  isLoading = false,
  onMetricClick,
}) => {
  if (isLoading) {
    return <div className="overview-loading">Loading metrics...</div>;
  }

  return (
    <div className="overview-container">
      {/* TODO: Header section */}
      <div className="overview-header">
        <h2>Repository Overview</h2>
        {/* Refresh button */}
      </div>

      {/* TODO: Key metrics cards */}
      <div className="overview-metrics">
        {/* TODO: Total commits card */}
        <div
          className="metric-card"
          onClick={() => onMetricClick?.('commits')}
        >
          <div className="metric-value">{metrics?.totalCommits}</div>
          <div className="metric-label">Total Commits</div>
        </div>

        {/* TODO: Contributors card */}
        <div
          className="metric-card"
          onClick={() => onMetricClick?.('contributors')}
        >
          <div className="metric-value">{metrics?.totalContributors}</div>
          <div className="metric-label">Contributors</div>
        </div>

        {/* TODO: Branches card */}
        <div className="metric-card" onClick={() => onMetricClick?.('branches')}>
          <div className="metric-value">{metrics?.totalBranches}</div>
          <div className="metric-label">Branches</div>
        </div>

        {/* TODO: Files changed card */}
        <div className="metric-card" onClick={() => onMetricClick?.('files')}>
          <div className="metric-value">{metrics?.filesChanged}</div>
          <div className="metric-label">Files Changed</div>
        </div>

        {/* TODO: Lines added/removed */}
        <div className="metric-card">
          <div className="metric-value">
            <span className="added">+{metrics?.linesAdded}</span>
            <span className="removed">-{metrics?.linesRemoved}</span>
          </div>
          <div className="metric-label">Lines Changed</div>
        </div>

        {/* TODO: Last commit */}
        <div className="metric-card">
          <div className="metric-value">
            {metrics?.lastCommitDate.toLocaleDateString()}
          </div>
          <div className="metric-label">Last Commit</div>
        </div>
      </div>

      {/* TODO: Summary charts section */}
      <div className="overview-charts">
        {/* Activity chart over time */}
        {/* Contributor distribution */}
        {/* File type distribution */}
      </div>
    </div>
  );
};

export default Overview;
