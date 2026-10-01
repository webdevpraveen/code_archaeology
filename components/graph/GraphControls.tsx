/**
 * GraphControls Component
 * 
 * Controls for zooming, panning, resetting, and filtering graph views
 */

interface GraphControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
  onFit?: () => void;
  zoomLevel?: number;
  canZoom?: boolean;
}

/**
 * Control panel for graph interactions
 * Provides zoom, pan, and view management controls
 */
export const GraphControls: React.FC<GraphControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
  onFit,
  zoomLevel = 1,
  canZoom = true,
}) => {
  return (
    <div className="graph-controls">
      {/* TODO: Zoom controls */}
      <div className="control-group zoom-controls">
        <button
          onClick={onZoomIn}
          disabled={!canZoom}
          className="control-btn zoom-in"
          title="Zoom in (Ctrl +)"
        >
          🔍+
        </button>
        <span className="zoom-display">{Math.round(zoomLevel * 100)}%</span>
        <button
          onClick={onZoomOut}
          disabled={!canZoom}
          className="control-btn zoom-out"
          title="Zoom out (Ctrl -)"
        >
          🔍-
        </button>
      </div>

      {/* TODO: View controls */}
      <div className="control-group view-controls">
        <button
          onClick={onFit}
          className="control-btn fit-view"
          title="Fit to screen"
        >
          ⊡ Fit
        </button>
        <button
          onClick={onReset}
          className="control-btn reset-view"
          title="Reset view"
        >
          ↻ Reset
        </button>
      </div>

      {/* TODO: Filter controls */}
      <div className="control-group filter-controls">
        <button className="control-btn" title="Filter nodes">
          ⊘ Filter
        </button>
        <button className="control-btn" title="Search nodes">
          🔍 Search
        </button>
      </div>

      {/* TODO: Layout options */}
      <div className="control-group layout-controls">
        <select className="layout-select" title="Graph layout">
          <option value="hierarchical">Hierarchical</option>
          <option value="force">Force-Directed</option>
          <option value="circular">Circular</option>
          <option value="grid">Grid</option>
        </select>
      </div>
    </div>
  );
};

export default GraphControls;
