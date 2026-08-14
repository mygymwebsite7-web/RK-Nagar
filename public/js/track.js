/* track.js – complaint tracking */

const STATUSES = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (id) {
    document.getElementById('trackInput').value = id;
    trackComplaint();
  }
});

async function trackComplaint() {
  const id = document.getElementById('trackInput').value.trim();
  if (!id) return;

  document.getElementById('trackResult').style.display = 'none';
  document.getElementById('trackError').style.display  = 'none';

  try {
    const res  = await fetch(`/api/complaints/${encodeURIComponent(id)}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    renderProgress(data.status);
    renderDetails(data);
    document.getElementById('trackResult').style.display = 'block';

  } catch {
    document.getElementById('trackError').style.display = 'block';
  }
}

function renderProgress(currentStatus) {
  const idx = STATUSES.indexOf(currentStatus);
  const container = document.getElementById('progressTracker');
  let html = '';

  STATUSES.forEach((s, i) => {
    const cls = i < idx ? 'completed' : i === idx ? 'active' : '';
    html += `
      <div class="step ${cls}">
        <div class="step-circle">${i < idx ? '✓' : i + 1}</div>
        <div class="step-label">${s}</div>
      </div>`;
    if (i < STATUSES.length - 1) {
      html += `<div class="step-line ${i < idx ? 'done' : ''}"></div>`;
    }
  });

  container.innerHTML = html;
}

function renderDetails(d) {
  const date = new Date(d.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('complaintDetails').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;">
      <div><span style="font-size:11px;color:var(--muted);display:block;">COMPLAINT ID</span>
           <strong style="color:var(--red)">${d.complaintId}</strong></div>
      <div><span style="font-size:11px;color:var(--muted);display:block;">CATEGORY</span>
           <strong>${d.category}</strong></div>
      <div><span style="font-size:11px;color:var(--muted);display:block;">AREA</span>
           <strong>${d.area}</strong></div>
      <div><span style="font-size:11px;color:var(--muted);display:block;">WARD</span>
           <strong>${d.wardNumber}</strong></div>
      <div><span style="font-size:11px;color:var(--muted);display:block;">DATE SUBMITTED</span>
           <strong>${date}</strong></div>
      ${d.landmark ? `<div><span style="font-size:11px;color:var(--muted);display:block;">LANDMARK</span>
           <strong>${d.landmark}</strong></div>` : ''}
    </div>
    ${d.photo ? `<div style="margin-top:16px;"><img src="${d.photo}" style="max-width:100%;border-radius:8px;max-height:200px;object-fit:cover;"></div>` : ''}
  `;
}
