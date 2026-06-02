import { useState, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

const TYPE_COLORS = {
  entry: '#F0EDE6',
  component: '#E8A020',
  service: '#4A90D9',
  utility: '#888888',
  model: '#4CAF50',
  config: '#666666'
};

const TYPE_LABELS = {
  entry: 'Entry Point',
  component: 'Component',
  service: 'Service',
  utility: 'Utility',
  model: 'Model',
  config: 'Config'
};

export function ArchitectureMap({ archData }) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Safely destructure with fallbacks
  const archDataSafe = archData || {};
  const modules = Array.isArray(archDataSafe.modules) ? archDataSafe.modules : [];
  const data_flows = Array.isArray(archDataSafe.data_flows) ? archDataSafe.data_flows : [];
  const patterns_detected = Array.isArray(archDataSafe.patterns_detected) ? archDataSafe.patterns_detected : [];
  const issues = Array.isArray(archDataSafe.issues) ? archDataSafe.issues : [];
  const entry_points = Array.isArray(archDataSafe.entry_points) ? archDataSafe.entry_points : [];

  // Calculate node positions based on type (tiered layout)
  const nodePositions = useMemo(() => {
    const positions = {};
    const tiers = {
      entry: [],
      component: [],
      service: [],
      model: [],
      utility: [],
      config: []
    };

    // Group modules by type
    modules.forEach((mod) => {
      const type = mod.type || 'utility';
      if (tiers[type]) {
        tiers[type].push(mod);
      } else {
        tiers.utility.push(mod);
      }
    });

    // Position nodes in tiers
    const tierOrder = ['entry', 'service', 'component', 'model', 'utility', 'config'];
    const tierY = { entry: 50, service: 180, component: 180, model: 310, utility: 310, config: 440 };
    
    tierOrder.forEach((tier) => {
      const nodes = tiers[tier];
      nodes.forEach((node, idx) => {
        if (!node?.name) return; // Skip nodes without name
        const totalWidth = Math.min(nodes.length * 160, 800);
        const startX = (800 - totalWidth) / 2;
        positions[node.name] = {
          x: startX + idx * 160 + 80,
          y: tierY[tier],
          type: tier,
          node
        };
      });
    });

    return positions;
  }, [modules]);

  // Build edges from imports
  const edges = useMemo(() => {
    const edgeList = [];
    const circularDeps = new Set();

    // First pass: identify all imports
    modules.forEach((mod) => {
      if (!mod?.name) return;
      (mod.imports_from || []).forEach((imported) => {
        if (!imported || typeof imported !== 'string') return;
        const targetModule = modules.find(m => 
          m?.name === imported || (m?.exports && Array.isArray(m.exports) && m.exports.includes(imported))
        );
        if (targetModule && positions[mod.name] && positions[targetModule.name]) {
          edgeList.push({
            from: positions[mod.name],
            to: positions[targetModule.name],
            fromName: mod.name,
            toName: targetModule.name
          });
        }
      });
    });

    // Find circular dependencies
    edgeList.forEach(edge => {
      const reverse = edgeList.find(e => 
        e.fromName === edge.toName && e.toName === edge.fromName
      );
      if (reverse) {
        circularDeps.add(`${edge.fromName}-${edge.toName}`);
        circularDeps.add(`${edge.toName}-${edge.fromName}`);
      }
    });

    return { edges: edgeList, circularDeps };
  }, [modules, nodePositions]);

  if (!archData || modules.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 font-mono text-sm">
        No architecture data yet
      </div>
    );
  }

  const renderEdge = (edge, idx) => {
    const isCircular = edges.circularDeps.has(`${edge.fromName}-${edge.toName}`);
    const strokeColor = isCircular ? '#E53935' : '#333';
    const strokeWidth = isCircular ? 2 : 1;
    
    // Calculate control points for curved line
    const dx = edge.to.x - edge.from.x;
    const dy = edge.to.y - edge.from.y;
    const cx = (edge.from.x + edge.to.x) / 2;
    const cy = (edge.from.y + edge.to.y) / 2 - Math.abs(dx) * 0.1;

    return (
      <g key={idx}>
        {isCircular && (
          <path
            d={`M ${edge.from.x} ${edge.from.y - 20} Q ${cx} ${cy} ${edge.to.x} ${edge.to.y - 20}`}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={isCircular ? '5,5' : 'none'}
            opacity={0.6}
          />
        )}
        {!isCircular && (
          <line
            x1={edge.from.x}
            y1={edge.from.y - 20}
            x2={edge.to.x}
            y2={edge.to.y + 20}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        )}
      </g>
    );
  };

  const renderNode = (name, pos) => {
    const node = pos.node;
    const isGodObject = (node.imports_from || []).length >= 5;
    const isHovered = hoveredNode === name;
    const color = TYPE_COLORS[pos.type] || TYPE_COLORS.utility;
    const hasIssue = issues.some(i => {
      const issueText = typeof i === 'object' ? (i.description || '') : String(i);
      return issueText.toLowerCase().includes(name.toLowerCase());
    });

    return (
      <g
        key={name}
        onMouseEnter={(e) => {
          setHoveredNode(name);
          setTooltipPos({ x: e.clientX, y: e.clientY });
        }}
        onMouseLeave={() => setHoveredNode(null)}
        className="cursor-pointer"
      >
        {/* Node body */}
        <rect
          x={pos.x - 60}
          y={pos.y - 20}
          width={isGodObject ? 140 : 120}
          height={40}
          fill="#0a0a0a"
          stroke={isHovered ? color : '#333'}
          strokeWidth={isHovered ? 2 : 1}
        />
        
        {/* Type indicator */}
        <rect
          x={pos.x - 60}
          y={pos.y - 20}
          width={4}
          height={40}
          fill={color}
        />

        {/* Node label */}
        <text
          x={pos.x}
          y={pos.y + 5}
          textAnchor="middle"
          fill="#F0EDE6"
          fontSize="12"
          fontFamily="JetBrains Mono"
        >
          {name.length > 12 ? name.slice(0, 10) + '…' : name}
        </text>

        {/* God object warning */}
        {isGodObject && (
          <g transform={`translate(${pos.x + 50}, ${pos.y - 30})`}>
            <AlertTriangle className="w-4 h-4 text-amber-400" fill="#E8A020" />
          </g>
        )}

        {/* Issue indicator */}
        {hasIssue && (
          <circle
            cx={pos.x - 50}
            cy={pos.y - 30}
            r={6}
            fill="#E53935"
          />
        )}
      </g>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* SVG Graph */}
      <div className="flex-1 overflow-auto p-4">
        <svg 
          viewBox="0 0 800 500" 
          className="w-full h-full min-h-[400px]"
          style={{ backgroundColor: '#0a0a0a' }}
        >
          {/* Edges */}
          <g className="edges">
            {edges.edges.map((edge, idx) => renderEdge(edge, idx))}
          </g>

          {/* Nodes */}
          <g className="nodes">
            {Object.entries(nodePositions).map(([name, pos]) => renderNode(name, pos))}
          </g>
        </svg>
      </div>

      {/* Node Legend */}
      <div className="border-t border-border-dark p-4">
        <div className="flex flex-wrap gap-4 mb-4">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-3 h-3" style={{ backgroundColor: color }} />
              <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">
                {TYPE_LABELS[type]}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">
              God Object (5+ imports)
            </span>
          </div>
        </div>

        {/* Patterns & Issues */}
        {(patterns_detected.length > 0 || issues.length > 0) && (
          <div className="space-y-3">
            {patterns_detected.length > 0 && (
              <div>
                <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">
                  Patterns Detected
                </span>
                <ul className="mt-1 space-y-1">
                  {patterns_detected.map((pattern, idx) => (
                    <li key={idx} className="font-mono text-xs text-gray-400">
                      • {typeof pattern === 'object' && pattern.name ? pattern.name : String(pattern)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {issues.length > 0 && (
              <div>
                <span className="font-mono text-xs text-red-400 uppercase tracking-widest">
                  Issues
                </span>
                <ul className="mt-1 space-y-1">
                  {issues.map((issue, idx) => (
                    <li key={idx} className="font-mono text-xs text-red-300">
                      • {typeof issue === 'object' && issue.description ? issue.description : String(issue)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tooltip */}
      {hoveredNode && nodePositions[hoveredNode] && (
        <div
          className="fixed z-50 p-3 bg-[#1a1a1a] border border-border-dark max-w-xs pointer-events-none"
          style={{ left: tooltipPos.x + 10, top: tooltipPos.y + 10 }}
        >
          <p className="font-mono text-sm text-text-light font-medium">
            {hoveredNode}
          </p>
          <p className="font-mono text-xs text-gray-500 mt-1">
            {TYPE_LABELS[nodePositions[hoveredNode]?.type] || 'Unknown'}
          </p>
          {nodePositions[hoveredNode]?.node?.responsibilities?.length > 0 && (
            <div className="mt-2">
              <span className="font-mono text-xs text-gray-500 uppercase tracking-wider">
                Responsibilities
              </span>
              <ul className="mt-1 space-y-0.5">
                {nodePositions[hoveredNode].node.responsibilities.map((r, idx) => (
                  <li key={idx} className="font-mono text-xs text-gray-400">
                    • {typeof r === 'object' && r.name ? r.name : String(r)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}