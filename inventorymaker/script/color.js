/**
 * Code for handling strings with color
 * codes
 */

/**
 * Represents rich text, has color, format,
 * etc...
 * @typedef {Object} RichText
 * @property {boolean} empty Specifies if the
 * text is empty
 * @property {any} output The output data
 */

// color char constant
const COLOR_CHAR = '&';

// special codes
const STRIKETHROUGH = 'm';
const ITALIC = 'o';
const BOLD = 'l';
const UNDERLINE = 'n';

/**
 * Object containing all color characters
 * and their hex color
 */
const COLORS = {
    '0': '000000', // black
    '1': '0000AA', // dark blue
    '2': '00AA00', // dark green
    '3': '00AAAA', // dark aqua
    '4': 'AA0000', // dark red
    '5': 'AA00AA', // dark purple
    '6': 'FFAA00', // gold
    '7': 'AAAAAA', // gray
    '8': '555555', // dark gray
    '9': '5555FF', // blue
    'a': '55FF55', // green
    'b': '55FFFF', // aqua
    'c': 'FF5555', // red
    'd': 'FF55FF', // light purple
    'e': 'FFFF55', // yellow
    'f': 'FFFFFF', // white
    'r': 'FFFFFF' // reset = white
};

/**
 * Colorizes the given input
 * @param {string} input The string input
 * @return {string} The HTML output
 */
function colorize(input) {
    const output = [];
    let suffixes = [];

    for (let i = 0; i < input.length; i++) {
        const current = input.charAt(i);

        if (current !== COLOR_CHAR) {
            // not a color char, just push it
            output.push(current);
            continue;
        }

        const nextIndex = ++i;
        if (nextIndex >= input.length) {
            // last character, push it and the
            // current suffixes
            output.push(current);
            while (suffixes.length > 0) {
                output.push(suffixes.pop());
            }
            continue;
        }

        const code = input.charAt(nextIndex);
        const hex = COLORS[code];

        if (hex) {
            // push the previous prefixes
            while (suffixes.length > 0) {
                output.push(suffixes.pop());
            }

            // push the prefix
            output.push(`<span style="color: #${hex}">`);
            // push the suffix
            suffixes.push('</span>')
        } else {
            // now lets check if its a special code
            switch (code) {
                case STRIKETHROUGH: {
                    output.push('<span style="text-decoration: line-through;">');
                    suffixes.push('</span>');
                    break;
                }
                case ITALIC: {
                    output.push('<i>');
                    suffixes.push('</i>');
                    break;
                }
                case BOLD: {
                    output.push('<b>');
                    suffixes.push('</b>');
                    break;
                }
                case UNDERLINE: {
                    output.push('<span style="text-decoration: underline;">');
                    suffixes.push('</span>');
                    break;
                }
                default: {
                    // not a code, push everything
                    output.push(current);
                    output.push(code);
                }
            }
        }
    }
    // concatenation in some browsers is a
    // bit slow, so use an array and join it
    return output.join('') + suffixes.reverse().join('');
}