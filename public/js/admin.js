/* admin.js – admin panel logic */

let allComplaints = [];

async function doLogin() {
  const username = document.getElementById('adminUser').value.trim();
  const password = document.getElementById('adminPass').value;
  const errEl    = document.getElementById('loginError');
  const btn      = document.getElementById('loginBtn');
  errEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Logging in...';

  try {
    const res  = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    localStorage.setItem('tvk-admin-token', data.token);
    showPanel();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Login';
  }
}

function doLogout() {
  localStorage.removeItem('tvk-admin-token');
  document.getElementById('loginPanel').style.display = 'flex';
  document.getElementById('adminPanel').style.display = 'none';
  allComplaints = [];
}

function showPanel() {
  document.getElementById('loginPanel').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  loadComplaints();
}

async function loadComplaints() {
  const token = localStorage.getItem('tvk-admin-token');
  if (!token) { doLogout(); return; }

  document.getElementById('tableBody').innerHTML =
    '<tr><td colspan="9" style="text-align:center;padding:30px;color:var(--muted);">Loading...</td></tr>';

  try {
    const res = await fetch('/api/admin/complaints', {
      headers: { 'Authorization': 'Bearer ' + token },
      cache: 'no-store',
    });

    if (res.status === 401) {
      // Token expired — clear it and show login
      localStorage.removeItem('tvk-admin-token');
      doLogout();
      return;
    }

    const raw = await res.text();
    let data;
    try { data = JSON.parse(raw); } catch { data = null; }

    if (!res.ok) {
      const msg = (data && data.error) ? data.error : raw;
      document.getElementById('tableBody').innerHTML =
        `<tr><td colspan="9" style="text-align:center;padding:30px;color:#c0392b;font-family:monospace;font-size:12px;">
          ❌ HTTP ${res.status}: ${msg}
        </td></tr>`;
      return;
    }

    allComplaints = Array.isArray(data) ? data : [];
    renderStats();
    renderTable();
  } catch (err) {
    document.getElementById('tableBody').innerHTML =
      `<tr><td colspan="9" style="text-align:center;padding:30px;color:#c0392b;font-family:monospace;font-size:12px;">
        ❌ Network error – ${err.message}
      </td></tr>`;
  }
}

function renderStats() {
  const counts = { total: allComplaints.length, submitted: 0, review: 0, assigned: 0, progress: 0, resolved: 0 };
  allComplaints.forEach(c => {
    if (c.status === 'Submitted')    counts.submitted++;
    if (c.status === 'Under Review') counts.review++;
    if (c.status === 'Assigned')     counts.assigned++;
    if (c.status === 'In Progress')  counts.progress++;
    if (c.status === 'Resolved')     counts.resolved++;
  });
  document.getElementById('adminStats').innerHTML = `
    <div class="stat-card"><div class="stat-num">${counts.total}</div><div class="stat-label">Total</div></div>
    <div class="stat-card" style="border-top-color:#1565c0"><div class="stat-num" style="color:#1565c0">${counts.submitted}</div><div class="stat-label">Submitted</div></div>
    <div class="stat-card" style="border-top-color:#e65100"><div class="stat-num" style="color:#e65100">${counts.review + counts.assigned}</div><div class="stat-label">Under Review</div></div>
    <div class="stat-card" style="border-top-color:#7b1fa2"><div class="stat-num" style="color:#7b1fa2">${counts.progress}</div><div class="stat-label">In Progress</div></div>
    <div class="stat-card" style="border-top-color:#2e7d32"><div class="stat-num" style="color:#2e7d32">${counts.resolved}</div><div class="stat-label">Resolved</div></div>
  `;
}

function renderTable() {
  const status   = document.getElementById('filterStatus').value;
  const category = document.getElementById('filterCategory').value;
  const ward     = document.getElementById('filterWard').value.trim().toLowerCase();

  const filtered = allComplaints.filter(c => {
    const w = (c.ward_number || '').toString().toLowerCase();
    return (!status   || c.status   === status)   &&
           (!category || c.category === category) &&
           (!ward     || w.includes(ward));
  });

  document.getElementById('tableBody').innerHTML = filtered.length
    ? filtered.map(c => {
        const date = new Date(c.created_at).toLocaleDateString('en-IN');
        return `<tr>
          <td><strong style="color:var(--red)">${c.complaint_id || ''}</strong></td>
          <td>${c.name}</td>
          <td>${c.mobile}</td>
          <td>${c.ward_number || ''}</td>
          <td>${c.category}</td>
          <td>${c.area}${c.landmark ? '<br><small style="color:var(--muted)">'+c.landmark+'</small>' : ''}</td>
          <td>${date}</td>
          <td>
            <select class="status-select" onchange="updateStatus(${c.id}, this.value)">
              ${['Submitted','Under Review','Assigned','In Progress','Resolved'].map(s =>
                `<option ${s===c.status?'selected':''}>${s}</option>`
              ).join('')}
            </select>
          </td>
          <td>${c.photo ? `<a href="${c.photo}" target="_blank" style="color:var(--red);font-size:12px;">📷 View</a>` : '–'}</td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="9" style="text-align:center;padding:30px;color:var(--muted);">No complaints found.</td></tr>';
}

async function updateStatus(id, status) {
  const token = localStorage.getItem('tvk-admin-token');
  try {
    const res = await fetch(`/api/admin/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert('Failed to update status: ' + (err.error || 'Server error'));
      return;
    }
    const c = allComplaints.find(x => x.id === id);
    if (c) { c.status = status; renderStats(); renderTable(); }
  } catch (err) {
    alert('Network error: ' + err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('tvk-admin-token');
  if (token) {
    showPanel();
  } else {
    document.getElementById('loginPanel').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
  }
});

// Auto-refresh every 15 seconds
setInterval(() => {
  if (document.getElementById('adminPanel').style.display !== 'none') {
    loadComplaints();
  }
}, 15000);

// Refresh when tab becomes visible
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && document.getElementById('adminPanel').style.display !== 'none') {
    loadComplaints();
  }
});
