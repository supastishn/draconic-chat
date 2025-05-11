import PropTypes from 'prop-types';

// Define keyboard layouts
const layouts = {
  lowercase: [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ],
  uppercase: [ // Changed from uppercaseAM
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
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
  uppercase: 'Uppercase (A-Z)', // Changed from uppercaseAM
  symbols: 'Symbols',
};

function OnScreenKeyboard({ onKeyPress }) {
  const handleKeyClick = (key) => {
    if (key) { // Key could be empty string if layout defined it, but our layouts are full chars
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
