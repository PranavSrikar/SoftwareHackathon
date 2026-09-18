/**
 * PHONE NUMBER PRIVACY & VALIDATION UTILITIES
 * Enforces privacy rules: Masks phone numbers (+91 ******4821)
 * Validates Indian (+91) & International formats
 */

export function maskPhoneNumber(phone?: string): string {
  if (!phone) return '+91 ******0000';
  
  // Clean phone number
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  if (cleaned.length < 8) {
    return '+91 ******' + cleaned.slice(-4);
  }
  
  const last4 = cleaned.slice(-4);
  const prefix = cleaned.startsWith('+91') ? '+91 ' : (cleaned.startsWith('+') ? cleaned.slice(0, 3) + ' ' : '+91 ');
  
  return `${prefix}******${last4}`;
}

export function validatePhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  
  // Clean spaces, hyphens
  const cleaned = phone.trim().replace(/[\s\-]/g, '');
  
  // Match standard E.164 or Indian 10-digit / +91
  const indianRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
  const globalE164Regex = /^\+[1-9]\d{7,14}$/;
  
  return indianRegex.test(cleaned) || globalE164Regex.test(cleaned);
}

export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '+919876543210';
  
  let cleaned = phone.trim().replace(/[\s\-\(\)]/g, '');
  
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = '+' + cleaned;
    } else if (cleaned.length === 10) {
      cleaned = '+91' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }
  
  return cleaned;
}
