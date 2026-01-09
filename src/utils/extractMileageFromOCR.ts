/**
 * Utility function to extract mileage/odometer reading from OCR text
 * 
 * This function searches for numeric patterns that look like mileage readings
 * and returns the most likely mileage value.
 */

export interface MileageExtractionResult {
  mileage: number | null;
  confidence: 'high' | 'medium' | 'low';
  extractedText: string;
  allNumbers: number[];
}

/**
 * Extracts mileage from OCR text by finding numeric patterns
 * 
 * @param ocrText - The text extracted from OCR
 * @returns Mileage extraction result with the most likely mileage value
 */
export function extractMileageFromOCR(ocrText: string): MileageExtractionResult {
  if (!ocrText || ocrText.trim().length === 0) {
    return {
      mileage: null,
      confidence: 'low',
      extractedText: '',
      allNumbers: [],
    };
  }

  // Log the raw OCR text for debugging
  console.log('Raw OCR text:', ocrText);

  // Clean the text - remove common OCR artifacts but preserve digit sequences
  // First, try to merge digits that might be split by spaces
  let cleanedText = ocrText
    .replace(/[^\d\s.,]/g, ' ') // Keep only digits, spaces, dots, and commas
    .trim();

  // Try to merge digits separated by spaces (common OCR error)
  // This handles cases like "1 60648" -> "160648" or "1  60648" -> "160648"
  // Keep merging until no more changes (handles multiple spaces)
  let previousText = '';
  while (cleanedText !== previousText) {
    previousText = cleanedText;
    cleanedText = cleanedText.replace(/(\d)\s+(\d)/g, '$1$2');
  }
  
  // Normalize remaining whitespace
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();

  console.log('Cleaned OCR text:', cleanedText);

  // Find all numbers in the text (including those with commas/dots as thousand separators)
  const numberPatterns = [
    // Pattern 1: Numbers with commas (e.g., "123,456")
    /\b\d{1,3}(?:,\d{3})+\b/g,
    // Pattern 2: Numbers with dots (e.g., "123.456")
    /\b\d{1,3}(?:\.\d{3})+\b/g,
    // Pattern 3: Long continuous digit sequences (4-8 digits, likely mileage)
    // Use non-word-boundary to catch numbers at start/end of text
    /(?<!\d)\d{4,8}(?!\d)/g,
    // Pattern 4: Plain numbers (4-7 digits, likely mileage) with word boundaries
    /\b\d{4,7}\b/g,
    // Pattern 5: Any sequence of digits (fallback)
    /\d+/g,
  ];

  const allNumbers: number[] = [];
  const seenNumbers = new Set<string>();

  // Extract numbers using all patterns
  numberPatterns.forEach((pattern) => {
    const matches = cleanedText.match(pattern);
    if (matches) {
      matches.forEach((match) => {
        // Remove commas/dots and convert to number
        const cleaned = match.replace(/[,.]/g, '').trim();
        if (cleaned && !seenNumbers.has(cleaned)) {
          seenNumbers.add(cleaned);
          const num = parseInt(cleaned, 10);
          if (!isNaN(num) && num > 0) {
            allNumbers.push(num);
          }
        }
      });
    }
  });

  console.log('Extracted numbers:', allNumbers);

  if (allNumbers.length === 0) {
    return {
      mileage: null,
      confidence: 'low',
      extractedText: cleanedText,
      allNumbers: [],
    };
  }

  // Filter and prioritize likely mileage values
  // Mileage is typically:
  // - Between 0 and 1,000,000 (reasonable range for vehicles)
  // - Often 4-6 digits
  // - Not too small (likely not a year or small number)
  // - Prefer longer numbers (more complete readings)
  const likelyMileage = allNumbers
    .filter((num) => num >= 100 && num <= 999999)
    .sort((a, b) => {
      // First, prefer longer numbers (more digits = more complete reading)
      const aDigits = a.toString().length;
      const bDigits = b.toString().length;
      if (aDigits !== bDigits) {
        return bDigits - aDigits; // Longer numbers first
      }
      // If same length, use mileage score
      const aScore = getMileageScore(a);
      const bScore = getMileageScore(b);
      return bScore - aScore;
    });

  if (likelyMileage.length === 0) {
    // If no numbers in typical range, use the largest reasonable number
    const reasonableNumbers = allNumbers.filter((num) => num <= 999999);
    if (reasonableNumbers.length > 0) {
      const maxNum = Math.max(...reasonableNumbers);
      return {
        mileage: maxNum,
        confidence: 'low',
        extractedText: cleanedText,
        allNumbers: allNumbers.sort((a, b) => b - a),
      };
    }
  }

  const bestMileage = likelyMileage[0];
  
  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'low';
  
  if (likelyMileage.length === 1) {
    // Only one candidate - high confidence if in good range
    if (bestMileage >= 1000 && bestMileage <= 500000) {
      confidence = 'high';
    } else {
      confidence = 'medium';
    }
  } else if (likelyMileage.length > 1) {
    // Multiple candidates - check if the top one is clearly the best
    const topScore = getMileageScore(bestMileage);
    const secondScore = getMileageScore(likelyMileage[1]);
    
    if (topScore > secondScore * 1.5) {
      confidence = 'high';
    } else {
      confidence = 'medium';
    }
  }

  return {
    mileage: bestMileage,
    confidence,
    extractedText: cleanedText,
    allNumbers: allNumbers.sort((a, b) => b - a),
  };
}

/**
 * Scores a number based on how likely it is to be a mileage reading
 * Higher score = more likely to be mileage
 */
function getMileageScore(num: number): number {
  let score = 0;

  // Ideal range for vehicle mileage (10,000 - 200,000)
  if (num >= 10000 && num <= 200000) {
    score += 100;
  } else if (num >= 1000 && num <= 500000) {
    score += 50;
  } else if (num >= 100 && num <= 999999) {
    score += 25;
  }

  // Prefer 6-digit numbers (most common for higher mileage)
  // Then 5-digit numbers
  const digits = num.toString().length;
  if (digits === 6) {
    score += 40; // Highest preference for 6-digit numbers
  } else if (digits === 5) {
    score += 30;
  } else if (digits === 4 || digits === 7) {
    score += 15;
  }

  // Penalize very small numbers (likely not mileage)
  if (num < 100) {
    score -= 50;
  }

  // Penalize very large numbers (unlikely to be mileage)
  if (num > 500000) {
    score -= 30;
  }

  return score;
}

/**
 * Simple function to extract the first reasonable number from OCR text
 * Useful for quick extraction when you just need a number
 */
export function extractFirstMileage(ocrText: string): number | null {
  const result = extractMileageFromOCR(ocrText);
  return result.mileage;
}
