export const command = `top -l 1 | grep "CPU usage"; echo "---CPUP---"; ps -Ao pcpu,comm -r | sed -n '2,7p'; echo "---MEMD---"; sysctl -n hw.memsize; echo "---MEMP---"; memory_pressure | grep "free percentage"; echo "---MEMPROC---"; ps -Ao rss,comm -m | sed -n '2,7p'; echo "---DFD---"; df -H / | tail -1; echo "---DU---"; du -d 1 -h ~ 2>/dev/null | sort -rh | head -6`;

// Combined widget refreshes every 15s. The disk section scans your home
// folder each time, which is heavier than a plain CPU/RAM read, so this is
// a balance between "live" and "not chewing through CPU on its own".
export const refreshFrequency = 15000;

export const className = `
  top: 20px;
  right: 20px;
  left: auto;
  width: 280px;
  font-family: 'SF Mono', 'Fira Code', 'Menlo', monospace;
  color: #e8e8e8;
  background: rgba(10, 10, 10, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  padding: 16px 18px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 0 28px rgba(255, 255, 255, 0.12), inset 0 0 30px rgba(255, 255, 255, 0.03);
  }

  .title {
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #888;
    margin-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    padding-bottom: 10px;
    display: flex;
    justify-content: space-between;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.6);
    display: inline-block;
    animation: pulse 2s infinite ease-in-out;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .section {
    padding: 10px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .section:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 6px;
  }

  .section-label {
    font-size: 10px;
    letter-spacing: 2px;
    color: #999;
    text-transform: uppercase;
  }

  .section-value {
    font-size: 20px;
    font-weight: 600;
    color: #fff;
  }

  .section-sub {
    font-size: 9px;
    color: #777;
    text-align: right;
    line-height: 1.4;
  }

  .bar-track {
    width: 100%;
    height: 3px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 2px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #777, #fff);
    transition: width 0.6s ease;
  }

  .details {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition: max-height 0.35s ease, opacity 0.35s ease, margin-top 0.35s ease;
    margin-top: 0;
  }

  .section:hover .details {
    max-height: 180px;
    opacity: 1;
    margin-top: 8px;
  }

  .details-title {
    font-size: 8px;
    letter-spacing: 1px;
    color: #666;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .row {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    padding: 2px 0;
    color: #ccc;
  }

  .row-name {
    opacity: 0.8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 175px;
  }

  .row-val {
    color: #fff;
    font-weight: 600;
  }
`;

export const render = ({ output }) => {
  if (!output) {
    return (
      <div>
        <div className="title">
          <span>// SYSTEM</span>
          <span className="dot" />
        </div>
        <div className="section-value">--</div>
      </div>
    );
  }

  const [cpuSummary = "", r1 = ""] = output.split("---CPUP---");
  const [cpuProcBlock = "", r2 = ""] = r1.split("---MEMD---");
  const [memsizeBlock = "", r3 = ""] = r2.split("---MEMP---");
  const [pressureLine = "", r4 = ""] = r3.split("---MEMPROC---");
  const [memProcBlock = "", r5 = ""] = r4.split("---DFD---");
  const [dfLine = "", duBlock = ""] = r5.split("---DU---");

  // --- CPU ---
  const cpuMatch = cpuSummary.match(/([\d.]+)% user, ([\d.]+)% sys, ([\d.]+)% idle/);
  const cpuUser = cpuMatch ? parseFloat(cpuMatch[1]) : 0;
  const cpuSys = cpuMatch ? parseFloat(cpuMatch[2]) : 0;
  const cpuTotal = Math.min(100, Math.round((cpuUser + cpuSys) * 10) / 10);

  const cpuProcs = cpuProcBlock
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const t = line.trim();
      const i = t.indexOf(" ");
      if (i === -1) return { pct: "0.0", name: t };
      return { pct: t.slice(0, i), name: t.slice(i).trim() };
    });

  // --- Memory ---
  const totalBytes = parseFloat(memsizeBlock.trim()) || 0;
  const memTotal = totalBytes / 1024 / 1024 / 1024;
  const pressureMatch = pressureLine.match(/free percentage:\s*([\d.]+)%/);
  const freePct = pressureMatch ? parseFloat(pressureMatch[1]) : 100;
  const memPct = Math.round((100 - freePct) * 10) / 10;
  const memUsed = (memTotal * memPct) / 100;
  const memFree = memTotal - memUsed;

  const memProcs = memProcBlock
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const t = line.trim();
      const i = t.indexOf(" ");
      if (i === -1) return { mb: "0", name: t };
      const rssKb = parseInt(t.slice(0, i), 10) || 0;
      return { mb: Math.round(rssKb / 1024), name: t.slice(i).trim() };
    });

  // --- Disk ---
  const cols = dfLine.trim().split(/\s+/);
  const diskSize = cols[1] || "--";
  const diskUsed = cols[2] || "--";
  const diskAvail = cols[3] || "--";
  const diskPct = parseFloat((cols[4] || "0").replace("%", "")) || 0;

  const folders = duBlock
    .trim()
    .split("\n")
    .filter(Boolean)
    .slice(0, 6)
    .map((line) => {
      const parts = line.trim().split(/\s+/);
      const folderSize = parts[0];
      const path = parts.slice(1).join(" ");
      return { folderSize, name: path.split("/").pop() || path };
    });

  return (
    <div>
      <div className="title">
        <span>// SYSTEM</span>
        <span className="dot" />
      </div>

      <div className="section">
        <div className="section-header">
          <span className="section-label">CPU</span>
          <span className="section-sub">
            usr {cpuUser}%<br />
            sys {cpuSys}%
          </span>
        </div>
        <div className="section-value">{cpuTotal}%</div>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${cpuTotal}%` }} />
        </div>
        <div className="details">
          <div className="details-title">Top Processes</div>
          {cpuProcs.map((p, i) => (
            <div className="row" key={i}>
              <span className="row-name">{p.name}</span>
              <span className="row-val">{p.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <span className="section-label">Memory</span>
          <span className="section-sub">
            {memUsed.toFixed(1)}G used<br />
            {memFree.toFixed(1)}G free
          </span>
        </div>
        <div className="section-value">{memPct}%</div>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${memPct}%` }} />
        </div>
        <div className="details">
          <div className="details-title">Top Processes</div>
          {memProcs.map((p, i) => (
            <div className="row" key={i}>
              <span className="row-name">{p.name}</span>
              <span className="row-val">{p.mb} MB</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <span className="section-label">Disk</span>
          <span className="section-sub">
            {diskUsed} used<br />
            {diskAvail} free
          </span>
        </div>
        <div className="section-value">{diskPct}%</div>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${diskPct}%` }} />
        </div>
        <div className="details">
          <div className="details-title">Largest in Home ({diskSize} total)</div>
          {folders.map((f, i) => (
            <div className="row" key={i}>
              <span className="row-name">{f.name}</span>
              <span className="row-val">{f.folderSize}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
