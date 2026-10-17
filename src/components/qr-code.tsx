import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

const qr = require('qr.js') as (value: string) => { modules: boolean[][] };

interface QRCodeRealProps {
  value: string;
  size?: number;
  backgroundColor?: string;
  foregroundColor?: string;
}

export default function QRCodeReal({
  value,
  size = 180,
  backgroundColor = '#FFFFFF',
  foregroundColor = '#0F172A',
}: QRCodeRealProps) {
  const modules = useMemo(() => {
    const safeValue = value && value.trim().length > 0 ? value.trim() : 'GL-PROD-0000';
    const generated = qr(safeValue);
    return (generated?.modules || []) as boolean[][];
  }, [value]);

  const count = modules.length || 1;
  const cellSize = size / count;

  return (
    <View style={[styles.wrapper, { width: size + 24, height: size + 24, backgroundColor }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Rect x={0} y={0} width={size} height={size} fill={backgroundColor} />
        {modules.map((row, rowIndex) =>
          row.map((cell, colIndex) =>
            cell ? (
              <Rect
                key={`${rowIndex}-${colIndex}`}
                x={colIndex * cellSize}
                y={rowIndex * cellSize}
                width={cellSize + 0.3}
                height={cellSize + 0.3}
                fill={foregroundColor}
              />
            ) : null
          )
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});