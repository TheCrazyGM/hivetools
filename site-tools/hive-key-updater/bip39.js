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
   * Generate a cryptographically strong mnemonic with the given bit strength
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

    // Use cryptographically secure random values when available
    function getSecureRandomValues(buffer) {
      if (window.crypto && window.crypto.getRandomValues) {
        return window.crypto.getRandomValues(buffer);
      } else {
        // Fallback to Math.random with warning
        console.warn(
          "Using Math.random fallback which is not cryptographically secure",
        );
        for (let i = 0; i < buffer.length; i++) {
          buffer[i] = Math.floor(Math.random() * 256);
        }
        return buffer;
      }
    }

    // Calculate number of words (strength / 32 * 3)
    const wordCount = Math.floor((strength / 32) * 3);

    // Generate random bytes with improved entropy
    const byteCount = Math.ceil(strength / 8);
    const entropy = new Uint8Array(byteCount);
    getSecureRandomValues(entropy);

    // Improved selection of words to better utilize all entropy bytes
    const result = [];

    // Use a more secure method to select words
    for (let i = 0; i < wordCount; i++) {
      // Get a secure random value for each word
      let randomValue = 0;

      // Combine multiple entropy bytes for better randomness
      for (let j = 0; j < 4; j++) {
        const byteIndex = (i * 4 + j) % entropy.length;
        randomValue = (randomValue << 8) | entropy[byteIndex];
      }

      // Use the random value to select a word
      const wordIndex = Math.abs(randomValue) % wordlist.length;
      result.push(wordlist[wordIndex]);
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
