import { getUserData, getDiaryEntries, getMissionsProgress, getChatMessages } from './storage';
import { PROFILES, OFFICIAL_SIGNATURE } from '../config';

export function generateReportHtml(): string {
  const user = getUserData();
  const diary = getDiaryEntries();
  const missions = getMissionsProgress();
  const chat = getChatMessages();
  const profileDetails = user?.profile ? PROFILES[user.profile] : null;

  const totalInvites = diary.reduce((sum, d) => sum + (d.invitesCount || 0), 0);
  const totalClosures = diary.reduce((sum, d) => sum + (d.calamitaClosuresCount || 0), 0);
  const avgRating =
    diary.length > 0
      ? (diary.reduce((sum, d) => sum + (d.rating || 3), 0) / diary.length).toFixed(1)
      : '-';

  const readUnitsCount = user?.readUnits?.length || 0;
  const completedMissionsCount = Object.values(missions).filter((m) => m.completed).length;

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <title>Effetto Calamita – Report di ${user?.name || 'Allievo'}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      margin: 0;
      padding: 20px;
      background: #ffffff;
    }
    .header {
      border-bottom: 2px solid #042B58;
      padding-bottom: 15px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      color: #042B58;
      margin: 0;
      letter-spacing: 1px;
    }
    .subtitle {
      font-size: 13px;
      color: #b45309;
      font-style: italic;
      margin-top: 3px;
    }
    .meta {
      font-size: 12px;
      color: #64748b;
      text-align: right;
    }
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #042B58;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 5px;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .stat-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
    }
    .stat-val {
      font-size: 20px;
      font-weight: bold;
      color: #042B58;
    }
    .stat-label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .profile-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
    }
    .profile-name {
      font-size: 16px;
      font-weight: bold;
      color: #166534;
      margin: 0 0 4px 0;
    }
    .profile-tagline {
      font-size: 12px;
      color: #15803d;
      font-style: italic;
      margin-bottom: 8px;
    }
    .profile-desc {
      font-size: 12px;
      color: #334155;
      line-height: 1.4;
    }
    .entry-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
      page-break-inside: avoid;
    }
    .entry-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .entry-venue {
      font-size: 14px;
      font-weight: bold;
      color: #042B58;
    }
    .entry-date {
      font-size: 12px;
      color: #64748b;
    }
    .entry-stats {
      font-size: 12px;
      color: #475569;
      margin-bottom: 8px;
    }
    .entry-notes {
      font-size: 12px;
      color: #334155;
      margin-bottom: 8px;
    }
    .entry-advice {
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
      padding: 10px 12px;
      font-size: 12px;
      color: #78350f;
      border-radius: 0 6px 6px 0;
      margin-top: 8px;
      white-space: pre-wrap;
    }
    .advice-title {
      font-weight: bold;
      color: #b45309;
      margin-bottom: 4px;
      text-transform: uppercase;
      font-size: 11px;
    }
    .footer {
      margin-top: 40px;
      border-top: 1px solid #cbd5e1;
      padding-top: 15px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      font-style: italic;
    }
    .no-print {
      margin-bottom: 20px;
      text-align: center;
    }
    .btn-print {
      background: #042B58;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
    }
    @media print {
      .no-print {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn-print" onclick="window.print()">Salva come PDF / Stampa</button>
  </div>

  <div class="header">
    <div>
      <h1 class="title">EFFETTO CALAMITA</h1>
      <div class="subtitle">Il metodo del flirt invisibile – di Andrea Frattesi</div>
    </div>
    <div class="meta">
      <div><strong>Allievo:</strong> ${user?.name || 'Utente registrato'}</div>
      <div><strong>Data report:</strong> ${new Date().toLocaleDateString('it-IT')}</div>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-val">${readUnitsCount}</div>
      <div class="stat-label">Capitoli Letti</div>
    </div>
    <div class="stat-box">
      <div class="stat-val">${diary.length}</div>
      <div class="stat-label">Serate a Diario</div>
    </div>
    <div class="stat-box">
      <div class="stat-val">${avgRating}/5</div>
      <div class="stat-label">Media Termometro</div>
    </div>
    <div class="stat-box">
      <div class="stat-val">${totalInvites}</div>
      <div class="stat-label">Inviti Fatti</div>
    </div>
  </div>

  ${
    profileDetails
      ? `<div class="section">
          <div class="section-title">Profilo Personale dal Test</div>
          <div class="profile-card">
            <div class="profile-name">Profilo: ${profileDetails.name}</div>
            <div class="profile-tagline">«${profileDetails.tagline}»</div>
            <div class="profile-desc">${profileDetails.description}</div>
            <div style="margin-top: 10px; font-weight: 600; font-size: 12px; color: #166534;">
              Focus Principale: ${profileDetails.focus}
            </div>
          </div>
        </div>`
      : ''
  }

  <div class="section">
    <div class="section-title">Diario di Bordo & Consigli del Coach (${diary.length} serate)</div>
    ${
      diary.length === 0
        ? '<p style="font-size: 12px; color: #64748b; font-style: italic;">Nessuna serata ancora registrata nel diario.</p>'
        : diary
            .map(
              (entry) => `
      <div class="entry-card">
        <div class="entry-header">
          <div class="entry-venue">${entry.venue || 'Serata'} • Termometro: ${entry.rating}/5</div>
          <div class="entry-date">${entry.date || new Date(entry.createdAt).toLocaleDateString('it-IT')}</div>
        </div>
        <div class="entry-stats">
          <strong>Inviti:</strong> ${entry.invitesCount ?? 0} &nbsp;|&nbsp; 
          <strong>No Eleganti:</strong> ${entry.elegantNoCount ?? 0} &nbsp;|&nbsp; 
          <strong>Chiusure Calamita:</strong> ${entry.calamitaClosuresCount ?? 0} &nbsp;|&nbsp; 
          <strong>Missione:</strong> ${entry.missionCompleted ? 'Completata' : 'In corso'}
        </div>
        ${
          entry.whatWorked
            ? `<div class="entry-notes"><strong>Cosa ha funzionato:</strong> ${entry.whatWorked}</div>`
            : ''
        }
        ${
          entry.whatToImprove
            ? `<div class="entry-notes"><strong>Cosa migliorare:</strong> ${entry.whatToImprove}</div>`
            : ''
        }
        ${
          entry.coachAdvice
            ? `<div class="entry-advice">
                <div class="advice-title">Consiglio del Coach Andrea Frattesi:</div>
                <div>${entry.coachAdvice.replace(/\[\[([a-zA-Z0-9_-]+)\]\]/g, '$1')}</div>
              </div>`
            : ''
        }
      </div>`
            )
            .join('')
    }
  </div>

  <div class="footer">
    "${OFFICIAL_SIGNATURE}"<br />
    Effetto Calamita – www.andreafrattesi.com
  </div>
</body>
</html>`;
}

export function exportAndPrintReport(): void {
  const html = generateReportHtml();
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    // Allow styles to load before triggering print
    setTimeout(() => {
      try {
        printWindow.print();
      } catch {
        // Fallback handled by the in-page print button
      }
    }, 400);
  } else {
    // If popup blocked, download as printable HTML report
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `effetto-calamita-report-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
