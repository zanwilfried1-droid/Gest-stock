/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Code 128 (Subset B) simplified SVG barcode generator
// Standard Code 128 patterns (each pattern is 11 modules wide, represented by bar widths)
const CODE128_PATTERNS: { [char: string]: string } = {
  ' ': '212222', '!': '222122', '"': '222221', '#': '121223', '$': '121322',
  '%': '131222', '&': '122213', "'": '122312', '(': '132212', ')': '221213',
  '*': '221312', '+': '231212', ',': '112232', '-': '122132', '.': '122231',
  '/': '113222', '0': '123122', '1': '123221', '2': '223211', '3': '221132',
  '4': '221231', '5': '213212', '6': '223112', '7': '312131', '8': '311222',
  '9': '321122', ':': '321221', ';': '312212', '<': '322112', '=': '322211',
  '>': '212123', '?': '212321', '@': '232121', 'A': '111323', 'B': '131123',
  'C': '131321', 'D': '112313', 'E': '132113', 'F': '132311', 'G': '211313',
  'H': '231113', 'I': '231311', 'J': '112133', 'K': '112331', 'L': '132131',
  'M': '113123', 'N': '113321', 'O': '133121', 'P': '313121', 'Q': '211331',
  'R': '231131', 'S': '213113', 'T': '213311', 'U': '213131', 'V': '311123',
  'W': '311321', 'X': '331121', 'Y': '312113', 'Z': '312311', '[': '332111',
  '\\': '314111', ']': '221411', '^': '431111', '_': '111224', '`': '111422',
  'a': '121124', 'b': '121421', 'c': '141122', 'd': '141221', 'e': '112214',
  'f': '112412', 'g': '122114', 'h': '122411', 'i': '142112', 'j': '142211',
  'k': '241211', 'l': '221114', 'm': '413111', 'n': '241112', 'o': '134111',
  'p': '111242', 'q': '121142', 'r': '121241', 's': '114212', 't': '124112',
  'u': '124211', 'v': '411212', 'w': '421112', 'x': '421211', 'y': '212141',
  'z': '214121', '{': '412121', '|': '111143', '}': '111341', '~': '131141',
  'START_B': '211214',
  'STOP': '2331112'
};

/**
 * Generate standard SVG barcode rect elements
 */
export function generateBarcodeSvgPath(text: string, height: number = 50): {
  rects: { x: number; width: number; height: number }[];
  totalWidth: number;
} {
  const cleanText = text.trim() || '000000';
  const patterns: string[] = [CODE128_PATTERNS['START_B']];

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    patterns.push(CODE128_PATTERNS[char] || CODE128_PATTERNS[' ']);
  }
  patterns.push(CODE128_PATTERNS['STOP']);

  const rects: { x: number; width: number; height: number }[] = [];
  let currentX = 10; // Quiet zone
  const moduleWidth = 2;

  patterns.forEach((pattern) => {
    let isBar = true;
    for (let i = 0; i < pattern.length; i++) {
      const width = parseInt(pattern[i], 10) * moduleWidth;
      if (isBar) {
        rects.push({ x: currentX, width, height });
      }
      currentX += width;
      isBar = !isBar;
    }
  });

  currentX += 10; // Right quiet zone

  return {
    rects,
    totalWidth: currentX
  };
}

/**
 * Helper to generate random EAN-13-like barcode for new products
 */
export function generateRandomBarcode(): string {
  const prefix = '20'; // In-store prefix
  let code = prefix;
  for (let i = 0; i < 10; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  // Compute checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checksum = (10 - (sum % 10)) % 10;
  return code + checksum.toString();
}
