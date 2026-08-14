/* dashboard.js – ward issues dashboard */

async function loadDashboard() {
  try {
    const res  = await fetch('/api/complaints/dashboard');
    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    // Animate numbers
    animateCount('statTotal',    data.total    || 0);
    animateCount('statPending',  (data.pending || 0) + (data.underReview || 0));
    animateCount('statProgress', data.inProgress || 0);
    animateCount('statResolved', data.resolved   || 0);

    renderWardGrid(data.wards || []);

    const el = document.getElementById('lastUpdated');
    if (el) el.textContent = 'Last updated: ' + new Date().toLocaleTimeString();

  } catch (err) {
    console.error('Dashboard error:', err);
  }
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = Math.max(1, Math.floor(target / 40));
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 30);
}

function renderWardGrid(wards) {
  const grid = document.getElementById('wardGrid');
  if (!wards.length) {
    grid.innerHTML = '<p style="color:var(--muted);font-size:13px">No ward data yet. Complaints will appear here.</p>';
    return;
  }
  const max = Math.max(...wards.map(w => w.count));
  grid.innerHTML = wards.map(w => {
    const ratio = w.count / max;
    const cls   = ratio > 0.66 ? 'ward-high' : ratio > 0.33 ? 'ward-medium' : 'ward-low';
    return `
      <div class="ward-cell ${cls}">
        <div class="ward-num">Ward ${w._id}</div>
        <div class="ward-count">${w.count} complaint${w.count !== 1 ? 's' : ''}</div>
        <div style="font-size:10px;margin-top:4px;opacity:0.8">${w.topCategory ? w.topCategory.split(' ')[0] : ''}</div>
      </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  setInterval(loadDashboard, 60000); // auto refresh every 60 seconds
});
