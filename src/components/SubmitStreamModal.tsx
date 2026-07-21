import React, { useState } from "react";
import { X, ExternalLink, PlusCircle, AlertTriangle } from "lucide-react";

interface SubmitStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: "light" | "dark";
}

const REPO_OWNER = "robot3-track";
const REPO_NAME = "worldchannels";

const COUNTRY_OPTIONS = [
  "AF", "AL", "DZ", "AD", "AO", "AG", "AR", "AM", "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BT", "BO", "BA", "BW", "BR", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", "LC", "CF", "TD", "CL", "CN", "CO", "KM", "CG", "CD", "CR", "HR", "CU", "CY", "CZ", "DK", "DJ", "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FJ", "FI", "FR", "GA", "GM", "GE", "DE", "GH", "GR", "GD", "GT", "GN", "GW", "GY", "HT", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IL", "IT", "CI", "JM", "JP", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MR", "MU", "MX", "FM", "MD", "MC", "MN", "ME", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NZ", "NI", "NE", "NG", "MK", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PL", "PT", "QA", "RO", "RU", "RW", "KN", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SK", "SI", "SB", "SO", "ZA", "SS", "ES", "LK", "SD", "SR", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TO", "TT", "TN", "TR", "TM", "TV", "UG", "UA", "AE", "UK", "US", "UY", "UZ", "VU", "VA", "VE", "VN", "YE", "ZM", "ZW"
];

// compliance blocklist keys
const complianceKeys = [
  'eHh4', 'cG9ybg==', 'YWR1bHQ=', 'MTgr', 'c2V4', 
  'ZXJvdGlj', 'aGVudGFp', 'bnNmdw==', 'cGxheWJveQ==', 
  'cmVkbGlnaHQ=', 'cGluayBv', 'ZGF0aW5n', 'bmFrZWQ=', 'bXljYW10dg=='
];

// helper
const blockedKeywords = complianceKeys.map((key) => atob(key).toLowerCase());

export function SubmitStreamModal({
  isOpen,
  onClose,
  theme = "dark"
}: SubmitStreamModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    country: "US",
    category: "news",
    url: ""
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Prevent global shortcut keys (like '/') from interrupting input focus
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Combine form values into one string for rapid checking
    const combinedInput = `${formData.name} ${formData.category} ${formData.url}`.toLowerCase();

    // Check if input contains any blocked keyword
    const containsBadContent = blockedKeywords.some((keyword) =>
      combinedInput.includes(keyword)
    );

    if (containsBadContent) {
      setErrorMsg("This channel submission violates community content guidelines.");
      return;
    }

    // Format description text for standard Issue body
    const issueBody = `### New Stream Channel Submission

- **Channel Name:** ${formData.name}
- **Country Code:** ${formData.country}
- **Category:** ${formData.category}
- **Stream / M3U8 URL:** ${formData.url}

---
*Submitted via World Channels Web Interface.*`;

    // Constructs standard GitHub issue parameters
    const params = new URLSearchParams({
      title: `Stream Submission: ${formData.name}`,
      body: issueBody,
      labels: "stream-submission"
    });

    const issueUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/new?${params.toString()}`;
    
    window.open(issueUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] font-mono"
      onKeyDown={handleKeyDown}
    >
      <div className={`relative w-full max-w-md border-2 p-5 shadow-2xl transition-all ${
        theme === "light" 
          ? "bg-white border-zinc-900 text-zinc-900" 
          : "bg-zinc-950 border-neutral-800 text-neutral-100"
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 pb-3 mb-4 border-indigo-600">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-wider">
              Submit Channel via GitHub
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Box */}
        <p className="text-[11px] leading-relaxed mb-4 text-zinc-400 border-l-2 border-indigo-500 pl-2.5 py-0.5">
          Submitting opens a pre-filled GitHub Issue on <code className="text-indigo-400 font-bold">{REPO_OWNER}/{REPO_NAME}</code>. Once approved by maintainers, your stream will automatically be added to <code className="text-indigo-400 font-bold">api/streams.js</code>.
        </p>

        {/* Validation Error Banner */}
        {errorMsg && (
          <div className="mb-4 p-2.5 bg-red-950/80 border-2 border-red-600 text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold uppercase mb-1 text-[10px] text-indigo-400">
              Channel Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. BBC News Live"
              className={`w-full border-2 p-2 outline-none font-bold uppercase ${
                theme === "light" 
                  ? "bg-zinc-100 border-zinc-900 text-zinc-900" 
                  : "bg-zinc-900 border-neutral-700 text-white"
              }`}
              value={formData.name}
              onChange={(e) => {
                setErrorMsg(null);
                setFormData({ ...formData, name: e.target.value });
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase mb-1 text-[10px] text-indigo-400">
                Country
              </label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className={`w-full border-2 p-2 outline-none font-bold uppercase cursor-pointer ${
                  theme === "light" 
                    ? "bg-zinc-100 border-zinc-900 text-zinc-900" 
                    : "bg-zinc-900 border-neutral-700 text-white"
                }`}
              >
                {COUNTRY_OPTIONS.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase mb-1 text-[10px] text-indigo-400">
                Category
              </label>
              <input
                type="text"
                required
                placeholder="news, sports..."
                className={`w-full border-2 p-2 outline-none font-bold uppercase ${
                  theme === "light" 
                    ? "bg-zinc-100 border-zinc-900 text-zinc-900" 
                    : "bg-zinc-900 border-neutral-700 text-white"
                }`}
                value={formData.category}
                onChange={(e) => {
                  setErrorMsg(null);
                  setFormData({ ...formData, category: e.target.value });
                }}
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase mb-1 text-[10px] text-indigo-400">
              Stream / M3U8 URL
            </label>
            <input
              type="url"
              required
              placeholder="https://domain.com/live.m3u8"
              className={`w-full border-2 p-2 outline-none font-bold break-all ${
                theme === "light" 
                  ? "bg-zinc-100 border-zinc-900 text-zinc-900" 
                  : "bg-zinc-900 border-neutral-700 text-white"
              }`}
              value={formData.url}
              onChange={(e) => {
                setErrorMsg(null);
                setFormData({ ...formData, url: e.target.value });
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 p-2.5 border-2 border-zinc-700 font-bold uppercase hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 p-2.5 bg-indigo-600 hover:bg-indigo-500 border-2 border-indigo-500 text-white font-bold uppercase flex items-center justify-center gap-1.5 transition-colors shadow-lg"
            >
              <span>Continue</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}