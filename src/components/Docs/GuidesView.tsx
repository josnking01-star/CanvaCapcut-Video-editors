import React, { useState } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  FileText, 
  Terminal, 
  ShieldCheck, 
  Database, 
  Sparkles, 
  Film,
  Download
} from 'lucide-react';

export const GuidesView: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<string>('bulk');

  const docs = [
    {
      id: 'bulk',
      title: 'Universal Bulk Video Creation Guide',
      icon: Database,
      content: `### 1. Universal Bulk Video Automation Workflow

The bulk automation engine is completely independent of spreadsheet structures or video niches:

1. **Upload any Spreadsheet**:
   - Accepts Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv).
   - Any number of columns and rows (from 10 up to 1,000+).
   - Supports medical quizzes, motivation, facts, product ads, history, e-commerce, and education.

2. **Dynamic vs. Fixed Elements**:
   - **Dynamic Elements**: Text or images that receive replacement data from spreadsheet rows (Question, Main Headline, Author, Body, Background Prompt).
   - **Fixed Elements**: Logos, watermarks, brand ribbons, borders, and animations that remain 100% identical on every video.

3. **Unique Background per Video (Part 5)**:
   - Provide a \`Background_Prompt\` column in your spreadsheet.
   - The engine will assign a unique prompt and video/image asset to each generated video.
   - Fallback prompts ensure no video is left with a blank background.

4. **Rendering & ZIP Download**:
   - Live worker thread processes the batch sequentially without crashing browser memory.
   - Download individual videos or click "Download All as ZIP" for a complete packaged archive with JSON manifest.`
    },
    {
      id: 'canva_capcut',
      title: 'Canva Design & CapCut Timeline Guide',
      icon: Film,
      content: `### 2. Creative Studio & Timeline Craft

The Studio integrates Canva design flexibility with CapCut multi-track timeline precision:

- **Canva Artboard**:
  - Click any element to drag, reposition, and inspect properties.
  - Add text styles (Heading, Subheading, Choice Pills, Watermarks).
  - Add geometric shapes, countdown circles, and border frames.
  - Multi-aspect ratio support: 9:16 (Shorts/TikTok/Reels), 16:9 (YouTube Desktop), 1:1 (Instagram Post), 4:5 (Social Feed).

- **CapCut Multi-Track Timeline**:
  - Independent track rows: Video Background, Dynamic Variables, Fixed Branding, and Background Audio.
  - Real-time playhead scrubber with milliseconds timecode readout (e.g. \`00:03.40 / 00:08.00\`).
  - Trimming controls: Adjust \`startTime\` and \`duration\` per clip.
  - Kinetic text animations: Slide Up, Fade In, Pop, Typewriter, and Bounce.`
    },
    {
      id: 'licensing',
      title: 'Commercial Owner & Licensing Guide',
      icon: ShieldCheck,
      content: `### 3. Commercial Licensing & Admin Operations

Built for software owners distributing commercially to paying customers:

- **Cryptographically Structured Keys**:
  - Format: \`CCVS-TIER-RANDOM-CHECKSUM\` (e.g. \`CCVS-PROX-43E1-88DF-3C4A\`).
  - Built-in checksum validator detects altered or tampered keys.

- **License Tiers & Feature Matrix**:
  - **Trial**: 14-day evaluation, core editors, 1 device limit.
  - **Starter**: 1-year license, bulk automation, 2 device limits.
  - **Pro**: Lifetime or yearly, AI prompt enhancer, 4K export, 3 device limits.
  - **Agency Unlimited**: Unlimited exports, white-label branding, 10 device limits.

- **Offline Signed Licenses**:
  - For air-gapped computers, export a digitally signed \`.ccvs-license\` JSON file.
  - Signature validation verifies integrity without requiring an internet connection.`
    },
    {
      id: 'installation',
      title: 'Windows Installation & Deployment',
      icon: Terminal,
      content: `### 4. Windows 10 & 11 Deployment

The application is structured for direct distribution:

- **Windows Setup Installer (\`CanvaCapcutStudio_Setup.exe\`)**:
  - Installs application files to \`%LocalAppData%\\CanvaCapcutStudio\`.
  - Creates Desktop and Start Menu shortcuts.
  - Clean uninstaller registered in Windows Settings.

- **Zero-Dependency Execution**:
  - Customers do NOT need Node.js, Python, or command-line tools.
  - Native hardware acceleration via DirectX 12 / WebGL canvas engine.
  - Recommended hardware: 8 GB RAM (16 GB for 1,000+ batches), Quad-core CPU.`
    },
  ];

  const currentDoc = docs.find(d => d.id === selectedDoc) || docs[0];

  return (
    <div className="flex-1 bg-slate-950 flex flex-col overflow-y-auto custom-scrollbar select-none">
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold text-white tracking-wide">
              Official User Guides & Developer Documentation
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full p-6 flex flex-col md:flex-row gap-6 flex-1">
        {/* Left Doc Index */}
        <div className="w-full md:w-64 space-y-2 shrink-0">
          {docs.map(doc => {
            const Icon = doc.icon;
            const isSelected = selectedDoc === doc.id;
            return (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc.id)}
                className={`w-full text-left p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{doc.title}</span>
              </button>
            );
          })}
        </div>

        {/* Right Doc Article Content */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-8 text-slate-200 text-xs leading-relaxed space-y-4">
          <h2 className="text-base font-bold text-white pb-3 border-b border-slate-800">
            {currentDoc.title}
          </h2>
          <div className="prose prose-invert max-w-none space-y-3 font-sans">
            {currentDoc.content.split('\n\n').map((paragraph, idx) => (
              <div key={idx} className="space-y-1">
                {paragraph.startsWith('###') ? (
                  <h3 className="text-sm font-bold text-indigo-300 mt-2">{paragraph.replace('###', '').trim()}</h3>
                ) : (
                  <p className="text-slate-300 leading-relaxed whitespace-pre-line">{paragraph}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
