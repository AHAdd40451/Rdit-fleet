/**
 * Utility function to extract VIN (Vehicle Identification Number) from OCR text
 * 
 * VINs are 17-character alphanumeric codes that identify vehicles.
 * This function searches for patterns that match VIN format.
 */

export interface VinExtractionResult {
  vin: string | null;
  confidence: 'high' | 'medium' | 'low';
  extractedText: string;
  allCandidates: string[];
}

/**
 * Extracts VIN from OCR text by finding alphanumeric patterns
 * 
 * VIN format: 17 characters, alphanumeric (excluding I, O, Q to avoid confusion)
 * @param ocrText - The text extracted from OCR
 * @returns VIN extraction result with the most likely VIN value
 */
export function extractVinFromOCR(ocrText: string): VinExtractionResult {
  if (!ocrText || ocrText.trim().length === 0) {
    return {
      vin: null,
      confidence: 'low',
      extractedText: '',
      allCandidates: [],
    };
  }

  // Clean the text - keep alphanumeric characters and common separators
  const cleanedText = ocrText
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ') // Keep only alphanumeric and spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // VIN patterns:
  // 1. Exact 17-character alphanumeric sequences (excluding I, O, Q)
  // 2. Sequences that might have spaces or be split across lines
  const vinPatterns = [
    // Pattern 1: Exact 17-character VIN (no spaces)
    /\b[A-HJ-NPR-Z0-9]{17}\b/g,
    // Pattern 2: VIN with spaces (e.g., "1HGBH 41JXMN 109186")
    /\b[A-HJ-NPR-Z0-9]{1,5}\s+[A-HJ-NPR-Z0-9]{1,5}\s+[A-HJ-NPR-Z0-9]{1,5}\s+[A-HJ-NPR-Z0-9]{1,5}\b/g,
    // Pattern 3: Any sequence of 15-19 alphanumeric characters (might be close)
    /\b[A-HJ-NPR-Z0-9]{15,19}\b/g,
  ];

  const allCandidates: string[] = [];
  const seenCandidates = new Set<string>();

  // Extract VIN candidates using all patterns
  vinPatterns.forEach((pattern) => {
    const matches = cleanedText.match(pattern);
    if (matches) {
      matches.forEach((match) => {
        // Remove spaces and check length
        const cleaned = match.replace(/\s+/g, '');
        
        // Filter out invalid characters (I, O, Q)
        if (/[IOQ]/.test(cleaned)) {
          return;
        }
        
        if (cleaned.length === 17 && !seenCandidates.has(cleaned)) {
          seenCandidates.add(cleaned);
          allCandidates.push(cleaned);
        } else if (cleaned.length >= 15 && cleaned.length <= 19 && !seenCandidates.has(cleaned)) {
          // Close matches - might be OCR errors
          seenCandidates.add(cleaned);
          allCandidates.push(cleaned);
        }
      });
    }
  });

  if (allCandidates.length === 0) {
    return {
      vin: null,
      confidence: 'low',
      extractedText: cleanedText,
      allCandidates: [],
    };
  }

  // Prioritize exact 17-character matches
  const exactMatches = allCandidates.filter((v) => v.length === 17);
  
  if (exactMatches.length > 0) {
    // If multiple exact matches, prefer the one that appears first in text
    const bestVin = exactMatches[0];
    
    // Determine confidence
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    
    if (exactMatches.length === 1) {
      // Single exact match - high confidence if it looks valid
      if (isValidVinFormat(bestVin)) {
        confidence = 'high';
      } else {
        confidence = 'medium';
      }
    } else {
      // Multiple exact matches - medium confidence
      confidence = 'medium';
    }

    return {
      vin: bestVin,
      confidence,
      extractedText: cleanedText,
      allCandidates: exactMatches,
    };
  }

  // If no exact matches, use the closest match
  const closestMatch = allCandidates
    .sort((a, b) => {
      // Prefer 17-character matches
      if (a.length === 17 && b.length !== 17) return -1;
      if (b.length === 17 && a.length !== 17) return 1;
      // Prefer longer matches
      return b.length - a.length;
    })[0];

  return {
    vin: closestMatch.length === 17 ? closestMatch : null,
    confidence: 'low',
    extractedText: cleanedText,
    allCandidates,
  };
}

/**
 * Validates VIN format
 * VINs should:
 * - Be exactly 17 characters
 * - Contain only alphanumeric characters (excluding I, O, Q)
 * - Have a reasonable character distribution
 */
function isValidVinFormat(vin: string): boolean {
  if (vin.length !== 17) return false;
  
  // Check for invalid characters
  if (/[IOQ]/.test(vin)) return false;
  
  // Check that it's not all the same character
  if (new Set(vin).size < 5) return false;
  
  // VINs typically have a mix of letters and numbers
  const hasLetters = /[A-Z]/.test(vin);
  const hasNumbers = /[0-9]/.test(vin);
  
  return hasLetters && hasNumbers;
}

/**
 * Simple function to extract the first VIN from OCR text
 * Useful for quick extraction when you just need a VIN
 */
export function extractFirstVin(ocrText: string): string | null {
  const result = extractVinFromOCR(ocrText);
  return result.vin;
}
