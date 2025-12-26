/**
 * Generate a deterministic UUID from a string (for users without emails)
 * This creates a consistent UUID-like string based on the user's phone number or ID
 * 
 * The generated UUID follows the UUID v4 format: xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx
 * 
 * @param input - The input string (typically phone number or user ID)
 * @returns A deterministic UUID string
 */
export function generateUUIDFromString(input: string): string {
  // Create multiple hash values from the input string
  let hash1 = 0;
  let hash2 = 0;
  let hash3 = 0;
  let hash4 = 0;
  let hash5 = 0;
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash1 = ((hash1 << 5) - hash1) + char;
    hash2 = ((hash2 << 3) - hash2) + char * 7;
    hash3 = ((hash3 << 7) - hash3) + char * 11;
    hash4 = ((hash4 << 2) - hash4) + char * 13;
    hash5 = ((hash5 << 4) - hash5) + char * 17;
    // Convert to 32-bit integers
    hash1 = hash1 & hash1;
    hash2 = hash2 & hash2;
    hash3 = hash3 & hash3;
    hash4 = hash4 & hash4;
    hash5 = hash5 & hash5;
  }
  
  // Generate UUID parts with exact lengths
  // Format: xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx
  const part1 = Math.abs(hash1).toString(16).padStart(8, '0').substring(0, 8);
  const part2 = Math.abs(hash2).toString(16).padStart(4, '0').substring(0, 4);
  const part3 = Math.abs(hash3).toString(16).padStart(3, '0').substring(0, 3);
  const part4 = Math.abs(hash4).toString(16).padStart(3, '0').substring(0, 3);
  const part5 = Math.abs(hash5).toString(16).padStart(12, '0').substring(0, 12);
  
  // Combine with UUID version 4 format markers
  return `${part1}-${part2}-4${part3}-8${part4}-${part5}`;
}

