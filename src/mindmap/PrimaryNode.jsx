import React from 'react';
import { Handle, Position } from 'reactflow';

const PrimaryNode = ({ data }) => {
  const { label, onToggle, isExpanded, color } = data;

  return (
    <div
      style={{
        background: '#fff',
        color: '#3d5b6aa8',
        border: `2px solid ${color}`,
        padding: 8,
        borderRadius: 12,
        width: 160,
        textAlign: 'center',
        cursor: 'pointer',
        position: 'relative',
      }}
      onClick={onToggle}
    >
      <Handle type="target" position={Position.Top} />
      {label}
      <div
        style={{
          position: 'absolute',
          top: 5,
          right: 5,
          fontSize: 12,
          color: color,
          fontWeight: 'bold',
        }}
      >
        {isExpanded ? 'Collapse' : 'Expand'}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default PrimaryNode;
