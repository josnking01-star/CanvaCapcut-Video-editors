import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  generateLicenseKey, 
  validateLicenseKeyFormat, 
  getTierFeatures, 
  generateSignedOfflineLicense, 
  verifyOfflineLicense 
} from './licensing';
import { License } from '../types';

test('generateLicenseKey produces keys that pass validateLicenseKeyFormat', () => {
  const proKey = generateLicenseKey('pro');
  assert.ok(proKey.startsWith('CCVS-PROX-'));
  
  const validation = validateLicenseKeyFormat(proKey);
  assert.equal(validation.isValid, true);
  assert.equal(validation.tier, 'pro');

  const unlimitedKey = generateLicenseKey('agency_unlimited');
  assert.ok(unlimitedKey.startsWith('CCVS-UNLM-'));
  const validation2 = validateLicenseKeyFormat(unlimitedKey);
  assert.equal(validation2.isValid, true);
  assert.equal(validation2.tier, 'agency_unlimited');
});

test('validateLicenseKeyFormat catches corrupted or altered keys', () => {
  const key = generateLicenseKey('pro');
  // Alter one character in the middle
  const corruptedKey = key.slice(0, 10) + (key[10] === 'A' ? 'B' : 'A') + key.slice(11);
  const check = validateLicenseKeyFormat(corruptedKey);
  assert.equal(check.isValid, false);
});

test('getTierFeatures allocates correct permissions according to tier', () => {
  const trialFeatures = getTierFeatures('trial');
  assert.equal(trialFeatures.canvaEditor, true);
  assert.equal(trialFeatures.aiVideoGeneration, false);
  assert.equal(trialFeatures.export4K, false);

  const agencyFeatures = getTierFeatures('agency_unlimited');
  assert.equal(agencyFeatures.canvaEditor, true);
  assert.equal(agencyFeatures.capcutEditor, true);
  assert.equal(agencyFeatures.bulkAutomation, true);
  assert.equal(agencyFeatures.export4K, true);
  assert.equal(agencyFeatures.whiteLabel, true);
});

test('offline signed license can be generated and verified safely', () => {
  const mockLicense: License = {
    id: 'lic_test',
    key: 'CCVS-PROX-TEST-1234-ABCD',
    customerName: 'Robert Vance',
    customerEmail: 'robert@vance.com',
    tier: 'pro',
    type: 'yearly',
    status: 'active',
    issuedAt: '2026-01-01',
    expiresAt: '2028-01-01',
    maxDevices: 3,
    activatedDevicesList: [],
    features: getTierFeatures('pro'),
  };

  const fileString = generateSignedOfflineLicense(mockLicense);
  assert.ok(fileString.includes('signature'));
  assert.ok(fileString.includes('payload'));

  const verified = verifyOfflineLicense(fileString);
  assert.equal(verified.isValid, true);
  assert.equal(verified.license?.customerEmail, 'robert@vance.com');

  // Tamper with the file contents
  const tamperedFile = fileString.replace('Robert Vance', 'Hacker Vance');
  const tamperedCheck = verifyOfflineLicense(tamperedFile);
  assert.equal(tamperedCheck.isValid, false);
});
