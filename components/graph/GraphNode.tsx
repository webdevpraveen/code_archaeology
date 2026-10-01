/**
 * GraphNode Component
 * 
 * Custom node component for React Flow graph visualization
 */

interface GraphNodeData {
  label: string;
  type?: string;
  status?: 'active' | 'inactive' | 'modified';
  icon?: React.ReactNode;
  metrics?: Record<string, any>;
}

interface GraphNodeProps {
  data: GraphNodeData;
  selected?: boolean;
  isConnecting?: boolean;
  onSelect?: () => void;
}

/**
 * Custom node component for graph nodes
 * Renders file/component nodes with visual indicators
 */
export const GraphNode: React.FC<GraphNodeProps> = ({
  data,
  selected = false,
  isConnecting = false,
  onSelect,
}) => {
  return (
    <div
      className={`graph-node ${selected ? 'selected' : ''} ${
        isConnecting ? 'connecting' : ''
      }`}
      onClick={onSelect}
    >
      {/* TODO: Node icon */}
      <div className="node-icon">
        {data.icon || '📄'}
      </div>

      {/* TODO: Node label */}
      <div className="node-label">{data.label}</div>

      {/* TODO: Node status indicator */}
      {data.status && (
        <div className={`node-status status-${data.status}`}>
          {/* Status badge */}
        </div>
      )}

      {/* TODO: Connection handles for edges */}
      {/* Handle components for top, right, bottom, left */}

      {/* TODO: Hover tooltip with metrics */}
      {data.metrics && (
        <div className="node-tooltip">
          {/* Metrics display */}
        </div>
      )}
    </div>
  );
};

export default GraphNode;
