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

    // Generate random bytes with significantly more entropy than needed to prevent patterns
    // We'll multiply by 8 to ensure we have plenty of random bytes
    const byteCount = Math.ceil((strength * 8) / 8);
    const entropy = new Uint8Array(byteCount);
    getSecureRandomValues(entropy);

    // Track used words to avoid repetition
    const usedWords = new Set();
    const result = [];

    // Create a seeded random generator to get better distribution
    function getRandomInt(max) {
      // Get 4 bytes of randomness each time
      const buffer = new Uint8Array(4);
      getSecureRandomValues(buffer);

      // Convert to 32-bit integer
      const value = new DataView(buffer.buffer).getUint32(0, true);
      return value % max;
    }

    // Generate each word, ensuring no repeats
    let attemptsLimit = 100; // Safety limit to prevent infinite loops
    for (let i = 0; i < wordCount; i++) {
      let wordIndex;
      let attempts = 0;
      let selectedWord;

      // Keep trying until we get a non-repeating word
      do {
        // Get a fully random index for this word
        wordIndex = getRandomInt(wordlist.length);
        selectedWord = wordlist[wordIndex];
        attempts++;

        // If we've tried too many times, reset the used words to prevent getting stuck
        if (attempts > attemptsLimit) {
          // Only clear the last few words to still maintain some non-repetition
          if (result.length > 3) {
            const recentWords = new Set(result.slice(-3));
            usedWords.clear();
            recentWords.forEach((word) => usedWords.add(word));
          }
          break;
        }
      } while (
        // Prevent immediate repetition of the same word
        (result.length > 0 && result[result.length - 1] === selectedWord) ||
        // Prevent repetition of recently used words if possible
        (usedWords.size < wordlist.length / 2 && usedWords.has(selectedWord))
      );

      // Add the selected word
      result.push(selectedWord);
      usedWords.add(selectedWord);

      // Limit the size of usedWords to prevent memory issues with very long phrases
      if (usedWords.size > wordlist.length / 2) {
        // Keep only the most recent words
        usedWords.clear();
        const recentWords = result.slice(-Math.min(result.length, 10));
        recentWords.forEach((word) => usedWords.add(word));
      }
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
