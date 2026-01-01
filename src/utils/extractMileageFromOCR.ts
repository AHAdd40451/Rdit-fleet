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

  // Clean the text - remove common OCR artifacts
  const cleanedText = ocrText
    .replace(/[^\d\s.,]/g, ' ') // Keep only digits, spaces, dots, and commas
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Find all numbers in the text (including those with commas/dots as thousand separators)
  const numberPatterns = [
    // Pattern 1: Numbers with commas (e.g., "123,456")
    /\b\d{1,3}(?:,\d{3})+\b/g,
    // Pattern 2: Numbers with dots (e.g., "123.456")
    /\b\d{1,3}(?:\.\d{3})+\b/g,
    // Pattern 3: Plain numbers (4-7 digits, likely mileage)
    /\b\d{4,7}\b/g,
    // Pattern 4: Any sequence of digits
    /\b\d+\b/g,
  ];

  const allNumbers: number[] = [];
  const seenNumbers = new Set<string>();

  // Extract numbers using all patterns
  numberPatterns.forEach((pattern) => {
    const matches = cleanedText.match(pattern);
    if (matches) {
      matches.forEach((match) => {
        // Remove commas/dots and convert to number
        const cleaned = match.replace(/[,.]/g, '');
        if (!seenNumbers.has(cleaned)) {
          seenNumbers.add(cleaned);
          const num = parseInt(cleaned, 10);
          if (!isNaN(num) && num > 0) {
            allNumbers.push(num);
          }
        }
      });
    }
  });

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
  const likelyMileage = allNumbers
    .filter((num) => num >= 100 && num <= 999999)
    .sort((a, b) => {
      // Prefer numbers in the typical mileage range (10,000 - 200,000)
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

  // Prefer 5-6 digit numbers (most common mileage format)
  const digits = num.toString().length;
  if (digits === 5 || digits === 6) {
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
