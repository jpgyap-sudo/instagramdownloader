import { useRef, useState } from 'react';

const findVideoUrl = (obj, depth = 0) => {
  if (depth > 10 || obj == null) return null;
  if (typeof obj === 'string') {
    if (obj.startsWith('http') && (obj.includes('.mp4') || obj.includes('video'))) {
      return obj;
    }
    return null;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findVideoUrl(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof obj === 'object') {
    const keys = ['video_url', 'download_url', 'url', 'src', 'hd_url', 'sd_url', 'video_versions'];
    for (const key of keys) {
      if (obj[key]) {
        const found = findVideoUrl(obj[key], depth + 1);
        if (found) return found;
      }
    }
    for (const key in obj) {
      const found = findVideoUrl(obj[key], depth + 1);
      if (found) return found;
    }
  }
  return null;
};

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('info');
  const [videoUrl, setVideoUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const videoRef = useRef(null);

  const updateStatus = (message, type) => {
    setStatus(message);
    setStatusType(type || 'info');
  };

  const fetchVideo = async () => {
    setShowPreview(false);
    setStatus('');
    if (!url.includes('instagram.com')) {
      updateStatus('Please enter a valid Instagram URL.', 'error');
      return;
    }

    setBusy(true);
    updateStatus('Fetching video...', 'info');

    try {
      const res = await fetch(`/api/fetch?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        updateStatus('Error: ' + (data.error || 'Could not fetch video.'), 'error');
        setBusy(false);
        return;
      }

      const vid = findVideoUrl(data);
      if (!vid) {
        updateStatus('No video found. The post may be private or not a video.', 'error');
        setBusy(false);
        return;
      }

      setVideoUrl(vid);
      setShowPreview(true);
      updateStatus('Video ready! Click download to save it.', 'success');
    } catch (error) {
      updateStatus('Network error: ' + error.message, 'error');
    }

    setBusy(false);
  };

  const downloadVideo = async () => {
    if (!videoUrl) return;
    const button = document.getElementById('dlBtn');
    if (button) {
      button.textContent = 'Downloading...';
      button.disabled = true;
    }

    try {
      const res = await fetch(videoUrl);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `instagram_${Date.now()}.mp4`;
      a.click();
    } catch {
      updateStatus('Could not download video directly. Try opening it in a new tab.', 'error');
    }

    if (button) {
      button.textContent = 'Download Video';
      button.disabled = false;
    }
  };

  return (
    <div className="wrap">
      <div className="header">
        <div className="logo">
          <svg viewBox="0 0 24 24">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
          </svg>
        </div>
        <h1>Instagram Video Downloader</h1>
        <p className="sub">Download Reels and videos instantly</p>
      </div>

      <div className="card">
        <label htmlFor="urlInput">Instagram Video / Reel URL</label>
        <div className="row">
          <input
            id="urlInput"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchVideo()}
            placeholder="https://www.instagram.com/reel/..."
          />
          <button className="btn btn-fetch" onClick={fetchVideo} disabled={busy}>
            {busy ? <><span className="spinner" /> Fetching...</> : 'Fetch'}
          </button>
        </div>
        <div className={`status ${statusType}`} style={{ display: status ? 'block' : 'none' }}>
          {status}
        </div>
      </div>

      <div className="card" style={{ display: showPreview ? 'block' : 'none' }}>
        <video controls ref={videoRef} id="videoEl" src={videoUrl} style={{ display: showPreview ? 'block' : 'none' }} />
        <button className="btn btn-dl" id="dlBtn" onClick={downloadVideo}>
          Download Video
        </button>
        <button className="btn btn-open" type="button" onClick={() => window.open(videoUrl, '_blank')}>
          Open in New Tab
        </button>
      </div>

      <style jsx>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .wrap { width: 100%; max-width: 520px; margin: 0 auto; padding: 1rem; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fafafa; }
        .header { text-align: center; margin-bottom: 2rem; }
        .logo { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
        .logo svg { width: 30px; height: 30px; fill: none; stroke: white; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        h1 { font-size: 22px; font-weight: 600; color: #111; }
        .sub { font-size: 14px; color: #888; margin-top: 4px; }
        .card { background: white; border: 1px solid #e5e5e5; border-radius: 16px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        label { font-size: 13px; color: #555; display: block; margin-bottom: 6px; }
        input[type=text] { width: 100%; padding: 10px 14px; font-size: 14px; border: 1px solid #ddd; border-radius: 10px; background: #f9f9f9; color: #111; outline: none; margin-bottom: 1rem; }
        input:focus { border-color: #bc1888; background: white; }
        .row { display: flex; gap: 8px; }
        .row input { flex: 1; margin-bottom: 0; }
        .btn { padding: 10px 20px; font-size: 14px; font-weight: 600; border-radius: 10px; border: none; cursor: pointer; transition: opacity 0.15s; }
        .btn:hover { opacity: 0.88; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-fetch { background: linear-gradient(135deg, #dc2743, #bc1888); color: white; }
        .btn-dl { background: #1a8a3e; color: white; width: 100%; margin-top: 12px; font-size: 15px; padding: 12px; }
        .btn-open { background: #555; color: white; width: 100%; margin-top: 8px; font-size: 14px; padding: 11px; display: block; }
        .status { font-size: 13px; padding: 10px 14px; border-radius: 10px; margin-top: 12px; }
        .info { background: #e8f0fe; color: #1a56db; }
        .error { background: #fde8e8; color: #c81e1e; }
        .success { background: #e8f7ee; color: #1a6e3e; }
        video { width: 100%; border-radius: 10px; border: 1px solid #eee; max-height: 380px; }
        .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: middle; margin-right: 6px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
