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

// Titles for each layout section
const layoutTitles = {
  lowercase: 'Lowercase (a-z)',
  uppercaseAM: 'Uppercase (A-M)',
  symbols: 'Symbols',
};

function OnScreenKeyboard({ onKeyPress }) {
  const handleKeyClick = (key) => {
    if (key) { // Only if key is not empty (for uppercaseAM layout)
      onKeyPress(key);
    }
  };

  return (
    <div className="onscreen-keyboard">
      {Object.entries(layouts).map(([layoutName, layoutRows]) => (
        <div key={layoutName} className="keyboard-section">
          <h4 className="keyboard-section-title">{layoutTitles[layoutName] || layoutName}</h4>
          {layoutRows.map((row, rowIndex) => (
            <div key={`${layoutName}-row-${rowIndex}`} className="keyboard-row">
              {row.map((keyChar, keyIndex) => (
                <button
                  key={`${layoutName}-key-${rowIndex}-${keyIndex}-${keyChar || 'empty'}`}
                  className={`keyboard-key ${!keyChar ? 'empty' : ''}`}
                  onClick={() => handleKeyClick(keyChar)}
                  disabled={!keyChar}
                >
                  {keyChar || ''}
                </button>
              ))}
            </div>
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
