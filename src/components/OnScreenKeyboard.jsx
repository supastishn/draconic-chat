import { useState } from 'react';
import PropTypes from 'prop-types';

// Helper to check if a char (lowercase) is A-M
const isCharAM = (char) => {
  const c = char.toLowerCase();
  return c >= 'a' && c <= 'm';
};

// Define keyboard layouts
const layouts = {
  lowercase: [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ],
  uppercaseAM: [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map(k => isCharAM(k) ? k.toUpperCase() : ''),
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].map(k => isCharAM(k) ? k.toUpperCase() : ''),
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(k => isCharAM(k) ? k.toUpperCase() : '')
  ],
  symbols: [
    ['+']
    // You can add more symbols or rows here if needed
    // e.g., ['1', '2', '3'], ['@', '#', '$']
  ]
};

function OnScreenKeyboard({ onKeyPress }) {
  const [currentLayout, setCurrentLayout] = useState('lowercase'); // 'lowercase', 'uppercaseAM', 'symbols'

  const handleKeyClick = (key) => {
    if (key) { // Only if key is not empty (for uppercaseAM layout)
      onKeyPress(key);
    }
  };

  const activeLayout = layouts[currentLayout];

  return (
    <div className="onscreen-keyboard">
      <div className="keyboard-layout-switcher">
        <button onClick={() => setCurrentLayout('lowercase')} disabled={currentLayout === 'lowercase'}>a-z</button>
        <button onClick={() => setCurrentLayout('uppercaseAM')} disabled={currentLayout === 'uppercaseAM'}>A-M</button>
        <button onClick={() => setCurrentLayout('symbols')} disabled={currentLayout === 'symbols'}>+</button>
      </div>
      {activeLayout.map((row, rowIndex) => (
        <div key={rowIndex} className="keyboard-row">
          {row.map((key, keyIndex) => (
            <button
              key={`${currentLayout}-${rowIndex}-${keyIndex}`} // Ensure key is unique across layout changes
              className={`keyboard-key ${!key ? 'empty' : ''}`}
              onClick={() => handleKeyClick(key)}
              disabled={!key}
            >
              {key || ''}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

OnScreenKeyboard.propTypes = {
  onKeyPress: PropTypes.func.isRequired,
};

export default OnScreenKeyboard;
