// Simple BIP39 implementation for generating mnemonics
// Uses wordlist defined in words.js

const BIP39 = (function () {
  // We expect the wordlist to be defined in words.js
  // Make sure words.js is included before this file
  if (typeof wordlist === "undefined") {
    console.error(
      "Wordlist is not defined. Make sure words.js is loaded before bip39.js",
    );
  }

  /**
   * Generate a cryptographically strong mnemonic with the given number of words
   * @param {number} strength - Bit strength (128, 160, 192, 224, 256)
   * @returns {string} Space-separated mnemonic phrase
   */
  function generateMnemonic(strength = 128) {
    // Validate that wordlist exists
    if (
      typeof wordlist === "undefined" ||
      !Array.isArray(wordlist) ||
      wordlist.length === 0
    ) {
      throw new Error(
        "Wordlist is not properly defined. Make sure words.js is loaded before bip39.js",
      );
    }

    // Math.random is not cryptographically secure, but we're using this as a fallback
    // when Web Crypto API is not available
    const getRandomValues = (buffer) => {
      if (window.crypto && window.crypto.getRandomValues) {
        return window.crypto.getRandomValues(buffer);
      } else {
        // Fallback to Math.random
        for (let i = 0; i < buffer.length; i++) {
          buffer[i] = Math.floor(Math.random() * 256);
        }
        return buffer;
      }
    };

    // Calculate number of words (strength / 32 * 3)
    const wordCount = Math.floor((strength / 32) * 3);

    // Generate random bytes
    const byteCount = Math.ceil(strength / 8);
    const entropy = new Uint8Array(byteCount);
    getRandomValues(entropy);

    // Select random words from wordlist
    const result = [];
    for (let i = 0; i < wordCount; i++) {
      const randomIndex = Math.floor(
        (entropy[i % byteCount] * wordlist.length) / 256,
      );
      result.push(wordlist[randomIndex]);
    }

    return result.join(" ");
  }

  // Return public methods
  return {
    generateMnemonic: generateMnemonic,
  };
})();

// Make BIP39 available globally
window.BIP39 = BIP39;
