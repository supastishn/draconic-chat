import PropTypes from 'prop-types';

// Define keyboard layouts based on provided mappings
// Keys display the Latin character; pressing them inputs that same Latin character.
// The 'Draconic' font handles the visual transformation in the input/chat.
// '' represents a blank key. Unlisted keys are removed.

const layouts = {
  lowercase: [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', ''], // p is blank
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ],
  uppercase: [
    ['Q', '', 'E', 'R', 'T', /* Y removed */ 'U', 'I', 'O', ''], // W, P are blank; Y is not mapped
    ['A', 'S', '', 'F', '', 'H', '', 'K', 'L'], // D, G, J are blank
    [/* Z removed */ 'X', '', '', '', '', ''] // C, V, B, N, M are blank; Z is not mapped
  ],
  symbols: [
    [',', '.']
  ]
};

// Titles for each layout section
const layoutTitles = {
  lowercase: 'Lowercase',
  uppercase: 'Uppercase',
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
