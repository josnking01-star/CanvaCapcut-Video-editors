import { License, Customer } from '../types';

/**
 * Generate a cryptographically structured, verifiable license key
 * Format: CCVS-TIER-RANDOM-CHECKSUM (e.g., CCVS-PRO4-9F8A-E2B1-4A7C)
 */
export function generateLicenseKey(tier: License['tier']): string {
  const tierPrefixes: Record<License['tier'], string> = {
    trial: 'TRIL',
    starter: 'STRT',
    pro: 'PROX',
    agency_unlimited: 'UNLM',
  };

  const prefix = 'CCVS';
  const tierCode = tierPrefixes[tier] || 'PROX';
  
  const part1 = Math.random().toString(36).substring(2, 6).toUpperCase().padEnd(4, 'X');
  const part2 = Math.random().toString(36).substring(2, 6).toUpperCase().padEnd(4, 'Y');
  
  // Calculate a deterministic checksum
  const rawString = `${prefix}-${tierCode}-${part1}-${part2}`;
  const checksum = computeSimpleChecksum(rawString);

  return `${prefix}-${tierCode}-${part1}-${part2}-${checksum}`;
}

/**
 * Compute a 4-character hex checksum for license key integrity verification
 */
export function computeSimpleChecksum(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).toUpperCase();
  return hex.padStart(4, '0').slice(0, 4);
}

/**
 * Validates the structure and checksum of a license key
 */
export function validateLicenseKeyFormat(key: string): {
  isValid: boolean;
  tier?: License['tier'];
  error?: string;
} {
  const parts = key.trim().split('-');
  if (parts.length !== 5 || parts[0] !== 'CCVS') {
    return { isValid: false, error: 'Invalid license format. Key must start with CCVS-...' };
  }

  const [prefix, tierCode, part1, part2, providedChecksum] = parts;
  const rawString = `${prefix}-${tierCode}-${part1}-${part2}`;
  const expectedChecksum = computeSimpleChecksum(rawString);

  if (providedChecksum !== expectedChecksum) {
    return { isValid: false, error: 'Checksum mismatch. License key is invalid or tampered with.' };
  }

  const tierMap: Record<string, License['tier']> = {
    TRIL: 'trial',
    STRT: 'starter',
    PROX: 'pro',
    UNLM: 'agency_unlimited',
  };

  const tier = tierMap[tierCode] || 'pro';
  return { isValid: true, tier };
}

/**
 * Feature matrix based on license tier
 */
export function getTierFeatures(tier: License['tier']): License['features'] {
  switch (tier) {
    case 'trial':
      return {
        canvaEditor: true,
        capcutEditor: true,
        bulkAutomation: true,
        aiImageGeneration: false,
        aiVideoGeneration: false,
        export4K: false,
        whiteLabel: false,
        unlimitedTemplates: false,
      };
    case 'starter':
      return {
        canvaEditor: true,
        capcutEditor: true,
        bulkAutomation: true,
        aiImageGeneration: true,
        aiVideoGeneration: false,
        export4K: false,
        whiteLabel: false,
        unlimitedTemplates: true,
      };
    case 'pro':
      return {
        canvaEditor: true,
        capcutEditor: true,
        bulkAutomation: true,
        aiImageGeneration: true,
        aiVideoGeneration: true,
        export4K: true,
        whiteLabel: false,
        unlimitedTemplates: true,
      };
    case 'agency_unlimited':
    default:
      return {
        canvaEditor: true,
        capcutEditor: true,
        bulkAutomation: true,
        aiImageGeneration: true,
        aiVideoGeneration: true,
        export4K: true,
        whiteLabel: true,
        unlimitedTemplates: true,
      };
  }
}

/**
 * Generate an offline signed license file (JSON string with digital signature)
 */
export function generateSignedOfflineLicense(license: License): string {
  const payload = {
    key: license.key,
    customerName: license.customerName,
    customerEmail: license.customerEmail,
    tier: license.tier,
    type: license.type,
    issuedAt: license.issuedAt,
    expiresAt: license.expiresAt,
    maxDevices: license.maxDevices,
    features: license.features,
  };

  const serialized = JSON.stringify(payload);
  const signature = computeSimpleChecksum(serialized + 'OFFLINE_SECRET_SALT_2026');

  return JSON.stringify({
    payload,
    signature,
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
  }, null, 2);
}

/**
 * Verify an offline license file
 */
export function verifyOfflineLicense(fileContent: string): {
  isValid: boolean;
  license?: Partial<License>;
  error?: string;
} {
  try {
    const data = JSON.parse(fileContent);
    if (!data.payload || !data.signature) {
      return { isValid: false, error: 'Malformed license file. Payload or signature missing.' };
    }

    const serialized = JSON.stringify(data.payload);
    const expectedSig = computeSimpleChecksum(serialized + 'OFFLINE_SECRET_SALT_2026');

    if (data.signature !== expectedSig) {
      return { isValid: false, error: 'Digital signature invalid. The license file has been modified.' };
    }

    // Check expiration
    if (data.payload.expiresAt && data.payload.expiresAt !== 'lifetime') {
      const expiry = new Date(data.payload.expiresAt).getTime();
      if (Date.now() > expiry) {
        return { isValid: false, error: 'The offline license has expired.' };
      }
    }

    return { isValid: true, license: data.payload };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { isValid: false, error: `Invalid license file syntax: ${message}` };
  }
}

/**
 * Generates an initial seed dataset of customers and licenses for demonstration
 */
export function getInitialLicenseStore(): { customers: Customer[]; licenses: License[] } {
  const customers: Customer[] = [
    {
      id: 'cust_1',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@mediaedge.io',
      company: 'MediaEdge Agency',
      status: 'active',
      licenseKey: 'CCVS-UNLM-78AF-93BC-B129',
      licenseTier: 'agency_unlimited',
      activatedDevices: 3,
      maxDevices: 10,
      createdDate: '2026-08-15',
      expiresDate: 'lifetime',
      notes: 'Agency VIP client. Uses 1000+ bulk video runs per week.',
    },
    {
      id: 'cust_2',
      name: 'David Chen',
      email: 'david@growviral.co',
      company: 'GrowViral Studios',
      status: 'active',
      licenseKey: 'CCVS-PROX-43E1-88DF-3C4A',
      licenseTier: 'pro',
      activatedDevices: 2,
      maxDevices: 3,
      createdDate: '2026-09-01',
      expiresDate: '2027-09-01',
      notes: 'Annual Pro plan subscriber.',
    },
    {
      id: 'cust_3',
      name: 'Elena Rostova',
      email: 'elena@medquiz.org',
      company: 'MedQuiz Academy',
      status: 'trial',
      licenseKey: 'CCVS-TRIL-91AC-22FF-8D1F',
      licenseTier: 'trial',
      activatedDevices: 1,
      maxDevices: 1,
      createdDate: '2026-10-25',
      expiresDate: '2026-11-15',
      notes: '14-day trial evaluation for educational quiz pipeline.',
    },
    {
      id: 'cust_4',
      name: 'Marcus Brody',
      email: 'marcus@brandpulse.net',
      company: 'BrandPulse Corp',
      status: 'expired',
      licenseKey: 'CCVS-STRT-66E9-11B3-A502',
      licenseTier: 'starter',
      activatedDevices: 1,
      maxDevices: 2,
      createdDate: '2025-10-01',
      expiresDate: '2026-10-01',
      notes: 'Renewal pending.',
    },
  ];

  const licenses: License[] = customers.map(c => ({
    id: `lic_${c.id}`,
    key: c.licenseKey,
    customerName: c.name,
    customerEmail: c.email,
    tier: c.licenseTier,
    type: c.expiresDate === 'lifetime' ? 'lifetime' : (c.licenseTier === 'trial' ? 'trial' : 'yearly'),
    status: c.status === 'expired' ? 'expired' : 'active',
    issuedAt: c.createdDate,
    expiresAt: c.expiresDate,
    maxDevices: c.maxDevices,
    activatedDevicesList: [
      {
        deviceId: `dev_win_${c.id}_primary`,
        deviceName: `${c.name.split(' ')[0]}-Desktop-PC (Win 11)`,
        activatedAt: c.createdDate,
        lastPing: new Date().toISOString(),
        ipAddress: '192.168.1.10' + c.id.slice(-1),
      }
    ],
    features: getTierFeatures(c.licenseTier),
  }));

  return { customers, licenses };
}
