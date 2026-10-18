import { dashboardStyles } from '@/styles/dashboard';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export function NotificationBell({ isDark = true }: { isDark?: boolean }) {
  return (
    <View style={dashboardStyles.notificationBellIcon}>
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" fill="none" stroke={isDark ? '#f5f5f7' : '#0f172a'} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

export function ActionGlyph({ name, isDark = true }: { name: 'edit' | 'delete' | 'qr'; isDark?: boolean }) {
  const strokeColor = name === 'delete' ? '#ef4444' : name === 'qr' ? '#0071e3' : (isDark ? '#f5f5f7' : '#0f172a');
  const common = { stroke: strokeColor, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
  return (
    <View style={dashboardStyles.actionGlyph}>
      <Svg width={18} height={18} viewBox="0 0 24 24">
        {name === 'edit' && <Path {...common} d="m14 5 5 5M4 20l4.2-.9L19 8.3a2.1 2.1 0 0 0-3-3L5.2 16.1 4 20Z" />}
        {name === 'delete' && <Path {...common} d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />}
        {name === 'qr' && <Path {...common} d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 14h3v3h-3zM14 18h3v3h-3zM18 18h3v3h-3z" />}
      </Svg>
    </View>
  );
}

export function NavGlyph({ name, active = false, isDark = true }: { name: string; active?: boolean; isDark?: boolean }) {
  const color = active ? (isDark ? '#ffffff' : '#0071e3') : (isDark ? '#86868b' : '#64748b');
  const common = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <View style={dashboardStyles.navGlyphBox}>
      <Svg width={20} height={20} viewBox="0 0 24 24">
        {name === 'overview' && <Path {...common} d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />}
        {name === 'producers' && <><Circle {...common} cx="9" cy="8" r="3" /><Path {...common} d="M3.5 20v-1.5A5.5 5.5 0 0 1 9 13h1a5.5 5.5 0 0 1 5.5 5.5V20M16 5.5a3 3 0 0 1 0 5.8M17 14a4.5 4.5 0 0 1 3.5 4.5V20" /></>}
        {name === 'orchards' && <Path {...common} d="M12 20v-8M12 12C6 12 5 8 5 5c4 0 7 1 7 7ZM12 14c0-5 3-8 8-8 0 5-2 8-8 8ZM5 20h14" />}
        {name === 'shipments' && <><Path {...common} d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><Circle {...common} cx="7" cy="19" r="1.5" /><Circle {...common} cx="18" cy="19" r="1.5" /></>}
        {name === 'payments' && <><Path {...common} d="M4 5h16v14H4z" /><Path {...common} d="M3 9h18M16 14h2M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></>}
        {name === 'reports' && <Path {...common} d="M4 19h16M6 16v-4M10 16V8M14 16v-6M18 16V5" />}
        {name === 'users' && <><Circle {...common} cx="9" cy="8" r="3" /><Path {...common} d="M3.5 20v-1.5A5.5 5.5 0 0 1 9 13h1a5.5 5.5 0 0 1 5.5 5.5V20M16 5.5a3 3 0 0 1 0 5.8M17 14a4.5 4.5 0 0 1 3.5 4.5V20" /></>}
        {name === 'role-producer' && <><Circle {...common} cx="12" cy="7" r="3" /><Path {...common} d="M5 20v-1.5a7 7 0 0 1 14 0V20M12 13v4m-2-2h4" /></>}
        {name === 'role-packer' && <Path {...common} d="M4 20h16M6 20V9l6-5 6 5v11M9 20v-5h6v5M9 10h.01M15 10h.01" />}
        {name === 'collapse' && <Path {...common} d="m14 5-7 7 7 7M20 5v14" />}
        {name === 'expand' && <Path {...common} d="m10 5 7 7-7 7M4 5v14" />}
        {name === 'logout' && <Path {...common} d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M14 7l5 5-5 5M8 12h11" />}
        {name === 'key' && <><Circle {...common} cx="8" cy="15" r="4" /><Path {...common} d="m11 12 8-8 2 2-2 2 2-3 3-2-2-3 3M8 15h.01" /></>}
        {name === 'disable' && <><Circle {...common} cx="12" cy="12" r="9" /><Path {...common} d="m6 6 12 12" /></>}
        {name === 'enable' && <><Circle {...common} cx="12" cy="12" r="9" /><Path {...common} d="m8 12 2.5 2.5L16.5 9" /></>}
      </Svg>
    </View>
  );
}

export function StatGlyph({ name, isDark = true }: { name: string; isDark?: boolean }) {
  const color = name === 'wallet' ? '#d97706' : name === 'farmers' ? '#db2777' : (isDark ? '#38bdf8' : '#0071e3');
  const common = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      {name === 'weight' && <Path {...common} d="M12 4v15M5 7h14M7 7l-4 8h8L7 7ZM17 7l-4 8h8l-4-8ZM8 20h8" />}
      {name === 'truck' && <><Path {...common} d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><Circle {...common} cx="7" cy="19" r="1.7" /><Circle {...common} cx="18" cy="19" r="1.7" /></>}
      {name === 'wallet' && <><Path {...common} d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v15H6.5A2.5 2.5 0 0 1 4 16.5zM4 7h14a2 2 0 0 1 2 2v2h-6a2.5 2.5 0 0 0 0 5h6" /><Circle cx="14" cy="13.5" r=".8" fill={color} /></>}
      {name === 'farmers' && <><Circle {...common} cx="9" cy="8" r="3" /><Path {...common} d="M3.5 20v-1.5A5.5 5.5 0 0 1 9 13h1a5.5 5.5 0 0 1 5.5 5.5V20M16 5.5a3 3 0 0 1 0 5.8M17 14a4.5 4.5 0 0 1 3.5 4.5V20" /></>}
      {name === 'orchards' && <Path {...common} d="M12 20v-8M12 12C6 12 5 8 5 5c4 0 7 1 7 7ZM12 14c0-5 3-8 8-8 0 5-2 8-8 8ZM5 20h14" />}
    </Svg>
  );
}

export function QrMatrixSvg({ value, size = 180 }: { value: string; size?: number }) {
  const gridSize = 21;
  const cells: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          cells[r0 + r][c0 + c] = true;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, gridSize - 7);
  drawFinder(gridSize - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const inFinder = (r < 8 && c < 8) || (r < 8 && c >= gridSize - 8) || (r >= gridSize - 8 && c < 8);
      if (!inFinder) {
        const seed = Math.imul(hash ^ (r * 31 + c * 17), 1597334677);
        const charFactor = value.charCodeAt((r * gridSize + c) % Math.max(1, value.length)) || 1;
        cells[r][c] = ((Math.abs(seed) + charFactor) % 2) === 0;
      }
    }
  }

  const cellSize = size / gridSize;

  return (
    <View style={{ padding: 12, backgroundColor: '#ffffff', borderRadius: 16 }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Rect x={0} y={0} width={size} height={size} fill="#ffffff" />
        {cells.map((row, rIdx) =>
          row.map((filled, cIdx) =>
            filled ? (
              <Rect
                key={`${rIdx}-${cIdx}`}
                x={cIdx * cellSize}
                y={rIdx * cellSize}
                width={cellSize + 0.4}
                height={cellSize + 0.4}
                fill="#0f172a"
              />
            ) : null
          )
        )}
      </Svg>
    </View>
  );
}