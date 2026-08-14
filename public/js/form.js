/* form.js – complaint submission */

document.addEventListener('DOMContentLoaded', () => {
  // Pre-fill category from URL param
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('category');
  if (cat) {
    const sel = document.getElementById('category');
    if (sel) {
      for (let opt of sel.options) {
        if (opt.value === cat) { opt.selected = true; break; }
      }
    }
  }

  document.getElementById('complaintForm').addEventListener('submit', handleSubmit);
});

async function handleSubmit(e) {
  e.preventDefault();

  const errEl = document.getElementById('formError');
  errEl.style.display = 'none';

  const mobile = document.getElementById('mobile').value;
  if (!/^[0-9]{10}$/.test(mobile)) {
    errEl.textContent = 'Please enter a valid 10-digit mobile number.';
    errEl.style.display = 'block';
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span>Submitting...</span>';

  try {
    const formData = new FormData(document.getElementById('complaintForm'));
    const res = await fetch('/api/complaints', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Submission failed');

    // Show success modal
    document.getElementById('generatedId').textContent = data.complaintId;
    document.getElementById('trackLink').href = `track.html?id=${data.complaintId}`;
    document.getElementById('successModal').classList.add('open');

  } catch (err) {
    errEl.textContent = err.message || 'Something went wrong. Please try again.';
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span data-i18n="form_submit">Submit Complaint</span>';
  }
}
