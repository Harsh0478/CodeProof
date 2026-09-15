function esc(value='') {
  return String(value)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

export function downloadVerificationReport({ translation, verification, tests = [], filename }) {
  const unavailable = Boolean(verification?.executionUnavailable);
  const score = verification?.score ?? translation?.verificationScore ?? null;
  const passed = verification?.passedTests ?? tests.filter(t => t.status === 'PASS').length;
  const total = verification?.totalTests ?? tests.length;
  const scoreText = unavailable || score == null ? '—' : `${score}%`;
  const testsText = unavailable ? `—/${total}` : `${passed}/${total}`;
  const aiConfidence = verification?.aiConfidence != null ? `${Math.round(verification.aiConfidence * 100)}%` : '—';
  const generatedAt = new Date().toLocaleString();

  const rows = tests.map((t, i) => `
    <tr>
      <td>${esc(t.name || `TC_${i+1}`)}</td>
      <td><pre>${esc(t.input || '')}</pre></td>
      <td><pre>${esc(t.expectedOutput ?? t.originalOutput ?? '')}</pre></td>
      <td><pre>${esc(t.actualOutput ?? t.translatedOutput ?? '')}</pre></td>
      <td class="${String(t.status || '').toLowerCase()}">${esc(t.status || '—')}</td>
      <td>${esc(t.error || '—')}</td>
    </tr>`).join('');

  const issues = verification?.issues || verification?.aiReview?.issues || [];
  const failed = tests.filter(t => !['PASS','PASSED','VERIFIED'].includes(String(t.status || '').toUpperCase()));
  const explanation = unavailable
    ? 'Behavioral verification was not established because the execution sandbox was unavailable. Start Docker Desktop and run verification again.'
    : score === 100 && failed.length === 0
      ? 'All comparable tests passed and no behavioral mismatch was recorded.'
      : failed.length
        ? `Verification needs review because ${failed.length} test case(s) did not pass. Review the detailed errors below and compare the original and generated outputs.`
        : 'Verification did not reach 100%. Review the AI findings and behavioral evidence.';

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(filename || 'CodeProof Verification Report')}</title>
  <style>
    body{font-family:Inter,Segoe UI,Arial,sans-serif;color:#172033;background:#f6f8fb;margin:0;padding:32px}
    .wrap{max-width:1100px;margin:auto}.header,.card{background:#fff;border:1px solid #e4e9f0;border-radius:18px;padding:24px;margin-bottom:18px}
    h1,h2{margin:0 0 8px}.muted{color:#667085}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.metric{padding:14px;border-radius:12px;background:#f7f8fb}.metric b{display:block;font-size:22px;margin-top:5px}
    .codegrid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.code{background:#0f172a;color:#e5edf8;border-radius:12px;padding:16px;overflow:auto}.code pre{white-space:pre-wrap}
    table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:10px;border-bottom:1px solid #edf1f5;text-align:left;vertical-align:top}th{background:#f8fafc}.pass{color:#14804a}.fail,.compilation_error,.runtime_error{color:#b42318}pre{margin:0;white-space:pre-wrap}
    .why{background:#fff8e7;border:1px solid #f6d889;padding:14px;border-radius:12px}.footer{font-size:12px;color:#667085;text-align:center;padding:20px}
    @media print{body{background:#fff;padding:0}.header,.card{break-inside:avoid}.footer{display:block}}
    @media(max-width:800px){.grid,.codegrid{grid-template-columns:1fr 1fr}.codegrid{grid-template-columns:1fr}.grid{grid-template-columns:1fr 1fr}}
  </style></head><body><div class="wrap">
  <section class="header"><div class="muted">CodeProof · AI-Verified Legacy Code Migration</div><h1>${esc(translation?.sourceLanguage)} → ${esc(translation?.targetLanguage)}</h1><div class="muted">Generated ${esc(generatedAt)}</div></section>
  <section class="card"><h2>Verification summary</h2><div class="grid">
    <div class="metric">Verification score<b>${scoreText}</b></div><div class="metric">Tests<b>${testsText}</b></div><div class="metric">Compilation errors<b>${verification?.compilationErrors ?? 0}</b></div><div class="metric">Runtime errors<b>${verification?.runtimeErrors ?? 0}</b></div>
  </div><div class="grid" style="margin-top:12px"><div class="metric">Execution time<b>${verification?.executionTime ?? 0} ms</b></div><div class="metric">AI confidence<b>${aiConfidence}</b></div><div class="metric">Status<b>${esc(translation?.status || '—')}</b></div><div class="metric">Provider<b>${esc(translation?.aiProvider || '—')}</b></div></div></section>
  <section class="card"><h2>${unavailable ? 'Why verification was unavailable' : `Why did verification ${score === 100 ? 'pass' : 'need review'}?`}</h2><p>${esc(explanation)}</p>${issues.length ? `<div class="why"><strong>AI findings:</strong><ul>${issues.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></div>`:''}</section>
  <section class="card"><div class="codegrid"><div><h2>Source code</h2><div class="code"><pre>${esc(translation?.sourceCode || '')}</pre></div></div><div><h2>Generated code</h2><div class="code"><pre>${esc(translation?.generatedCode || '')}</pre></div></div></div></section>
  <section class="card"><h2>Behavioral test evidence</h2><table><thead><tr><th>Test</th><th>Input</th><th>Expected</th><th>Actual</th><th>Status</th><th>Error</th></tr></thead><tbody>${rows || '<tr><td colspan="6">No test cases recorded.</td></tr>'}</tbody></table></section>
  <div class="footer">CodeProof · Translate. Execute. Compare. Prove.</div></div></body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `CodeProof-${translation?.sourceLanguage || 'source'}-to-${translation?.targetLanguage || 'target'}-verification-report.html`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  return html;
}

export function printVerificationReport({ translation, verification, tests = [] }) {
  const html = downloadVerificationReport({ translation, verification, tests, filename: 'CodeProof-verification-report.html' });
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.addEventListener('load', () => printWindow.print(), { once: true });
  }
}
