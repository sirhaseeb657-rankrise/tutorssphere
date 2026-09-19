const store = {
	get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (error) { return fallback; } },
	set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

const announcements = [
	{ tag: 'Admissions', date: '08 Sep 2026', title: 'O/A Level exam season matching is open', text: 'Tell us your subjects and we will connect you with Cambridge-experienced tutors.' },
	{ tag: 'Tutor network', date: '02 Sep 2026', title: 'TutorSphere is now accepting tutor applications', text: 'Qualified educators in Islamabad, Rawalpindi, Lahore and Karachi can apply today.' },
	{ tag: 'Learning note', date: '28 Aug 2026', title: 'Small, consistent study wins', text: 'Our latest guide shares practical ways parents can build a calmer study routine.' }
];
const seededComments = [
	{ name: 'Sana R.', role: 'Parent of O Level student', comment: 'The matching process was thoughtful and our tutor understood exactly where my daughter needed support.', approved: true },
	{ name: 'Hamza A.', role: 'A Level student', comment: 'The online lessons are structured, focused and much easier to fit around my schedule.', approved: true },
	{ name: 'Maham K.', role: 'Parent', comment: 'We saw a real improvement in confidence after only a few weeks of home tuition.', approved: true }
];
let requests = store.get('ts_requests', []);
let comments = store.get('ts_comments', seededComments);
const ADMIN_EMAIL = 'admin@tutorsphere.pk';
const ADMIN_PASSWORD = 'TutorSphere@2026';
const CONTACT_EMAIL = 'sirhaseeb657@gmail.com';

const byId = id => document.getElementById(id);
const formData = form => Object.fromEntries(new FormData(form).entries());
const setStatus = (form, message) => { const status = form.querySelector('.form-status'); if (status) status.textContent = message; };

function renderAnnouncements() {
	byId('announcement-list').innerHTML = announcements.map(item => `<article class="announcement-card"><span class="tag">${item.tag}</span><h3>${item.title}</h3><p>${item.text}</p><small>${item.date}</small></article>`).join('');
	byId('admin-announcements').innerHTML = `<div class="table-row header"><span>Title</span><span>Category</span><span>Date</span><span>Status</span><span></span></div>` + announcements.map(item => `<div class="table-row"><strong>${item.title}</strong><span>${item.tag}</span><span>${item.date}</span><span class="status-pill approved">Published</span><span></span></div>`).join('');
}

function renderComments() {
	const approved = comments.filter(item => item.approved);
	byId('approved-comments').innerHTML = approved.length ? approved.map(item => `<article class="comment-card"><p>“${item.comment}”</p><strong>${item.name}</strong><small>${item.role}</small></article>`).join('') : '<p>No approved comments yet.</p>';
	const pending = comments.filter(item => !item.approved);
	byId('comment-count').textContent = pending.length;
	byId('metric-comments').textContent = pending.length;
	byId('recent-comments').innerHTML = pending.length ? pending.slice(-3).reverse().map(item => `<div class="admin-list-item"><span><strong>${item.name}</strong><small>${item.comment.slice(0, 45)}...</small></span><span class="status">Pending</span></div>`).join('') : '<div class="admin-list-item"><span><strong>All clear</strong><small>No comments waiting for review.</small></span><span class="status-pill approved">Done</span></div>';
	byId('all-comments').innerHTML = pending.length ? `<div class="table-row header"><span>Author</span><span>Comment</span><span>Role</span><span>Status</span><span>Action</span></div>${pending.map((item, index) => `<div class="table-row"><strong>${item.name}</strong><span>${item.comment}</span><span>${item.role}</span><span class="status-pill">Pending</span><button class="action-button" data-approve="${comments.indexOf(item)}">Approve</button></div>`).join('')}` : '<div class="empty-state">No comments are waiting for approval.</div>';
}

function renderRequests() {
	byId('request-count').textContent = requests.length;
	byId('metric-requests').textContent = requests.length;
	const rows = requests.slice().reverse();
	byId('recent-requests').innerHTML = rows.length ? rows.slice(0, 4).map(item => `<div class="admin-list-item"><span><strong>${item.name}</strong><small>${item.subject} · ${item.location}</small></span><span class="status">New</span></div>`).join('') : '<div class="admin-list-item"><span><strong>No requests yet</strong><small>New student requests will appear here.</small></span></div>';
	byId('all-requests').innerHTML = rows.length ? `<div class="table-row header"><span>Student</span><span>Subject</span><span>Curriculum</span><span>Mode</span><span>Phone</span></div>${rows.map(item => `<div class="table-row"><strong>${item.name}<small>${item.location}</small></strong><span>${item.subject}</span><span>${item.curriculum}</span><span class="status-pill">${item.mode}</span><span>${item.phone}</span></div>`).join('')}` : '<div class="empty-state">No student requests yet. New submissions will appear here.</div>';
}

function openAdmin() { byId('admin').classList.add('open'); byId('admin').setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; ensureAdminAuth(); if (store.get('ts_admin_session', null)) { byId('admin-auth').classList.add('hidden'); byId('admin').querySelector('.admin-body').classList.remove('hidden'); byId('admin').querySelector('.admin-header').classList.remove('hidden'); renderAdmin(); } else showAdminAuth(); }
function closeAdmin() { byId('admin').classList.remove('open'); byId('admin').setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; if (location.hash === '#admin') history.replaceState(null, '', '#home'); }
function renderAdmin() { renderRequests(); renderComments(); renderAnnouncements(); }
function selectTab(tab) { document.querySelectorAll('.admin-tab').forEach(button => button.classList.toggle('active', button.dataset.tab === tab)); document.querySelectorAll('.admin-panel').forEach(panel => panel.classList.toggle('hidden', panel.dataset.panel !== tab)); }

function ensureAdminAuth() {
	if (byId('admin-auth')) return;
	byId('admin').querySelector('.admin-shell').insertAdjacentHTML('afterbegin', `<section id="admin-auth" class="admin-auth" aria-label="Admin sign in"><div class="admin-auth-card"><span class="brand-mark">T</span><p class="eyebrow">Private workspace</p><h1>Admin sign in</h1><p>Sign in to manage requests, comments and announcements.</p><form id="admin-login-form"><label>Email address<input name="email" type="email" autocomplete="username" placeholder="admin@tutorsphere.pk" required></label><label>Password<input name="password" type="password" autocomplete="current-password" placeholder="Enter password" required></label><button class="button button-primary" type="submit">Sign in <span>&#8594;</span></button><p class="form-status" role="status"></p></form><button class="text-link" type="button" data-close-admin>Back to public site <span>&#8594;</span></button></div></section>`);
	byId('admin').querySelector('.admin-user').insertAdjacentHTML('beforeend', '<button class="admin-signout" type="button" data-signout>Sign out / Logout</button>');
	byId('admin-login-form').addEventListener('submit', event => { event.preventDefault(); const data = formData(event.currentTarget); if (data.email === ADMIN_EMAIL && data.password === ADMIN_PASSWORD) { store.set('ts_admin_session', { email: data.email, signedInAt: new Date().toISOString() }); byId('admin-auth').classList.add('hidden'); byId('admin').querySelector('.admin-body').classList.remove('hidden'); byId('admin').querySelector('.admin-header').classList.remove('hidden'); renderAdmin(); } else setStatus(event.currentTarget, 'Incorrect email or password. Please try again.'); });
}
function showAdminAuth() { ensureAdminAuth(); byId('admin-auth').classList.remove('hidden'); byId('admin').querySelector('.admin-body').classList.add('hidden'); byId('admin').querySelector('.admin-header').classList.add('hidden'); }
function signOutAdmin() { localStorage.removeItem('ts_admin_session'); showAdminAuth(); }
function addContactActions() {
	document.querySelectorAll('a[href="mailto:hello@tutorsphere.pk"]').forEach(link => { link.href = `mailto:${CONTACT_EMAIL}`; link.textContent = CONTACT_EMAIL; });
	document.querySelectorAll('a[href^="tel:+92"]').forEach(link => { link.href = `https://wa.me/${link.href.replace('tel:+', '')}`; link.target = '_blank'; link.rel = 'noopener'; });
	if (!byId('whatsapp-cta')) document.body.insertAdjacentHTML('beforeend', `<a id="whatsapp-cta" class="whatsapp-cta" href="https://wa.me/923400502140?text=Hello%20TutorSphere%2C%20I%20need%20help%20finding%20a%20tutor." target="_blank" rel="noopener" aria-label="Chat with TutorSphere on WhatsApp"><span>◔</span><strong>WhatsApp us</strong></a>`);
}

function addInternationalOnlineOptions() {
	const locationSelect = document.querySelector('#student-request-form select[name="location"]');
	['United Kingdom', 'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'United States', 'Canada', 'Australia'].forEach(country => {
		const option = document.createElement('option');
		option.textContent = country;
		locationSelect.appendChild(option);
	});
	byId('online-tuition').querySelector('p').textContent = 'Interactive live classes for students in Pakistan, the UK, UAE, Saudi Arabia, Qatar, USA, Canada, Australia and around the world.';
	document.querySelector('.admin-metrics div:last-child strong').textContent = '4000+';
}

document.querySelector('.menu-toggle').addEventListener('click', event => { const nav = byId('main-nav'); const open = nav.classList.toggle('open'); event.currentTarget.setAttribute('aria-expanded', String(open)); });
document.querySelector('.nav-parent').addEventListener('click', event => { event.currentTarget.parentElement.classList.toggle('open'); });
document.querySelectorAll('.main-nav a').forEach(link => link.addEventListener('click', () => { byId('main-nav').classList.remove('open'); document.querySelector('.menu-toggle').setAttribute('aria-expanded', 'false'); }));
document.querySelectorAll('[data-admin-link]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); openAdmin(); }));
document.querySelectorAll('[data-close-admin]').forEach(element => element.addEventListener('click', closeAdmin));
window.addEventListener('hashchange', () => { if (location.hash === '#admin') openAdmin(); });
document.addEventListener('click', event => { if (event.target.closest('[data-signout]')) signOutAdmin(); });

byId('student-request-form').addEventListener('submit', event => { event.preventDefault(); const data = formData(event.currentTarget); data.createdAt = new Date().toISOString(); requests.push(data); store.set('ts_requests', requests); setStatus(event.currentTarget, 'Thank you. Our academic team will contact you within one business day.'); event.currentTarget.reset(); renderAdmin(); });
byId('tutor-application-form').addEventListener('submit', event => { event.preventDefault(); setStatus(event.currentTarget, 'Application received. Our team will review your details and contact you shortly.'); event.currentTarget.reset(); });
byId('contact-form').addEventListener('submit', event => { event.preventDefault(); setStatus(event.currentTarget, 'Message received. We will reply as soon as possible.'); event.currentTarget.reset(); });
byId('comment-form').addEventListener('submit', event => { event.preventDefault(); const data = formData(event.currentTarget); comments.push({ ...data, approved: false }); store.set('ts_comments', comments); setStatus(event.currentTarget, 'Thanks. Your comment is waiting for admin approval.'); event.currentTarget.reset(); renderAdmin(); });
document.addEventListener('click', event => { const tab = event.target.closest('[data-tab], [data-tab-target]'); if (tab) { selectTab(tab.dataset.tab || tab.dataset.tabTarget); } const approve = event.target.closest('[data-approve]'); if (approve) { comments[Number(approve.dataset.approve)].approved = true; store.set('ts_comments', comments); renderAdmin(); } if (event.target.closest('[data-close-admin]')) closeAdmin(); });

renderAdmin();
addContactActions();
addInternationalOnlineOptions();
ensureAdminAuth();
if (location.hash === '#admin') openAdmin();
