import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  parseCSVText, 
  detectColumnsFromRecords, 
  autoSuggestMappings, 
  applyRecordToTemplate, 
  assignBackgroundsToRecords,
  adaptTemplateToAspectRatio,
  PLATFORM_ASPECT_RATIOS
} from './bulkEngine';
import { ProjectTemplate } from '../types';

test('parseCSVText parses CSV rows and detects columns', () => {
  const csv = `Question,Option_A,Option_B,Correct_Answer,Background_Prompt\n` +
    `"What is the capital of France?","London","Paris","Paris","Eiffel tower in Paris cinematic morning"\n` +
    `"Which planet is known as the Red Planet?","Mars","Venus","Mars","Red rocky planet Mars with stars"`;

  const { records, columns } = parseCSVText(csv);
  assert.equal(records.length, 2);
  assert.equal(records[0]['Question'], 'What is the capital of France?');
  assert.equal(records[0]['Correct_Answer'], 'Paris');
  assert.equal(columns.length, 5);

  const promptCol = columns.find(c => c.name === 'Background_Prompt');
  assert.ok(promptCol);
  assert.equal(promptCol?.detectedType, 'prompt');
});

test('applyRecordToTemplate replaces dynamic elements and preserves fixed elements', () => {
  const mockTemplate: ProjectTemplate = {
    id: 'tpl_quiz_1',
    name: 'Quiz Card',
    description: 'Dynamic Quiz Template',
    category: 'quiz',
    dimensions: { width: 1080, height: 1920, label: '9:16', ratio: '9:16' },
    duration: 10,
    backgroundMode: 'video',
    defaultBackgroundUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23',
    tracks: [],
    elements: [
      {
        id: 'el_fixed_logo',
        type: 'badge',
        name: 'Brand Logo',
        isDynamic: false,
        defaultValue: 'LOGO',
        fallbackBehavior: 'default',
        x: 50,
        y: 50,
        width: 120,
        height: 60,
        rotation: 0,
        opacity: 1,
        zIndex: 10,
        isLocked: true,
        isVisible: true,
        text: 'FIXED_BRAND_WATERMARK',
        fontFamily: 'Inter',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: 1,
        lineHeight: 1.2,
        trackId: 'track_1',
        startTime: 0,
        duration: 10,
      },
      {
        id: 'el_dynamic_question',
        type: 'text',
        name: 'Question Heading',
        isDynamic: true,
        dynamicField: 'Question',
        defaultValue: 'Default Question?',
        fallbackBehavior: 'default',
        x: 50,
        y: 400,
        width: 980,
        height: 200,
        rotation: 0,
        opacity: 1,
        zIndex: 5,
        isLocked: false,
        isVisible: true,
        text: 'Default Question?',
        fontFamily: 'Inter',
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: 0,
        lineHeight: 1.3,
        trackId: 'track_2',
        startTime: 0,
        duration: 10,
      }
    ]
  };

  const row = {
    'Question': 'What is the largest organ in the human body?',
    'Answer': 'The skin'
  };

  const mappings = [
    {
      columnName: 'Question',
      targetElementId: 'el_dynamic_question',
      targetProperty: 'text' as const,
      defaultValue: 'Default Question?',
    }
  ];

  const populated = applyRecordToTemplate(mockTemplate, row, mappings);

  // Dynamic question must receive the spreadsheet row value
  const dynamicEl = populated.elements.find(e => e.id === 'el_dynamic_question');
  assert.equal(dynamicEl?.text, 'What is the largest organ in the human body?');

  // Fixed logo must remain untouched
  const fixedEl = populated.elements.find(e => e.id === 'el_fixed_logo');
  assert.equal(fixedEl?.text, 'FIXED_BRAND_WATERMARK');
  assert.equal(fixedEl?.isDynamic, false);
});

test('assignBackgroundsToRecords accurately maps per-row prompts with fallback', () => {
  const records = [
    { 'Title': 'Video 1', 'Scene_Prompt': 'Deep ocean blue bioluminescent jellyfish' },
    { 'Title': 'Video 2', 'Scene_Prompt': '' }, // Empty prompt row
    { 'Title': 'Video 3', 'Scene_Prompt': 'Golden sunset over snowy mountains' }
  ];

  const stockVideos = ['stock_video_1.mp4', 'stock_video_2.mp4'];

  const assignments = assignBackgroundsToRecords(records, 'per-row-prompt', {
    backgroundPromptColumn: 'Scene_Prompt',
    fallbackPrompt: 'Cinematic abstract tech background',
    stockMediaUrls: stockVideos
  });

  assert.equal(assignments.length, 3);
  assert.equal(assignments[0].prompt, 'Deep ocean blue bioluminescent jellyfish');
  // Row 2 was empty, should use fallback
  assert.equal(assignments[1].prompt, 'Cinematic abstract tech background');
  assert.equal(assignments[2].prompt, 'Golden sunset over snowy mountains');
});

test('PLATFORM_ASPECT_RATIOS includes YouTube, TikTok, Instagram and Facebook with dedicated folder names', () => {
  assert.equal(PLATFORM_ASPECT_RATIOS.length, 4);

  const youtube = PLATFORM_ASPECT_RATIOS.find(p => p.id === '16:9');
  assert.ok(youtube);
  assert.equal(youtube?.folderName, 'YouTube_16x9_Landscape');
  assert.equal(youtube?.resolution, '1920x1080');

  const tiktok = PLATFORM_ASPECT_RATIOS.find(p => p.id === '9:16');
  assert.ok(tiktok);
  assert.equal(tiktok?.folderName, 'Instagram_Reels_TikTok_9x16_Vertical');
  assert.equal(tiktok?.resolution, '1080x1920');

  const igSquare = PLATFORM_ASPECT_RATIOS.find(p => p.id === '1:1');
  assert.ok(igSquare);
  assert.equal(igSquare?.folderName, 'Instagram_Feed_1x1_Square');

  const fbPortrait = PLATFORM_ASPECT_RATIOS.find(p => p.id === '4:5');
  assert.ok(fbPortrait);
  assert.equal(fbPortrait?.folderName, 'Facebook_Feed_4x5_Portrait');
});

test('adaptTemplateToAspectRatio auto-adapts question width and option positioning from 9:16 to 16:9', () => {
  const baseTpl: ProjectTemplate = {
    id: 'tpl_quiz_916',
    name: 'Mobile Quiz',
    description: '',
    category: 'quiz',
    dimensions: { width: 1080, height: 1920, label: '9:16', ratio: '9:16' },
    duration: 12,
    backgroundMode: 'image',
    tracks: [],
    elements: [
      {
        id: 'el_dynamic_question',
        type: 'text',
        name: 'Question Heading',
        isDynamic: true,
        dynamicField: 'Question',
        defaultValue: 'Question text?',
        fallbackBehavior: 'default',
        x: 80,
        y: 320,
        width: 920,
        height: 260,
        rotation: 0,
        opacity: 1,
        zIndex: 5,
        isLocked: false,
        isVisible: true,
        fontFamily: 'Inter',
        fontSize: 46,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: 0,
        lineHeight: 1.3,
        trackId: 'tr_1',
        startTime: 0,
        duration: 12,
      },
      {
        id: 'el_dynamic_opt_a',
        type: 'text',
        name: 'Option A',
        isDynamic: true,
        dynamicField: 'Option_A',
        defaultValue: 'Option A',
        fallbackBehavior: 'default',
        x: 120,
        y: 630,
        width: 840,
        height: 100,
        rotation: 0,
        opacity: 1,
        zIndex: 6,
        isLocked: false,
        isVisible: true,
        fontFamily: 'Inter',
        fontSize: 34,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: 0,
        lineHeight: 1.2,
        trackId: 'tr_1',
        startTime: 2,
        duration: 10,
      },
      {
        id: 'el_dynamic_opt_b',
        type: 'text',
        name: 'Option B',
        isDynamic: true,
        dynamicField: 'Option_B',
        defaultValue: 'Option B',
        fallbackBehavior: 'default',
        x: 120,
        y: 760,
        width: 840,
        height: 100,
        rotation: 0,
        opacity: 1,
        zIndex: 7,
        isLocked: false,
        isVisible: true,
        fontFamily: 'Inter',
        fontSize: 34,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: 0,
        lineHeight: 1.2,
        trackId: 'tr_1',
        startTime: 3,
        duration: 9,
      }
    ]
  };

  const adapted16x9 = adaptTemplateToAspectRatio(baseTpl, '16:9');
  assert.equal(adapted16x9.dimensions.width, 1920);
  assert.equal(adapted16x9.dimensions.height, 1080);
  assert.equal(adapted16x9.dimensions.ratio, '16:9');

  const qEl = adapted16x9.elements.find(e => e.id === 'el_dynamic_question');
  assert.ok(qEl);
  // In 16:9 widescreen, question should expand to 1400 width and stay comfortably within the 1080 height
  assert.equal(qEl?.width, 1400);
  assert.ok(qEl?.y! < 250);

  const optA = adapted16x9.elements.find(e => e.id === 'el_dynamic_opt_a');
  const optB = adapted16x9.elements.find(e => e.id === 'el_dynamic_opt_b');
  assert.ok(optA);
  assert.ok(optB);
  // Options in 16:9 are side-by-side: optA on left (x=260), optB on right (x=980)
  assert.equal(optA?.x, 260);
  assert.equal(optB?.x, 980);
  assert.equal(optA?.y, optB?.y); // Same horizontal row
});

