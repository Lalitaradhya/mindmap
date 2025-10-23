import { iconMap, democracyPrimaryBranches, PRIMARY_RADIUS, SECONDARY_OFFSET, SECONDARY_COLORS } from './constants.js';

// Function to get icon emoji from text
function getIconEmoji(iconText) {
  if (!iconText) return iconMap.default || '📌';

  // Check if iconText is already an emoji
  const emojiRegex = /\p{Emoji}/u;
  if (emojiRegex.test(iconText)) {
    return iconText;
  }

  // Otherwise, try to map from text description
  const lowerIcon = iconText.toLowerCase().trim();
  return iconMap[lowerIcon] || iconMap.default ;
}

function lightenColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

export function buildElements(word, meaning, synonyms, primaryBranches = [], expandedNodes = {}, handleToggleExpand = () => {}) {
  // Move the center a bit higher and keep a reasonable x so the map clears bottom UI
  const center = { x: 800, y: 350 };

  // Define secondary colors for synonym nodes
  const secondaryColors = SECONDARY_COLORS;

  // Special extended layout for when primaryBranches are provided or for Democracy
  if (primaryBranches.length > 0 || (word && word.toLowerCase() === 'democracy')) {
    const primary = primaryBranches.length > 0 ? primaryBranches : democracyPrimaryBranches;

  // layout parameters: increase primary radius and secondary offset to avoid overlap
  const primaryRadius = PRIMARY_RADIUS; // push primary branches further out
  const secondaryOffset = SECONDARY_OFFSET; // distance from primary node to secondary nodes (increase)

  const nodes = [
    {
      id: 'center',
      data: { label: <strong style={{ color: '#fff', fontSize: 18 }}>{word}</strong> },
      position: center,
      style: {
        background: '#4577c3b4',
        color: '#fff',
        padding: 12,
        borderRadius: '50%',
        border: '3px solid #528ecbe1',
        width: 160,
        height: 160,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      },
    },
  ];    const edges = [];

    primary.forEach((p, idx) => {
      const angle = (idx / primary.length) * Math.PI * 2 - Math.PI / 2; // start at top
      const px = center.x + Math.cos(angle) * primaryRadius;
      const py = center.y + Math.sin(angle) * primaryRadius;

      nodes.push({
        id: p.id,
        type: 'primaryNode',
        data: {
          label: (
            <div style={{ textAlign: 'center', color: '#263238' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: p.color }}>{getIconEmoji(p.icon)}</div>
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600 }}>{p.title}</div>
            </div>
          ),
          // children as objects so CreateFlow.toggleChildren can expand them
          children: p.items.map((it) => ({ label: it, tooltip: it })),
          collapsed: true,
          angle,
          tooltip: p.title,
          color: p.color,
          onToggle: () => handleToggleExpand(p.id),
          isExpanded: expandedNodes[p.id] || false,
        },
        position: { x: px, y: py },
      });

  edges.push({ id: `e-center-${p.id}`, source: 'center', target: p.id, animated: true, type: 'default', style: { stroke: p.color, strokeWidth: 3 } });

      // Secondary nodes - only add if primary is expanded
      if (expandedNodes[p.id]) {
        p.items.forEach((item, sidx) => {
          const spread = p.items.length;
          // Position secondaries spread more widely around primary angle
          const secAngle = angle + ((sidx - (spread - 1) / 2) * 0.45);
          const sx = px + Math.cos(secAngle) * secondaryOffset;
          const sy = py + Math.sin(secAngle) * secondaryOffset + (sidx % 2 === 0 ? -12 : 12);
          const sid = `${p.id}-s-${sidx}`;

          nodes.push({
            id: sid,
            data: {
              label: (
                <div style={{ color: 'black', textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{item}</div>
                </div>
              ),
            },
            position: { x: sx, y: sy },
            style: {
              background: lightenColor(p.color, 20 + sidx * 20),
              color: p.color,
              border: `1px solid ${lightenColor(p.color, 10)}`,
              padding: 8,
              borderRadius: 8,
              width: 220,
              textAlign: 'left',
            },
          });

    edges.push({ id: `e-${p.id}-${sid}`, source: p.id, target: sid, animated: true, type: 'default', style: { stroke: p.color, strokeWidth: 2 } });
        });
      }
    });

    return { nodes, edges };
  }

  // Fallback: original simple layout
  const nodes = [
    {
      id: 'center',
      data: { label: <strong style={{ color: '#fff' }}>{word}</strong> },
      position: center,
      style: {
        background: '#1565c0',
        color: '#fff',
        padding: 10,
        borderRadius: 8,
        border: '2px solid #42a5f5',
        width: 160,
        textAlign: 'center',
      },
    },
    {
      id: 'meaning',
      data: {
        label: (
          <div style={{ color: 'black' }}>
            <strong style={{ fontSize: '14px' }}>Meaning</strong>
            <div style={{ fontWeight: 400, fontSize: '14px' }}>{meaning}</div>
          </div>
        ),
      },
      position: { x: center.x, y: center.y - 140 },
      style: {
        background: '#e8f4ff',
        color: '#0d47a1',
        border: '1px solid #90caf9',
        padding: 8,
        borderRadius: 8,
        width: 260,
      },
    },
  ];

  const synonymNodes = synonyms.map((s, i) => ({
    id: `syn-${i}`,
    data: { label: <div style={{ color: 'black', fontWeight: 700, fontSize: '14px' }}>{s}</div> },
    position: { x: 120 + i * 200, y: center.y + 140 },
    style: {
      background: secondaryColors[i % secondaryColors.length],
      color: '#0d47a1',
      border: '1px solid #bbdefb',
      padding: 8,
      borderRadius: 8,
      width: 140,
      textAlign: 'center',
    },
  }));

  const edges = [
    { id: 'e-center-meaning', source: 'center', target: 'meaning', animated: true, style: { stroke: '#42a5f5' } },
    ...synonymNodes.map((n) => ({ id: `e-center-${n.id}`, source: 'center', target: n.id, animated: true, style: { stroke: '#90caf9' } })),
  ];

  return { nodes: [...nodes, ...synonymNodes], edges };
}