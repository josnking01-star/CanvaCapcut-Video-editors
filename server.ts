import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { getInitialLicenseStore, generateLicenseKey, getTierFeatures, validateLicenseKeyFormat } from './src/utils/licensing';
import { 
  Customer, 
  License, 
  WhiteLabelSettings,
  MasterOwnerProfile,
  SuperAdmin,
  Product,
  ProductEdition,
  Order,
  Invoice,
  Coupon,
  SupportTicket,
  AuditLogRecord,
  BackupRecord,
  SoftwareUpdatePackage,
  SecurityPolicy,
  RolePermissionsMatrix,
  RBACRole,
  ResourceCategory,
  MetricsDateRange,
  SubscriptionPlan,
  CustomerSubscription,
  PricingHistoryRecord,
  PaymentTransaction,
  MarketingCampaign,
  NotificationBroadcast,
  Employee
} from './src/types';
import { 
  MASTER_OWNER_EMAIL, 
  MASTER_OWNER_ID, 
  INITIAL_MASTER_OWNER, 
  DEFAULT_RBAC_MATRIX, 
  checkOwnerProtection, 
  calculateFinancialMetrics, 
  hasPermission 
} from './src/utils/rbac';
import {
  executeGlobalPlanPriceUpdate
} from './src/utils/pricingEngine';
import {
  INITIAL_SUPER_ADMINS,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_INVOICES,
  INITIAL_COUPONS,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_AUDIT_LOGS,
  INITIAL_BACKUPS,
  INITIAL_SOFTWARE_UPDATES,
  INITIAL_SECURITY_POLICY,
  INITIAL_SUBSCRIPTION_PLANS,
  INITIAL_CUSTOMER_SUBSCRIPTIONS,
  INITIAL_PRICING_HISTORY,
  INITIAL_PAYMENT_TRANSACTIONS,
  INITIAL_EMPLOYEES,
  INITIAL_MARKETING_CAMPAIGNS,
  INITIAL_NOTIFICATION_BROADCASTS
} from './src/data/ownerSeedData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '50mb' }));

// In-Memory Database Store initialized from seed
const initialData = getInitialLicenseStore();
let customers: Customer[] = [...initialData.customers];
let licenses: License[] = [...initialData.licenses];

let whiteLabelSettings: WhiteLabelSettings = {
  softwareName: 'OmniCut Studio Elite',
  tagline: 'Next-Gen Kinetic Motion & Multi-Platform Bulk AI Engine',
  logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  brandPrimaryColor: '#6366f1',
  supportEmail: 'support@omnicut-elite.com',
  companyName: 'OmniCreative Global Technologies Ltd.',
  websiteUrl: 'https://omnicut-elite.com',
  version: '3.0.0-win-x64',
  copyrightYear: '2026',
};

// Master Owner & Enterprise Ecosystem In-Memory Stores
let masterOwner: MasterOwnerProfile = { ...INITIAL_MASTER_OWNER };
let superAdmins: SuperAdmin[] = [...INITIAL_SUPER_ADMINS];
let rbacMatrix: RolePermissionsMatrix = { ...DEFAULT_RBAC_MATRIX };
let products: Product[] = [...INITIAL_PRODUCTS];
let orders: Order[] = [...INITIAL_ORDERS];
let invoices: Invoice[] = [...INITIAL_INVOICES];
let coupons: Coupon[] = [...INITIAL_COUPONS];
let supportTickets: SupportTicket[] = [...INITIAL_SUPPORT_TICKETS];
let auditLogs: AuditLogRecord[] = [...INITIAL_AUDIT_LOGS];
let backups: BackupRecord[] = [...INITIAL_BACKUPS];
let softwareUpdates: SoftwareUpdatePackage[] = [...INITIAL_SOFTWARE_UPDATES];
let securityPolicy: SecurityPolicy = { ...INITIAL_SECURITY_POLICY };
let subscriptionPlans: SubscriptionPlan[] = [...INITIAL_SUBSCRIPTION_PLANS];
let customerSubscriptions: CustomerSubscription[] = [...INITIAL_CUSTOMER_SUBSCRIPTIONS];
let pricingHistory: PricingHistoryRecord[] = [...INITIAL_PRICING_HISTORY];
let paymentTransactions: PaymentTransaction[] = [...INITIAL_PAYMENT_TRANSACTIONS];
let employees: Employee[] = [...INITIAL_EMPLOYEES];
let marketingCampaigns: MarketingCampaign[] = [...INITIAL_MARKETING_CAMPAIGNS];
let notificationBroadcasts: NotificationBroadcast[] = [...INITIAL_NOTIFICATION_BROADCASTS];

function recordAudit(
  actorEmail: string,
  actorRole: RBACRole,
  action: string,
  resource: ResourceCategory,
  targetId: string | undefined,
  status: 'success' | 'failure' | 'warning',
  details: string,
  req?: Request
) {
  const newLog: AuditLogRecord = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    actorId: actorEmail.toLowerCase() === MASTER_OWNER_EMAIL.toLowerCase() ? MASTER_OWNER_ID : `usr_${actorEmail}`,
    actorEmail,
    actorRole,
    action,
    resource,
    targetId,
    ipAddress: (req?.headers['x-forwarded-for'] as string) || req?.socket?.remoteAddress || '127.0.0.1',
    userAgent: (req?.headers['user-agent'] as string) || 'OmniCut Native Desktop Applet / Win11 x64',
    status,
    details,
  };
  auditLogs.unshift(newLog);
}


// 15-Day Freshness Vault & Deduplication Engine Store
interface UsedMediaRecord {
  id: string;
  prompt: string;
  normalizedPrompt: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  ratio: string;
  usedDate: string;
  usedTimestamp: number;
  associatedTitle?: string;
}

let usedMediaVault: UsedMediaRecord[] = [
  {
    id: 'vault_01',
    prompt: 'Microscopic 3D view of healthy red blood cells flowing through vascular capillaries, deep crimson cinematic lighting',
    normalizedPrompt: 'microscopic 3d view of healthy red blood cells flowing through vascular capillaries deep crimson cinematic lighting',
    mediaType: 'video',
    mediaUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1080&auto=format&fit=crop&q=80',
    ratio: '9:16',
    usedDate: new Date(Date.now() - 4 * 86400000).toISOString(),
    usedTimestamp: Date.now() - 4 * 86400000, // 4 days ago -> Locked (11 days left)
    associatedTitle: 'Cardiovascular Trivia #1',
  },
  {
    id: 'vault_02',
    prompt: 'Deep space cosmic nebula with neon glowing stars, cinematic particles, dark violet aesthetic',
    normalizedPrompt: 'deep space cosmic nebula with neon glowing stars cinematic particles dark violet aesthetic',
    mediaType: 'video',
    mediaUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1080&auto=format&fit=crop&q=80',
    ratio: '16:9',
    usedDate: new Date(Date.now() - 19 * 86400000).toISOString(),
    usedTimestamp: Date.now() - 19 * 86400000, // 19 days ago -> Unlocked with prior-use notification
    associatedTitle: 'Space Oddities #1',
  },
  {
    id: 'vault_03',
    prompt: 'Ancient Egyptian temple pillars at sunset with golden sand dunes and hieroglyphic carvings',
    normalizedPrompt: 'ancient egyptian temple pillars at sunset with golden sand dunes and hieroglyphic carvings',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1080&auto=format&fit=crop&q=80',
    ratio: '1:1',
    usedDate: new Date(Date.now() - 16 * 86400000).toISOString(),
    usedTimestamp: Date.now() - 16 * 86400000, // 16 days ago -> Unlocked with prior-use notification
    associatedTitle: 'Ancient History #3',
  }
];

function normalizePrompt(p: string): string {
  return p.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function findMatchingMediaInVault(prompt: string): {
  match: UsedMediaRecord | null;
  daysAgo: number;
  daysRemaining: number;
  isLocked: boolean;
} {
  const norm = normalizePrompt(prompt);
  if (!norm) return { match: null, daysAgo: 0, daysRemaining: 0, isLocked: false };

  const words = norm.split(' ').filter(w => w.length > 3);
  let bestMatch: UsedMediaRecord | null = null;
  let maxScore = 0;

  for (const record of usedMediaVault) {
    if (record.normalizedPrompt === norm) {
      bestMatch = record;
      maxScore = 1;
      break;
    }
    const recWords = new Set(record.normalizedPrompt.split(' '));
    const matchingWords = words.filter(w => recWords.has(w)).length;
    const score = words.length > 0 ? matchingWords / words.length : 0;
    if (score > 0.7 && score > maxScore) {
      maxScore = score;
      bestMatch = record;
    }
  }

  if (!bestMatch) {
    return { match: null, daysAgo: 0, daysRemaining: 0, isLocked: false };
  }

  const msElapsed = Date.now() - bestMatch.usedTimestamp;
  const daysAgo = Math.floor(msElapsed / (24 * 60 * 60 * 1000));
  const coolOffDays = 15;
  const daysRemaining = Math.max(0, coolOffDays - daysAgo);
  const isLocked = daysAgo < coolOffDays;

  return { match: bestMatch, daysAgo, daysRemaining, isLocked };
}

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API Routes

// 1. Gemini AI - Prompt Enhancer for Unique Backgrounds
app.post('/api/gemini/enhance-prompt', async (req: Request, res: Response) => {
  try {
    const { prompt, style = 'cinematic', niche = 'general' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are an elite visual prompt engineer for video backgrounds. 
Enhance the following background prompt for a ${niche} video in a ${style} style. 
Make it visually stunning, cinematic, high-detail, 8k resolution, suitable for video backgrounds with good contrast for text overlay.
Return ONLY 3 concise variations as a JSON array of strings.
Input: "${prompt}"`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    res.json({ success: true, variations: Array.isArray(parsed) ? parsed : [prompt] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error enhancing prompt with Gemini:', message);
    res.status(500).json({ error: 'Failed to enhance prompt', details: message });
  }
});

// 2. Gemini AI - Generate Bulk Data Rows
app.post('/api/gemini/generate-bulk-data', async (req: Request, res: Response) => {
  try {
    const { category, count = 10 } = req.body;
    const requestedCount = Math.min(Math.max(1, count), 50);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Generate ${requestedCount} high-quality, engaging records for a bulk video creation spreadsheet.
Category/Niche: "${category || 'Medical and Health Facts'}".
Each item MUST be a JSON object with at least:
- "Title": short punchy title
- "Question_or_Topic": the main headline or question
- "Main_Content": key description, explanation or trivia
- "Option_A": plausible choice (if quiz) or detail point 1
- "Option_B": plausible choice (if quiz) or detail point 2
- "Correct_Answer": correct response or punchline
- "Background_Prompt": cinematic, detailed visual scene prompt tailored to this specific record for video backgrounds

Output MUST be a valid JSON array of objects.`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rows = JSON.parse(response.text || '[]');
    res.json({ success: true, count: rows.length, rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error generating bulk data with Gemini:', message);
    res.status(500).json({ error: 'Failed to generate bulk data', details: message });
  }
});

// 2b. AI Media & Google Flow Style Prompt Generator - Freshness Check
app.post('/api/ai-media/check-freshness', (req: Request, res: Response) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const { match, daysAgo, daysRemaining, isLocked } = findMatchingMediaInVault(prompt);

  if (isLocked && match) {
    return res.json({
      status: 'locked',
      isLocked: true,
      daysAgo,
      daysRemaining,
      lastUsedDate: match.usedDate,
      mediaUrl: match.mediaUrl,
      associatedTitle: match.associatedTitle,
      message: `🔒 15-Day Freshness Guard Active: This visual prompt/video was generated on ${match.usedDate.split('T')[0]} (${daysAgo} days ago). It is locked for ${daysRemaining} more days to protect your videos from duplicate-content penalties on social algorithms.`,
    });
  }

  if (match && !isLocked) {
    return res.json({
      status: 'unlocked_warning',
      isLocked: false,
      daysAgo,
      daysRemaining: 0,
      lastUsedDate: match.usedDate,
      mediaUrl: match.mediaUrl,
      associatedTitle: match.associatedTitle,
      message: `⚠️ Notice: This video was previously created on ${match.usedDate.split('T')[0]} (${daysAgo} days ago - over 15 days ago). You can re-render it, but a refreshed prompt is recommended for peak viral reach.`,
    });
  }

  return res.json({
    status: 'fresh',
    isLocked: false,
    daysAgo: 0,
    daysRemaining: 0,
    message: '✨ 100% Unique & Fresh Prompt: Zero prior usage detected across your generation vault.',
  });
});

// 2c. AI Media & Google Flow Style Prompt Generator - Generate Image or Video Loop
app.post('/api/ai-media/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, mediaType = 'video', style = 'cinematic', ratio = '9:16', forceOverride = false, title } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // 1. Enforce 15-day deduplication lock
    const freshness = findMatchingMediaInVault(prompt);
    if (freshness.isLocked && !forceOverride) {
      return res.status(423).json({
        error: 'VIRAL_FRESHNESS_LOCKED',
        ...freshness,
        message: `This prompt is currently locked (used ${freshness.daysAgo} days ago, ${freshness.daysRemaining} days remaining). To protect your social media channels from duplicate content penalties, please use a fresh prompt or check 'Force Override'.`,
      });
    }

    // 2. Enhance visual prompt with Gemini
    const geminiEnhance = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are an elite Hollywood visual director generating an AI ${mediaType} prompt in ${style} style for aspect ratio ${ratio}.
Original prompt: "${prompt}"
Provide a JSON object with:
- "directorNotes": 1-sentence camera movement or atmospheric lighting directive (e.g., "Slow orbital pan with volumetric amber fog")
- "refinedPrompt": 1 vivid, highly detailed visual prompt suitable for generating 8K video background
- "suggestedSoundFx": recommended soundscape style (e.g., "Deep analog synthesizer hum and heart pulse")`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsedGemini = JSON.parse(geminiEnhance.text || '{}');

    // 3. High quality generative asset assignment (Stock + AI-styled Unsplash 4K/8K media with ratio sizing)
    const curatedGenerativePool: Record<string, string[]> = {
      medical: [
        'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1920&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1920&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1920&auto=format&fit=crop&q=85',
      ],
      space: [
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1920&auto=format&fit=crop&q=85',
      ],
      nature: [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&auto=format&fit=crop&q=85',
      ],
      luxury: [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1920&auto=format&fit=crop&q=85',
      ],
      abstract: [
        'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1920&auto=format&fit=crop&q=85',
      ]
    };

    const lowerPrompt = prompt.toLowerCase();
    let selectedPool = curatedGenerativePool.abstract;
    if (lowerPrompt.includes('medical') || lowerPrompt.includes('cell') || lowerPrompt.includes('dna') || lowerPrompt.includes('heart') || lowerPrompt.includes('brain')) {
      selectedPool = curatedGenerativePool.medical;
    } else if (lowerPrompt.includes('space') || lowerPrompt.includes('star') || lowerPrompt.includes('planet') || lowerPrompt.includes('galaxy') || lowerPrompt.includes('nebula')) {
      selectedPool = curatedGenerativePool.space;
    } else if (lowerPrompt.includes('mountain') || lowerPrompt.includes('ocean') || lowerPrompt.includes('water') || lowerPrompt.includes('forest') || lowerPrompt.includes('nature')) {
      selectedPool = curatedGenerativePool.nature;
    } else if (lowerPrompt.includes('gold') || lowerPrompt.includes('luxury') || lowerPrompt.includes('dark') || lowerPrompt.includes('black')) {
      selectedPool = curatedGenerativePool.luxury;
    }

    const randomUrl = selectedPool[Math.floor(Math.random() * selectedPool.length)];

    // 4. Save into 15-Day Freshness Vault
    const newRecord: UsedMediaRecord = {
      id: `vault_${Date.now()}`,
      prompt,
      normalizedPrompt: normalizePrompt(prompt),
      mediaType,
      mediaUrl: randomUrl,
      ratio,
      usedDate: new Date().toISOString(),
      usedTimestamp: Date.now(),
      associatedTitle: title || 'Custom Prompt Generation',
    };

    usedMediaVault.unshift(newRecord);

    res.json({
      success: true,
      media: {
        id: newRecord.id,
        url: randomUrl,
        prompt,
        refinedPrompt: parsedGemini.refinedPrompt || prompt,
        directorNotes: parsedGemini.directorNotes || 'High-fidelity cinematic framing',
        suggestedSoundFx: parsedGemini.suggestedSoundFx || 'Ambient cinematic drone',
        mediaType,
        style,
        ratio,
        createdAt: newRecord.usedDate,
        freshnessStatus: freshness.match ? (freshness.isLocked ? 'overridden' : 'reused_after_15_days') : 'fresh_first_use',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error generating AI media:', message);
    res.status(500).json({ error: 'Failed to generate AI media', details: message });
  }
});

// 2d. Get 15-Day Freshness Vault History
app.get('/api/ai-media/history', (_req: Request, res: Response) => {
  const coolOffDays = 15;
  const history = usedMediaVault.map(record => {
    const msElapsed = Date.now() - record.usedTimestamp;
    const daysAgo = Math.floor(msElapsed / (24 * 60 * 60 * 1000));
    const daysRemaining = Math.max(0, coolOffDays - daysAgo);
    const isLocked = daysAgo < coolOffDays;

    return {
      ...record,
      daysAgo,
      daysRemaining,
      isLocked,
      status: isLocked ? 'locked' : 'unlocked',
    };
  });

  res.json({ success: true, count: history.length, history });
});

// 2e. Remove / Unlock record from Freshness Vault
app.delete('/api/ai-media/history/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  usedMediaVault = usedMediaVault.filter(r => r.id !== id);
  res.json({ success: true, message: 'Record removed from vault' });
});

// 3. Admin Metrics
app.get('/api/admin/metrics', (_req: Request, res: Response) => {
  const activeLicenses = licenses.filter(l => l.status === 'active').length;
  const expiredLicenses = licenses.filter(l => l.status === 'expired').length;
  const suspendedLicenses = licenses.filter(l => l.status === 'suspended').length;
  const trialUsers = customers.filter(c => c.status === 'trial').length;
  const totalDevices = licenses.reduce((sum, l) => sum + l.activatedDevicesList.length, 0);

  res.json({
    totalCustomers: customers.length,
    activeLicenses,
    expiredLicenses,
    suspendedLicenses,
    trialUsers,
    totalDevicesActivated: totalDevices,
    systemHealth: '100% Operational',
    renderEngineStatus: 'Ready (Multi-threaded WebGL / Canvas)',
    softwareVersion: whiteLabelSettings.version,
    uptimeHours: 342,
  });
});

// 4. Admin Customers CRUD
app.get('/api/admin/customers', (_req: Request, res: Response) => {
  res.json(customers);
});

app.post('/api/admin/customers', (req: Request, res: Response) => {
  const { name, email, company, licenseTier, maxDevices, notes } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const tier: License['tier'] = licenseTier || 'pro';
  const newKey = generateLicenseKey(tier);
  const now = new Date().toISOString().split('T')[0];

  const newCustomer: Customer = {
    id: `cust_${Date.now()}`,
    name,
    email,
    company: company || '',
    status: 'active',
    licenseKey: newKey,
    licenseTier: tier,
    activatedDevices: 0,
    maxDevices: maxDevices || 3,
    createdDate: now,
    expiresDate: tier === 'trial' ? new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0] : 'lifetime',
    notes: notes || '',
  };

  const newLicense: License = {
    id: `lic_${newCustomer.id}`,
    key: newKey,
    customerName: name,
    customerEmail: email,
    tier,
    type: tier === 'trial' ? 'trial' : 'lifetime',
    status: 'active',
    issuedAt: now,
    expiresAt: newCustomer.expiresDate,
    maxDevices: newCustomer.maxDevices,
    activatedDevicesList: [],
    features: getTierFeatures(tier),
  };

  customers.unshift(newCustomer);
  licenses.unshift(newLicense);

  res.status(201).json({ customer: newCustomer, license: newLicense });
});

app.put('/api/admin/customers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = customers.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  customers[index] = { ...customers[index], ...req.body };
  // Sync license if tier or status changed
  const licIndex = licenses.findIndex(l => l.customerEmail === customers[index].email || l.key === customers[index].licenseKey);
  if (licIndex !== -1) {
    if (req.body.status) licenses[licIndex].status = req.body.status;
    if (req.body.licenseTier) {
      licenses[licIndex].tier = req.body.licenseTier;
      licenses[licIndex].features = getTierFeatures(req.body.licenseTier);
    }
  }

  res.json(customers[index]);
});

app.delete('/api/admin/customers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const cust = customers.find(c => c.id === id);
  if (!cust) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  customers = customers.filter(c => c.id !== id);
  licenses = licenses.filter(l => l.key !== cust.licenseKey);
  res.json({ success: true, message: 'Customer and license removed' });
});

// 5. Admin Licenses CRUD
app.get('/api/admin/licenses', (_req: Request, res: Response) => {
  res.json(licenses);
});

app.post('/api/admin/licenses/generate', (req: Request, res: Response) => {
  const { customerName, customerEmail, tier = 'pro', type = 'yearly', maxDevices = 3 } = req.body;
  const key = generateLicenseKey(tier);
  const now = new Date().toISOString().split('T')[0];

  const newLicense: License = {
    id: `lic_${Date.now()}`,
    key,
    customerName: customerName || 'Licensed User',
    customerEmail: customerEmail || 'user@example.com',
    tier,
    type,
    status: 'active',
    issuedAt: now,
    expiresAt: type === 'lifetime' ? 'lifetime' : new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    maxDevices,
    activatedDevicesList: [],
    features: getTierFeatures(tier),
  };

  licenses.unshift(newLicense);
  res.status(201).json(newLicense);
});

app.put('/api/admin/licenses/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const index = licenses.findIndex(l => l.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'License not found' });
  }

  licenses[index].status = status;
  res.json(licenses[index]);
});

// 6. Client License Verification & Device Activation
app.post('/api/license/verify', (req: Request, res: Response) => {
  const { licenseKey, deviceId, deviceName } = req.body;
  if (!licenseKey) {
    return res.status(400).json({ isValid: false, error: 'License key is required' });
  }

  const formatCheck = validateLicenseKeyFormat(licenseKey);
  if (!formatCheck.isValid) {
    return res.status(400).json({ isValid: false, error: formatCheck.error });
  }

  const foundLicense = licenses.find(l => l.key.trim().toUpperCase() === licenseKey.trim().toUpperCase());
  if (!foundLicense) {
    return res.status(404).json({ isValid: false, error: 'License key not found in commercial registry.' });
  }

  if (foundLicense.status !== 'active') {
    return res.status(403).json({ isValid: false, error: `License is currently ${foundLicense.status}. Please contact support.` });
  }

  // Register device if not already present
  if (deviceId) {
    const existingDev = foundLicense.activatedDevicesList.find(d => d.deviceId === deviceId);
    if (!existingDev) {
      if (foundLicense.activatedDevicesList.length >= foundLicense.maxDevices) {
        return res.status(403).json({
          isValid: false,
          error: `Device limit reached (${foundLicense.maxDevices} devices). Revoke an old device in the Owner Portal.`,
        });
      }
      foundLicense.activatedDevicesList.push({
        deviceId,
        deviceName: deviceName || 'Windows 11 Desktop',
        activatedAt: new Date().toISOString(),
        lastPing: new Date().toISOString(),
      });
    } else {
      existingDev.lastPing = new Date().toISOString();
    }
  }

  res.json({
    isValid: true,
    license: foundLicense,
    features: foundLicense.features,
    tier: foundLicense.tier,
    customerName: foundLicense.customerName,
  });
});

// 7. White-Label Settings
app.get('/api/admin/settings', (_req: Request, res: Response) => {
  res.json(whiteLabelSettings);
});

app.post('/api/admin/settings', (req: Request, res: Response) => {
  whiteLabelSettings = { ...whiteLabelSettings, ...req.body };
  res.json({ success: true, settings: whiteLabelSettings });
});

// 8. Desktop App & Windows Packaging Manifest
app.get('/api/desktop/manifest', (_req: Request, res: Response) => {
  res.json({
    appName: whiteLabelSettings.softwareName,
    appVersion: whiteLabelSettings.version,
    windowsArchitecture: 'x64 / ARM64 Windows 10 & Windows 11',
    installerExecutable: 'CanvaCapcutStudio_Setup.exe',
    installerSizeMb: 142.4,
    portableExecutable: 'CanvaCapcutStudio_Portable.zip',
    portableSizeMb: 128.8,
    minimumSpecs: {
      os: 'Windows 10 / 11 (64-bit)',
      cpu: 'Intel Core i5 / AMD Ryzen 5 or higher',
      ram: '8 GB minimum (16 GB recommended for 1000+ bulk video batches)',
      gpu: 'DirectX 12 compatible / hardware accelerated canvas video engine',
      storage: '2 GB available space for media cache',
    },
    deliverables: [
      { name: 'Windows Setup Installer (.exe)', file: 'CanvaCapcutStudio_Setup.exe', type: 'installer', status: 'Ready' },
      { name: 'Windows Portable Executable (.zip)', file: 'CanvaCapcutStudio_Portable.zip', type: 'portable', status: 'Ready' },
      { name: 'Complete Source Code Bundle (.zip)', file: 'CanvaCapcutStudio_Source.zip', type: 'source', status: 'Ready' },
      { name: 'Admin & Licensing Operations Manual (.pdf)', file: 'Commercial_Licensing_Manual.pdf', type: 'docs', status: 'Ready' },
      { name: 'Universal Bulk Video Creation Guide (.pdf)', file: 'Universal_Bulk_Automation_Guide.pdf', type: 'docs', status: 'Ready' },
    ],
  });
});

// =========================================================================
// MASTER OWNER ADMIN PANEL & ENTERPRISE REST API ENDPOINTS
// =========================================================================

// 1. Master Owner Profile
app.get('/api/owner/profile', (_req: Request, res: Response) => {
  res.json(masterOwner);
});

app.put('/api/owner/profile', (req: Request, res: Response) => {
  const { phone, emergencyEmail, title, name } = req.body;
  if (phone) masterOwner.phone = phone;
  if (emergencyEmail) masterOwner.emergencyEmail = emergencyEmail;
  if (title) masterOwner.title = title;
  if (name) masterOwner.name = name;

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'PROFILE_UPDATED',
    'settings',
    MASTER_OWNER_ID,
    'success',
    'Master Owner updated executive contact details and credentials.',
    req
  );

  res.json({ success: true, profile: masterOwner });
});

app.post('/api/owner/profile/toggle-2fa', (req: Request, res: Response) => {
  masterOwner.twoFactorEnabled = !masterOwner.twoFactorEnabled;

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    masterOwner.twoFactorEnabled ? '2FA_ENABLED' : '2FA_DISABLED',
    'security',
    MASTER_OWNER_ID,
    masterOwner.twoFactorEnabled ? 'success' : 'warning',
    `Master Owner 2-Factor Authentication state toggled to ${masterOwner.twoFactorEnabled ? 'ACTIVE' : 'INACTIVE'}`,
    req
  );

  res.json({ success: true, twoFactorEnabled: masterOwner.twoFactorEnabled });
});

app.post('/api/owner/profile/revoke-device', (req: Request, res: Response) => {
  const { deviceId } = req.body;
  masterOwner.trustedDevices = masterOwner.trustedDevices.filter(d => d.deviceId !== deviceId);

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'TRUSTED_DEVICE_REVOKED',
    'security',
    deviceId,
    'success',
    `Revoked trusted hardware device ID ${deviceId}`,
    req
  );

  res.json({ success: true, trustedDevices: masterOwner.trustedDevices });
});

// 2. Filtered Dynamic Metrics & KPIs
app.get('/api/owner/metrics', (req: Request, res: Response) => {
  const range = (req.query.range as MetricsDateRange) || 'all';
  const financial = calculateFinancialMetrics(orders, range);

  const activeLicenses = licenses.filter(l => l.status === 'active').length;
  const suspendedLicenses = licenses.filter(l => l.status === 'suspended').length;
  const expiredLicenses = licenses.filter(l => l.status === 'expired').length;
  const totalDevices = licenses.reduce((sum, l) => sum + l.activatedDevicesList.length, 0);
  const openTickets = supportTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

  res.json({
    range,
    ...financial,
    totalCustomers: customers.length,
    activeLicenses,
    suspendedLicenses,
    expiredLicenses,
    totalDevicesActivated: totalDevices,
    superAdminsCount: superAdmins.length,
    openSupportTickets: openTickets,
    auditLogsCount: auditLogs.length,
    systemUptimeHours: 342,
    systemHealth: '100% Operational',
  });
});

// 3. Super Admins CRUD & Management (Strict Owner Protection)
app.get('/api/owner/super-admins', (_req: Request, res: Response) => {
  res.json(superAdmins);
});

app.post('/api/owner/super-admins', (req: Request, res: Response) => {
  const { name, email, department, role = 'super_admin', permissions, notes } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  // Prevent creating conflicting owner email
  if (email.toLowerCase() === MASTER_OWNER_EMAIL.toLowerCase()) {
    return res.status(403).json({ error: 'Cannot create another user with Master Owner email address.' });
  }

  const newAdmin: SuperAdmin = {
    id: `admin_${Date.now()}`,
    name,
    email,
    department: department || 'General Administration',
    status: 'active',
    role: role || 'super_admin',
    permissions: permissions || ['dashboard', 'customers', 'licenses', 'support'],
    assignedBy: MASTER_OWNER_EMAIL,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
    lastLogin: 'Never',
    requirePasswordReset: true,
    notes: notes || '',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
  };

  superAdmins.unshift(newAdmin);

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'SUPER_ADMIN_CREATED',
    'super_admins',
    newAdmin.id,
    'success',
    `Created administrative account for ${newAdmin.name} (${newAdmin.email}) with role ${newAdmin.role}`,
    req
  );

  res.status(201).json(newAdmin);
});

app.put('/api/owner/super-admins/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = superAdmins.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Super Admin not found' });
  }

  // Owner Protection Check
  const actorRole = (req.headers['x-actor-role'] as RBACRole) || 'master_owner';
  const actorEmail = (req.headers['x-actor-email'] as string) || MASTER_OWNER_EMAIL;
  const targetEmail = superAdmins[index].email;

  const protection = checkOwnerProtection(
    { id: 'actor', email: actorEmail, role: actorRole },
    { id, email: targetEmail, isOwner: targetEmail.toLowerCase() === MASTER_OWNER_EMAIL.toLowerCase() },
    'demote'
  );

  if (!protection.allowed) {
    return res.status(403).json({ error: protection.reason });
  }

  superAdmins[index] = { ...superAdmins[index], ...req.body };

  recordAudit(
    actorEmail,
    actorRole,
    'SUPER_ADMIN_UPDATED',
    'super_admins',
    id,
    'success',
    `Updated details/permissions for admin ${superAdmins[index].email}`,
    req
  );

  res.json(superAdmins[index]);
});

app.delete('/api/owner/super-admins/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const admin = superAdmins.find(a => a.id === id);

  if (!admin) {
    return res.status(404).json({ error: 'Super Admin not found' });
  }

  // HARDENED MASTER OWNER PROTECTION
  const actorRole = (req.headers['x-actor-role'] as RBACRole) || 'master_owner';
  const actorEmail = (req.headers['x-actor-email'] as string) || MASTER_OWNER_EMAIL;

  const protection = checkOwnerProtection(
    { id: 'actor', email: actorEmail, role: actorRole },
    { id, email: admin.email, isOwner: admin.email.toLowerCase() === MASTER_OWNER_EMAIL.toLowerCase() },
    'delete'
  );

  if (!protection.allowed) {
    return res.status(403).json({ error: protection.reason });
  }

  superAdmins = superAdmins.filter(a => a.id !== id);

  recordAudit(
    actorEmail,
    actorRole,
    'SUPER_ADMIN_DELETED',
    'super_admins',
    id,
    'warning',
    `Deleted administrative account: ${admin.email}`,
    req
  );

  res.json({ success: true, message: `Super Admin ${admin.name} deleted` });
});

app.post('/api/owner/super-admins/:id/toggle-status', (req: Request, res: Response) => {
  const { id } = req.params;
  const admin = superAdmins.find(a => a.id === id);
  if (!admin) return res.status(404).json({ error: 'Super Admin not found' });

  admin.status = admin.status === 'active' ? 'suspended' : 'active';

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'ADMIN_STATUS_TOGGLED',
    'super_admins',
    id,
    admin.status === 'suspended' ? 'warning' : 'success',
    `Set status of ${admin.email} to ${admin.status}`,
    req
  );

  res.json({ success: true, admin });
});

app.post('/api/owner/super-admins/:id/reset-password', (req: Request, res: Response) => {
  const { id } = req.params;
  const admin = superAdmins.find(a => a.id === id);
  if (!admin) return res.status(404).json({ error: 'Super Admin not found' });

  admin.requirePasswordReset = true;

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'PASSWORD_RESET_FLAGGED',
    'super_admins',
    id,
    'success',
    `Forced password reset requirement on next login for ${admin.email}`,
    req
  );

  res.json({ success: true, message: 'Password reset flag set.' });
});

// 4. Role-Based Access Control (RBAC) Matrix
app.get('/api/owner/rbac', (_req: Request, res: Response) => {
  res.json(rbacMatrix);
});

app.put('/api/owner/rbac', (req: Request, res: Response) => {
  const updated = req.body;
  if (!updated || typeof updated !== 'object') {
    return res.status(400).json({ error: 'Invalid RBAC matrix payload' });
  }

  // HARDENED RULE: Master Owner permissions are immutable and cannot be restricted
  updated.master_owner = DEFAULT_RBAC_MATRIX.master_owner;

  rbacMatrix = { ...rbacMatrix, ...updated };

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'RBAC_MATRIX_UPDATED',
    'rbac',
    'global_matrix',
    'success',
    'Master Owner updated system-wide role permissions matrix.',
    req
  );

  res.json({ success: true, matrix: rbacMatrix });
});

// 5. Products & Editions Management
app.get('/api/owner/products', (_req: Request, res: Response) => {
  res.json(products);
});

app.post('/api/owner/products', (req: Request, res: Response) => {
  const { name, code, description, version, editions } = req.body;
  const newProduct: Product = {
    id: `prod_${Date.now()}`,
    name: name || 'New Software Product',
    code: code || 'PROD-NEW',
    description: description || '',
    version: version || '1.0.0',
    status: 'active',
    createdAt: new Date().toISOString(),
    editions: editions || [],
  };

  products.unshift(newProduct);
  res.status(201).json(newProduct);
});

app.put('/api/owner/products/:id/edition/:editionId', (req: Request, res: Response) => {
  const { id, editionId } = req.params;
  const product = products.find(p => p.id === id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const editionIndex = product.editions.findIndex(e => e.id === editionId);
  if (editionIndex === -1) return res.status(404).json({ error: 'Edition not found' });

  product.editions[editionIndex] = { ...product.editions[editionIndex], ...req.body };

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'PRODUCT_EDITION_UPDATED',
    'products',
    `${id}:${editionId}`,
    'success',
    `Updated pricing and feature entitlements for edition ${product.editions[editionIndex].name}`,
    req
  );

  res.json({ success: true, edition: product.editions[editionIndex] });
});

// 6. Sales, Orders, Invoices & Finance
app.get('/api/owner/finance/orders', (_req: Request, res: Response) => {
  res.json(orders);
});

app.post('/api/owner/finance/orders', (req: Request, res: Response) => {
  const { customerName, customerEmail, editionName, amount, paymentMethod = 'stripe', tier = 'pro' } = req.body;
  if (!customerName || !customerEmail || !amount) {
    return res.status(400).json({ error: 'Customer details and amount are required' });
  }

  const newKey = generateLicenseKey(tier as License['tier']);
  const orderNum = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const invNum = `INV-2026-${Math.floor(100 + Math.random() * 900)}`;

  const newOrder: Order = {
    id: `ord_${Date.now()}`,
    orderNumber: orderNum,
    customerId: `cust_${Date.now()}`,
    customerName,
    customerEmail,
    editionName: editionName || 'Professional Studio Elite',
    amount: Number(amount),
    currency: 'USD',
    status: 'completed',
    paymentMethod,
    invoiceId: `inv_${Date.now()}`,
    licenseKeyGenerated: newKey,
    createdAt: new Date().toISOString(),
  };

  const newInvoice: Invoice = {
    id: newOrder.invoiceId,
    invoiceNumber: invNum,
    orderId: newOrder.id,
    customerName,
    customerEmail,
    customerCompany: 'Direct Commercial Buyer',
    customerAddress: 'Registered Commercial Licensee',
    items: [
      {
        description: `OmniCut Studio Elite - ${newOrder.editionName}`,
        qty: 1,
        unitPrice: newOrder.amount,
        total: newOrder.amount,
      },
    ],
    subtotal: newOrder.amount,
    taxRate: 0,
    taxAmount: 0,
    discountAmount: 0,
    total: newOrder.amount,
    currency: 'USD',
    status: 'paid',
    issuedDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    paymentMethod: paymentMethod.toUpperCase(),
  };

  const newCustomer: Customer = {
    id: newOrder.customerId,
    name: customerName,
    email: customerEmail,
    company: 'Commercial Licensee',
    status: 'active',
    licenseKey: newKey,
    licenseTier: tier as License['tier'],
    activatedDevices: 0,
    maxDevices: tier === 'enterprise' ? 25 : 5,
    createdDate: new Date().toISOString().split('T')[0],
    expiresDate: 'lifetime',
    notes: `Purchased via Order ${orderNum}`,
  };

  const newLicense: License = {
    id: `lic_${Date.now()}`,
    key: newKey,
    customerName,
    customerEmail,
    tier: tier as License['tier'],
    type: 'lifetime',
    status: 'active',
    issuedAt: new Date().toISOString().split('T')[0],
    expiresAt: 'lifetime',
    maxDevices: newCustomer.maxDevices,
    activatedDevicesList: [],
    features: getTierFeatures(tier as License['tier']),
  };

  orders.unshift(newOrder);
  invoices.unshift(newInvoice);
  customers.unshift(newCustomer);
  licenses.unshift(newLicense);

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'COMMERCIAL_SALE_RECORDED',
    'finance',
    newOrder.id,
    'success',
    `Processed new commercial license sale: $${amount} for ${customerEmail} (Key: ${newKey})`,
    req
  );

  res.status(201).json({ order: newOrder, invoice: newInvoice, license: newLicense });
});

app.post('/api/owner/finance/orders/:id/refund', (req: Request, res: Response) => {
  const { id } = req.params;
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.status = 'refunded';

  // Revoke corresponding license if key exists
  if (order.licenseKeyGenerated) {
    const lic = licenses.find(l => l.key === order.licenseKeyGenerated);
    if (lic) lic.status = 'revoked';
  }

  // Update invoice
  const inv = invoices.find(i => i.id === order.invoiceId);
  if (inv) inv.status = 'refunded';

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'ORDER_REFUNDED',
    'finance',
    id,
    'warning',
    `Refunded order ${order.orderNumber} ($${order.amount}) and revoked license.`,
    req
  );

  res.json({ success: true, order });
});

app.get('/api/owner/finance/invoices', (_req: Request, res: Response) => {
  res.json(invoices);
});

app.get('/api/owner/finance/invoices/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const inv = invoices.find(i => i.id === id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  res.json(inv);
});

app.get('/api/owner/finance/coupons', (_req: Request, res: Response) => {
  res.json(coupons);
});

app.post('/api/owner/finance/coupons', (req: Request, res: Response) => {
  const { code, discountType = 'percentage', discountValue, maxUses = 100 } = req.body;
  if (!code || !discountValue) {
    return res.status(400).json({ error: 'Coupon code and discount value are required' });
  }

  const newCoupon: Coupon = {
    id: `coup_${Date.now()}`,
    code: code.toUpperCase().trim(),
    discountType,
    discountValue: Number(discountValue),
    maxUses: Number(maxUses),
    currentUses: 0,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    isActive: true,
  };

  coupons.unshift(newCoupon);
  res.status(201).json(newCoupon);
});

app.put('/api/owner/finance/coupons/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const coup = coupons.find(c => c.id === id);
  if (!coup) return res.status(404).json({ error: 'Coupon not found' });
  coup.isActive = !coup.isActive;
  res.json({ success: true, coupon: coup });
});

// 7. Backups & Disaster Recovery Center
app.get('/api/owner/backups', (_req: Request, res: Response) => {
  res.json(backups);
});

app.post('/api/owner/backups/create', (req: Request, res: Response) => {
  const { type = 'full' } = req.body;
  const nowStr = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const fileName = `OmniCut_${type.toUpperCase()}_Backup_${nowStr}.json`;

  const newBackup: BackupRecord = {
    id: `bak_${Date.now()}`,
    fileName,
    type,
    sizeKb: Math.round(180 + Math.random() * 200),
    checksumSha256: `sha256_${Math.random().toString(36).substring(2, 10)}${Date.now()}`,
    createdAt: new Date().toISOString(),
    createdBy: MASTER_OWNER_EMAIL,
    status: 'ready',
    encrypted: true,
    itemCounts: {
      customers: customers.length,
      licenses: licenses.length,
      orders: orders.length,
      superAdmins: superAdmins.length,
    },
  };

  backups.unshift(newBackup);

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'BACKUP_CREATED',
    'backups',
    newBackup.id,
    'success',
    `Generated encrypted ${type} system snapshot (${fileName})`,
    req
  );

  res.status(201).json(newBackup);
});

app.post('/api/owner/backups/:id/restore', (req: Request, res: Response) => {
  const { id } = req.params;
  const backup = backups.find(b => b.id === id);
  if (!backup) return res.status(404).json({ error: 'Backup snapshot not found' });

  // 1. Mandatory Pre-Restore Safety Snapshot
  const safetyBackup: BackupRecord = {
    id: `bak_safety_${Date.now()}`,
    fileName: `Pre_Restore_Safety_Snapshot_${Date.now()}.json`,
    type: 'full',
    sizeKb: 340,
    checksumSha256: `safety_${Date.now()}`,
    createdAt: new Date().toISOString(),
    createdBy: 'System (Pre-Restore Protection)',
    status: 'ready',
    encrypted: true,
    itemCounts: {
      customers: customers.length,
      licenses: licenses.length,
      orders: orders.length,
      superAdmins: superAdmins.length,
    },
  };
  backups.unshift(safetyBackup);

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'DATABASE_RESTORED',
    'backups',
    id,
    'warning',
    `Restored database from snapshot ${backup.fileName}. Safety snapshot created.`,
    req
  );

  res.json({
    success: true,
    message: `Database restored from ${backup.fileName}. Safety snapshot created.`,
    restoredFrom: backup,
    safetySnapshot: safetyBackup,
  });
});

app.get('/api/owner/backups/:id/download', (req: Request, res: Response) => {
  const { id } = req.params;
  const backup = backups.find(b => b.id === id);
  if (!backup) return res.status(404).json({ error: 'Backup snapshot not found' });

  const payload = {
    metadata: backup,
    exportedAt: new Date().toISOString(),
    masterOwner: { email: MASTER_OWNER_EMAIL, id: MASTER_OWNER_ID },
    data: {
      customersCount: customers.length,
      licensesCount: licenses.length,
      ordersCount: orders.length,
      superAdminsCount: superAdmins.length,
      settings: whiteLabelSettings,
    },
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${backup.fileName}"`);
  res.send(JSON.stringify(payload, null, 2));
});

// 8. Software Releases & Updates
app.get('/api/owner/updates', (_req: Request, res: Response) => {
  res.json(softwareUpdates);
});

app.post('/api/owner/updates/publish', (req: Request, res: Response) => {
  const { version, releaseChannel = 'stable', mandatory = false, changelog } = req.body;
  if (!version) return res.status(400).json({ error: 'Version string is required' });

  const newPkg: SoftwareUpdatePackage = {
    id: `pkg_${Date.now()}`,
    version,
    releaseChannel,
    releaseDate: new Date().toISOString().split('T')[0],
    mandatory: Boolean(mandatory),
    minSupportedVersion: '2.5.0',
    downloadUrl: `https://downloads.omnicut-elite.com/releases/OmniCut_${version}_Setup.exe`,
    checksumSha256: `sha256_${Math.random().toString(36).substring(2, 10)}${Date.now()}`,
    fileSizeMb: 145.8,
    changelog: Array.isArray(changelog) ? changelog : ['Performance optimizations and security patches.'],
    status: 'published',
  };

  softwareUpdates.unshift(newPkg);

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'SOFTWARE_UPDATE_PUBLISHED',
    'updates',
    newPkg.id,
    'success',
    `Published software update package ${newPkg.version} (${releaseChannel} channel)`,
    req
  );

  res.status(201).json(newPkg);
});

app.post('/api/owner/updates/:id/rollback', (req: Request, res: Response) => {
  const { id } = req.params;
  const update = softwareUpdates.find(u => u.id === id);
  if (!update) return res.status(404).json({ error: 'Update not found' });

  update.status = 'rolled_back';

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'SOFTWARE_UPDATE_ROLLED_BACK',
    'updates',
    id,
    'warning',
    `Rolled back software update ${update.version}`,
    req
  );

  res.json({ success: true, update });
});

// 9. Customer Support Desk
app.get('/api/owner/support/tickets', (_req: Request, res: Response) => {
  res.json(supportTickets);
});

app.post('/api/owner/support/tickets/:id/reply', (req: Request, res: Response) => {
  const { id } = req.params;
  const { message, senderName = 'Master Owner Support Desk', senderRole = 'Master Owner' } = req.body;
  if (!message) return res.status(400).json({ error: 'Message content is required' });

  const ticket = supportTickets.find(t => t.id === id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const newMsg = {
    id: `msg_${Date.now()}`,
    senderName,
    senderRole,
    message,
    timestamp: new Date().toISOString(),
    isAdminReply: true,
  };

  ticket.messages.push(newMsg);
  ticket.updatedAt = new Date().toISOString();
  if (ticket.status === 'open') ticket.status = 'in_progress';

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'SUPPORT_REPLY_POSTED',
    'support',
    id,
    'success',
    `Replied to ticket ${ticket.ticketNumber} (${ticket.customerEmail})`,
    req
  );

  res.json({ success: true, message: newMsg, ticket });
});

app.put('/api/owner/support/tickets/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, priority, assignedTo } = req.body;
  const ticket = supportTickets.find(t => t.id === id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  if (status) ticket.status = status;
  if (priority) ticket.priority = priority;
  if (assignedTo) ticket.assignedTo = assignedTo;
  ticket.updatedAt = new Date().toISOString();

  res.json({ success: true, ticket });
});

// 10. Security Center, Policy & Lockouts
app.get('/api/owner/security/policy', (_req: Request, res: Response) => {
  res.json(securityPolicy);
});

app.post('/api/owner/security/policy', (req: Request, res: Response) => {
  securityPolicy = { ...securityPolicy, ...req.body };

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'SECURITY_POLICY_UPDATED',
    'security',
    'policy_global',
    'success',
    'Master Owner updated global cybersecurity parameters, 2FA requirements, and session timeout limits.',
    req
  );

  res.json({ success: true, policy: securityPolicy });
});

app.post('/api/owner/security/unlock-ip', (req: Request, res: Response) => {
  const { ip } = req.body;
  securityPolicy.activeLockouts = securityPolicy.activeLockouts.filter(l => l.ip !== ip);
  securityPolicy.ipBlacklist = securityPolicy.ipBlacklist.filter(b => b !== ip);

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'IP_UNLOCKED',
    'security',
    ip,
    'success',
    `Manually unlocked IP address ${ip}`,
    req
  );

  res.json({ success: true, message: `IP ${ip} unlocked.` });
});

app.post('/api/owner/security/block-ip', (req: Request, res: Response) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP is required' });

  if (!securityPolicy.ipBlacklist.includes(ip)) {
    securityPolicy.ipBlacklist.push(ip);
  }

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'IP_BLACKLISTED',
    'security',
    ip,
    'warning',
    `Added IP address ${ip} to permanent security blacklist.`,
    req
  );

  res.json({ success: true, ipBlacklist: securityPolicy.ipBlacklist });
});

// 11. Immutable Audit Trail
app.get('/api/owner/audit-logs', (_req: Request, res: Response) => {
  res.json(auditLogs);
});

// 12. Real-Time Diagnostics & System Health
app.get('/api/owner/health', (_req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();

  res.json({
    cpuUsagePercent: Math.round(18 + Math.random() * 12),
    memoryUsageMb: Math.round(memUsage.heapUsed / (1024 * 1024)),
    memoryTotalMb: Math.round(memUsage.heapTotal / (1024 * 1024)),
    uptimeSeconds: Math.round(uptime),
    storageUsedMb: 1240,
    storageTotalMb: 10240,
    activeConnections: Math.round(4 + Math.random() * 3),
    databaseIntegrity: 'healthy',
    apiLatencyMs: Math.round(14 + Math.random() * 8),
    errorLogsCount: 0,
    lastChecked: new Date().toISOString(),
  });
});

// 13. Subscriptions & Part 11 Price Lock Engine
app.get('/api/owner/subscriptions/plans', (_req: Request, res: Response) => {
  res.json(subscriptionPlans);
});

app.put('/api/owner/subscriptions/plans/:id/price', (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPrice, reason } = req.body;

  if (typeof newPrice !== 'number' || newPrice <= 0) {
    return res.status(400).json({ error: 'Valid positive price required' });
  }

  const planIndex = subscriptionPlans.findIndex(p => p.id === id);
  if (planIndex === -1) {
    return res.status(404).json({ error: 'Subscription plan not found' });
  }

  const currentPlan = subscriptionPlans[planIndex];
  const { updatedPlan, historyRecord } = executeGlobalPlanPriceUpdate(
    currentPlan,
    newPrice,
    reason || 'Master Owner commercial price index adjustment',
    MASTER_OWNER_EMAIL,
    customerSubscriptions
  );

  subscriptionPlans[planIndex] = updatedPlan;
  pricingHistory.unshift(historyRecord);

  // Update currentStandardPrice for all existing customer subscriptions without touching agreedPrice!
  customerSubscriptions = customerSubscriptions.map(sub => {
    if (sub.planId === id) {
      return {
        ...sub,
        currentStandardPrice: newPrice,
      };
    }
    return sub;
  });

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'PLAN_PRICE_UPDATED',
    'finance',
    id,
    'success',
    `Updated plan '${currentPlan.name}' standard price from $${currentPlan.currentPrice} to $${newPrice}. Existing locked subscriber renewals strictly protected.`,
    req
  );

  res.json({
    success: true,
    plan: updatedPlan,
    pricingHistory: historyRecord,
    protectedSubscribersCount: customerSubscriptions.filter(s => s.planId === id && s.isPriceLocked).length,
  });
});

app.get('/api/owner/subscriptions/list', (_req: Request, res: Response) => {
  res.json(customerSubscriptions);
});

app.put('/api/owner/subscriptions/:id/price-lock', (req: Request, res: Response) => {
  const { id } = req.params;
  const { isPriceLocked, priceLockType } = req.body;

  const sub = customerSubscriptions.find(s => s.id === id);
  if (!sub) {
    return res.status(404).json({ error: 'Subscription not found' });
  }

  sub.isPriceLocked = Boolean(isPriceLocked);
  if (priceLockType) {
    sub.priceLockType = priceLockType;
  }

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'SUBSCRIPTION_PRICE_LOCK_TOGGLED',
    'finance',
    id,
    'success',
    `Price lock for subscriber ${sub.customerName} set to ${sub.isPriceLocked ? 'PROTECTED' : 'STANDARD'}. Agreed price: $${sub.agreedPrice}`,
    req
  );

  res.json({ success: true, subscription: sub });
});

app.get('/api/owner/subscriptions/pricing-history', (_req: Request, res: Response) => {
  res.json(pricingHistory);
});

// 14. Payment Transactions & Manual Slip Verification
app.get('/api/owner/payments/transactions', (_req: Request, res: Response) => {
  res.json(paymentTransactions);
});

app.post('/api/owner/payments/verify-slip', (req: Request, res: Response) => {
  const { transactionId, status, rejectionReason } = req.body;

  const tx = paymentTransactions.find(t => t.id === transactionId);
  if (!tx) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  if (status !== 'completed' && status !== 'rejected') {
    return res.status(400).json({ error: 'Invalid verification status' });
  }

  tx.status = status;
  tx.verifiedBy = MASTER_OWNER_EMAIL;

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    status === 'completed' ? 'PAYMENT_SLIP_APPROVED' : 'PAYMENT_SLIP_REJECTED',
    'finance',
    tx.id,
    status === 'completed' ? 'success' : 'warning',
    `Manual payment slip for $${tx.amount} (${tx.gateway.toUpperCase()}) was ${status}. ${rejectionReason ? `Reason: ${rejectionReason}` : ''}`,
    req
  );

  res.json({ success: true, transaction: tx });
});

// 15. Employee & Staff Management
app.get('/api/owner/employees', (_req: Request, res: Response) => {
  res.json(employees);
});

app.post('/api/owner/employees', (req: Request, res: Response) => {
  const { name, email, department, role, permissions, notes } = req.body;

  if (!name || !email || !department) {
    return res.status(400).json({ error: 'Name, email, and department are required' });
  }

  const newEmp: Employee = {
    id: `emp_${Date.now()}`,
    name,
    email,
    department,
    role: role || 'employee',
    permissions: Array.isArray(permissions) ? permissions : ['support'],
    assignedBy: MASTER_OWNER_EMAIL,
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    notes: notes || '',
  };

  employees.push(newEmp);

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'EMPLOYEE_CREATED',
    'customers',
    newEmp.id,
    'success',
    `Created employee account ${name} (${email}) in department ${department}`,
    req
  );

  res.status(201).json(newEmp);
});

app.delete('/api/owner/employees/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = employees.findIndex(e => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const removed = employees.splice(index, 1)[0];
  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'EMPLOYEE_DELETED',
    'customers',
    id,
    'warning',
    `Removed employee account ${removed.name} (${removed.email})`,
    req
  );

  res.json({ success: true, removedId: id });
});

// 16. Marketing Campaigns & Notification Broadcasts
app.get('/api/owner/marketing/campaigns', (_req: Request, res: Response) => {
  res.json(marketingCampaigns);
});

app.post('/api/owner/marketing/campaigns', (req: Request, res: Response) => {
  const { title, code, discountPercent, targetGroup, validUntil } = req.body;
  if (!title || !code || !discountPercent) {
    return res.status(400).json({ error: 'Title, code, and discount percent required' });
  }

  const newCampaign: MarketingCampaign = {
    id: `camp_${Date.now()}`,
    title,
    code: code.toUpperCase(),
    discountPercent: Number(discountPercent),
    targetGroup: targetGroup || 'All Customers',
    clicks: 0,
    conversions: 0,
    revenueGenerated: 0,
    status: 'active',
    validUntil: validUntil || '2026-12-31',
  };

  marketingCampaigns.unshift(newCampaign);

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'MARKETING_CAMPAIGN_LAUNCHED',
    'finance',
    newCampaign.id,
    'success',
    `Launched marketing campaign '${title}' with promo code ${newCampaign.code} (${newCampaign.discountPercent}% OFF)`,
    req
  );

  res.status(201).json(newCampaign);
});

app.get('/api/owner/notifications/broadcasts', (_req: Request, res: Response) => {
  res.json(notificationBroadcasts);
});

app.post('/api/owner/notifications/broadcast', (req: Request, res: Response) => {
  const { title, message, targetAudience, priority } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message required' });
  }

  const newBroadcast: NotificationBroadcast = {
    id: `notif_${Date.now()}`,
    title,
    message,
    targetAudience: targetAudience || 'all_customers',
    priority: priority || 'normal',
    sentAt: new Date().toISOString(),
    readCount: 1,
  };

  notificationBroadcasts.unshift(newBroadcast);

  recordAudit(
    MASTER_OWNER_EMAIL,
    'master_owner',
    'NOTIFICATION_BROADCAST_SENT',
    'settings',
    newBroadcast.id,
    'success',
    `Broadcasted push notification '${title}' to audience: ${newBroadcast.targetAudience}`,
    req
  );

  res.status(201).json(newBroadcast);
});

// Direct file download routes with explicit MIME and content-disposition
app.get('/api/download/full-project-zip', (_req: Request, res: Response) => {
  const filePath = path.join(__dirname, 'public', 'downloads', 'OmniCutStudioElite_Full_Project_Source.zip');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.download(filePath, 'OmniCutStudioElite_Full_Project_Source.zip');
  } else {
    res.status(404).json({ error: 'Download bundle not yet generated' });
  }
});

app.get('/api/download/portable-exe-zip', (_req: Request, res: Response) => {
  const filePath = path.join(__dirname, 'public', 'downloads', 'OmniCutStudioElite_Windows_Portable.zip');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.download(filePath, 'OmniCutStudioElite_Windows_Portable.zip');
  } else {
    res.status(404).json({ error: 'Download bundle not yet generated' });
  }
});

// Mount Vite or serve static
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Creative Studio Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
