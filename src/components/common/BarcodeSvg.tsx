/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { generateBarcodeSvgPath } from '../../utils/barcode';

interface BarcodeSvgProps {
  value: string;
  height?: number;
  showText?: boolean;
  className?: string;
}

export const BarcodeSvg: React.FC<BarcodeSvgProps> = ({
  value,
  height = 42,
  showText = true,
  className = '',
}) => {
  const { rects, totalWidth } = generateBarcodeSvgPath(value, height);

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full h-auto max-h-12"
        style={{ minWidth: Math.min(totalWidth, 140) }}
        preserveAspectRatio="none"
      >
        <rect x="0" y="0" width={totalWidth} height={height} fill="#ffffff" />
        {rects.map((rect, idx) => (
          <rect
            key={idx}
            x={rect.x}
            y={0}
            width={rect.width}
            height={rect.height}
            fill="#000000"
          />
        ))}
      </svg>
      {showText && (
        <span className="font-mono text-[10px] tracking-widest text-slate-700 dark:text-slate-300 mt-0.5">
          {value}
        </span>
      )}
    </div>
  );
};
