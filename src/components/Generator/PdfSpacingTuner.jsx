import { useState, useEffect } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { ResumeDocument, RESUME_DEFAULT_SPACING } from '../../services/resumePdfService';
import { CoverLetterDocument, CL_DEFAULT_SPACING } from '../../services/coverLetterPdfService';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function SliderRow({ label, name, value, min, max, step, onChange }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs text-gray-600 w-40 shrink-0">{label}</span>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(name, Number(e.target.value))}
        className="flex-1 accent-blue-600"
      />
      <span className="text-xs font-mono w-8 text-right text-gray-900 font-medium">{value}</span>
    </div>
  );
}

function SliderGroup({ title, children }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{title}</p>
      {children}
    </div>
  );
}

const RESUME_SLIDER_CONFIG = [
  { group: 'Page', items: [
    { label: 'Padding Top', name: 'paddingTop', min: 10, max: 60, step: 1 },
    { label: 'Padding Bottom', name: 'paddingBottom', min: 10, max: 60, step: 1 },
    { label: 'Padding Left', name: 'paddingLeft', min: 20, max: 72, step: 1 },
    { label: 'Padding Right', name: 'paddingRight', min: 20, max: 72, step: 1 },
    { label: 'Line Height', name: 'lineHeight', min: 1.0, max: 1.5, step: 0.05 },
  ]},
  { group: 'Header', items: [
    { label: 'Name bottom gap', name: 'nameMarginBottom', min: 0, max: 30, step: 1 },
    { label: 'Header block bottom', name: 'headerMarginBottom', min: 0, max: 20, step: 1 },
    { label: 'Contact bottom gap', name: 'contactMarginBottom', min: 0, max: 20, step: 1 },
  ]},
  { group: 'Sections', items: [
    { label: 'Section top gap', name: 'sectionMarginTop', min: 0, max: 20, step: 1 },
    { label: 'Section bottom gap', name: 'sectionMarginBottom', min: 0, max: 14, step: 1 },
  ]},
  { group: 'Content', items: [
    { label: 'Paragraph bottom', name: 'paragraphMarginBottom', min: 0, max: 16, step: 1 },
    { label: 'Bullet bottom gap', name: 'bulletMarginBottom', min: 0, max: 12, step: 1 },
    { label: 'Job header top', name: 'jobHeaderMarginTop', min: 0, max: 14, step: 1 },
    { label: 'Job header bottom', name: 'jobHeaderMarginBottom', min: 0, max: 10, step: 1 },
    { label: 'Education row top', name: 'educationMarginTop', min: 0, max: 16, step: 1 },
    { label: 'Education row bottom', name: 'educationMarginBottom', min: 0, max: 10, step: 1 },
  ]},
];

const CL_SLIDER_CONFIG = [
  { group: 'Page', items: [
    { label: 'Padding Top', name: 'paddingTop', min: 10, max: 60, step: 1 },
    { label: 'Padding Bottom', name: 'paddingBottom', min: 10, max: 60, step: 1 },
    { label: 'Padding Left', name: 'paddingLeft', min: 20, max: 72, step: 1 },
    { label: 'Padding Right', name: 'paddingRight', min: 20, max: 72, step: 1 },
    { label: 'Line Height', name: 'lineHeight', min: 1.0, max: 1.5, step: 0.05 },
  ]},
  { group: 'Header', items: [
    { label: 'Name bottom gap', name: 'nameMarginBottom', min: 0, max: 24, step: 1 },
    { label: 'Contact bottom gap', name: 'contactMarginBottom', min: 0, max: 20, step: 1 },
    { label: 'Border bottom gap', name: 'borderMarginBottom', min: 4, max: 40, step: 1 },
  ]},
  { group: 'Content', items: [
    { label: 'Paragraph bottom', name: 'paragraphMarginBottom', min: 0, max: 24, step: 1 },
    { label: 'Recipient bottom', name: 'recipientMarginBottom', min: 0, max: 24, step: 1 },
    { label: 'Salutation bottom', name: 'salutationMarginBottom', min: 0, max: 24, step: 1 },
    { label: 'Sign-off top', name: 'signOffMarginTop', min: 0, max: 36, step: 1 },
    { label: 'Sign-off bottom', name: 'signOffMarginBottom', min: 0, max: 48, step: 1 },
  ]},
];

function ResumeTab() {
  const [jsonText, setJsonText] = useState('');
  const [resumeData, setResumeData] = useState(null);
  const [jsonError, setJsonError] = useState('');
  const [spacing, setSpacing] = useState(RESUME_DEFAULT_SPACING);
  const [copied, setCopied] = useState(false);
  const debouncedSpacing = useDebounce(spacing, 400);

  const handleLoad = () => {
    setJsonError('');
    try {
      setResumeData(JSON.parse(jsonText));
    } catch {
      setJsonError('Invalid JSON');
    }
  };

  const updateSpacing = (name, value) => setSpacing(prev => ({ ...prev, [name]: value }));

  const handleReset = () => setSpacing(RESUME_DEFAULT_SPACING);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(spacing, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full">
      {/* Left controls */}
      <div className="w-72 shrink-0 overflow-y-auto bg-gray-50 border-r border-gray-200 p-4">
        {!resumeData ? (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Paste resume JSON</p>
            <textarea
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              rows={12}
              className="w-full border border-gray-300 rounded-lg p-2 text-xs font-mono mb-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder='{"personalInfo": {...}, "experience": [...], ...}'
            />
            {jsonError && <p className="text-red-600 text-xs mb-2">{jsonError}</p>}
            <button onClick={handleLoad} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              Load & Preview
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-green-600 font-medium">JSON loaded</span>
              <button onClick={() => setResumeData(null)} className="text-xs text-gray-400 hover:text-gray-600 underline">Change</button>
            </div>

            {RESUME_SLIDER_CONFIG.map(({ group, items }) => (
              <SliderGroup key={group} title={group}>
                {items.map(item => (
                  <SliderRow key={item.name} {...item} value={spacing[item.name]} onChange={updateSpacing} />
                ))}
              </SliderGroup>
            ))}

            <div className="flex gap-2 mt-2">
              <button onClick={handleReset} className="flex-1 border border-gray-300 text-gray-600 py-1.5 rounded text-xs hover:bg-gray-100">
                Reset
              </button>
              <button onClick={handleCopy} className="flex-1 bg-blue-600 text-white py-1.5 rounded text-xs hover:bg-blue-700">
                {copied ? 'Copied!' : 'Copy Values'}
              </button>
            </div>

            <pre className="mt-3 text-xs bg-white border border-gray-200 rounded p-2 overflow-auto max-h-48 text-gray-600">
              {JSON.stringify(spacing, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Right preview */}
      <div className="flex-1 bg-gray-200">
        {resumeData ? (
          <PDFViewer width="100%" height="100%" showToolbar={false}>
            <ResumeDocument resumeData={resumeData} spacing={debouncedSpacing} />
          </PDFViewer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Load a JSON to see the preview
          </div>
        )}
      </div>
    </div>
  );
}

function CoverLetterTab() {
  const [jsonText, setJsonText] = useState('');
  const [clData, setClData] = useState(null);
  const [jsonError, setJsonError] = useState('');
  const [spacing, setSpacing] = useState(CL_DEFAULT_SPACING);
  const [copied, setCopied] = useState(false);
  const debouncedSpacing = useDebounce(spacing, 400);

  const handleLoad = () => {
    setJsonError('');
    try {
      setClData(JSON.parse(jsonText));
    } catch {
      setJsonError('Invalid JSON');
    }
  };

  const updateSpacing = (name, value) => setSpacing(prev => ({ ...prev, [name]: value }));

  const handleReset = () => setSpacing(CL_DEFAULT_SPACING);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(spacing, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full">
      {/* Left controls */}
      <div className="w-72 shrink-0 overflow-y-auto bg-gray-50 border-r border-gray-200 p-4">
        {!clData ? (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Paste cover letter JSON</p>
            <textarea
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              rows={12}
              className="w-full border border-gray-300 rounded-lg p-2 text-xs font-mono mb-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder='{"personalInfo": {...}, "letterDetails": {...}, ...}'
            />
            {jsonError && <p className="text-red-600 text-xs mb-2">{jsonError}</p>}
            <button onClick={handleLoad} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              Load & Preview
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-green-600 font-medium">JSON loaded</span>
              <button onClick={() => setClData(null)} className="text-xs text-gray-400 hover:text-gray-600 underline">Change</button>
            </div>

            {CL_SLIDER_CONFIG.map(({ group, items }) => (
              <SliderGroup key={group} title={group}>
                {items.map(item => (
                  <SliderRow key={item.name} {...item} value={spacing[item.name]} onChange={updateSpacing} />
                ))}
              </SliderGroup>
            ))}

            <div className="flex gap-2 mt-2">
              <button onClick={handleReset} className="flex-1 border border-gray-300 text-gray-600 py-1.5 rounded text-xs hover:bg-gray-100">
                Reset
              </button>
              <button onClick={handleCopy} className="flex-1 bg-blue-600 text-white py-1.5 rounded text-xs hover:bg-blue-700">
                {copied ? 'Copied!' : 'Copy Values'}
              </button>
            </div>

            <pre className="mt-3 text-xs bg-white border border-gray-200 rounded p-2 overflow-auto max-h-48 text-gray-600">
              {JSON.stringify(spacing, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Right preview */}
      <div className="flex-1 bg-gray-200">
        {clData ? (
          <PDFViewer width="100%" height="100%" showToolbar={false}>
            <CoverLetterDocument data={clData} spacing={debouncedSpacing} />
          </PDFViewer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Load a JSON to see the preview
          </div>
        )}
      </div>
    </div>
  );
}

export default function PdfSpacingTuner() {
  const [tab, setTab] = useState('resume');

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-white px-4 shrink-0">
        {[{ id: 'resume', label: 'Resume PDF' }, { id: 'cover', label: 'Cover Letter PDF' }].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'resume' ? <ResumeTab /> : <CoverLetterTab />}
      </div>
    </div>
  );
}
