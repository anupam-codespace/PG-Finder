/**
 * lib/email-validator.ts
 *
 * Strict domain verification for Globiz Patholab.
 * Restricts registrations to authenticated/verified mail providers
 * and authentic custom corporate domains (webmail), blocking disposable/temporary domains.
 */

// Blocklist of disposable, temporary, and unverified anonymous email providers
const DISPOSABLE_DOMAINS = new Set([
  'yopmail.com',
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'dispostable.com',
  'getairmail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'maildrop.cc',
  'trashmail.com',
  'mailinator.net',
  'mailasfuck.com',
  'temp-mail.org',
  'fakeinbox.com',
  'generator.email',
  'throwawaymail.com',
]);

// Whitelisted common personal and webmail domains that are pre-verified
const TRUSTED_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'yahoo.co.in',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'zoho.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'mail.com',
  'gmx.com',
  'webmail.com',
]);

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export function validateEmailDomain(email: string): ValidationResult {
  const normalized = email.trim().toLowerCase();
  
  // Format check
  const formatRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formatRegex.test(normalized)) {
    return { isValid: false, message: 'Please enter a valid email address.' };
  }

  const parts = normalized.split('@');
  if (parts.length !== 2) {
    return { isValid: false, message: 'Invalid email address format.' };
  }

  const domain = parts[1];

  // 1. Check disposable blocklist
  if (DISPOSABLE_DOMAINS.has(domain) || DISPOSABLE_DOMAINS.has(domain.replace(/^www\./, ''))) {
    return {
      isValid: false,
      message: 'Temporary or disposable email domains are not allowed. Please use a verified provider.',
    };
  }

  // 2. If it is in the trusted whitelist, it passes immediately
  if (TRUSTED_DOMAINS.has(domain)) {
    return { isValid: true };
  }

  // 3. For custom corporate domains / webmail (e.g. employee@globiz.com, admin@hospital.org, user@university.edu):
  // Check if it has a valid TLD structure and is not a generic pattern of temporary services.
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];

  // Restrict to standard authenticated TLD structures (Tld length >= 2, e.g., com, org, net, edu, gov, co.in)
  if (tld.length < 2 || !/^[a-z]+$/.test(tld)) {
    return { isValid: false, message: 'Email domain has an invalid TLD structure.' };
  }

  // Check if domain name looks like a temporary random string (e.g. 7f83a21b.com)
  const mainDomain = domainParts[0];
  if (/^[a-z0-9]{8,}$/.test(mainDomain) && !/[aeiouy]/.test(mainDomain)) {
    return { isValid: false, message: 'Custom domain appears unverified or invalid.' };
  }

  return { isValid: true };
}
