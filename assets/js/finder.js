/* ============================================================
   Insight - Levinger - Doctor Finder (front-end)
   Vanilla JS. Reads window.INSIGHT_LDF (localized by PHP) and renders
   a location + language filter, then branded doctor cards.
   No diagnostics, no treatment names shown — doctor cards only.
   ============================================================ */
(function () {
	'use strict';

	var DATA = window.INSIGHT_LDF;
	var root = document.getElementById('insight-doctor-finder');
	if (!DATA || !root || !Array.isArray(DATA.doctors)) {
		return;
	}

	var state = { city: '', lang: '' }; // '' = all / no preference
	var searched = false;

	var ICON_PIN = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
	var ICON_INFO = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';
	var ICON_WA = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15l-1.4 5 5.1-1.3A10 10 0 1012 2zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5s-1.2-1.6-1.2-3 .7-2.1 1-2.4c.2-.3.5-.4.7-.4h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.5-.3.4c-.1.1-.3.3-.1.6s.6 1 1.3 1.7c.9.8 1.6 1 1.9 1.2.3.1.5.1.6-.1l.7-.9c.2-.3.4-.2.6-.1l1.9.9c.2.1.4.2.5.3.1.3.1.7-.1 1.4z"/></svg>';

	function esc(s) {
		var d = document.createElement('div');
		d.textContent = s == null ? '' : String(s);
		return d.innerHTML;
	}
	function centerName(id) {
		for (var i = 0; i < DATA.locations.length; i++) {
			if (DATA.locations[i].id === id) {
				return DATA.locations[i].name;
			}
		}
		return '';
	}
	function initials(name) {
		var clean = String(name).replace(/^(ד"ר|דר'?|פרופ'?׳?|פרופ)\s*/, '').trim();
		var parts = clean.split(/\s+/);
		return ((parts[0] || '')[0] || '') + ((parts[1] || '')[0] || '');
	}
	function doctorClinics(d) {
		return (d.centers || []).map(centerName).filter(Boolean);
	}
	function waLink(d) {
		var clinics = doctorClinics(d);
		var clinic = '';
		if (state.city) {
			clinic = centerName(parseInt(state.city, 10));
		}
		if (!clinic && clinics.length) {
			clinic = clinics[0];
		}
		var msg = 'שלום, הגעתי דרך מאתר רופאי העיניים באתר דר לוינגר. אשמח לתאם בדיקת התאמה אצל ' + d.name;
		if (clinic) {
			msg += ' בסניף ' + clinic;
		}
		msg += '.';
		return 'https://api.whatsapp.com/send?phone=' + DATA.waPhone + '&text=' + encodeURIComponent(msg);
	}

	function filtered() {
		var list = DATA.doctors.slice();
		if (state.city) {
			var cid = parseInt(state.city, 10);
			list = list.filter(function (d) {
				return (d.centers || []).indexOf(cid) !== -1;
			});
		}
		if (state.lang) {
			list = list.filter(function (d) {
				return (d.langs || []).indexOf(state.lang) !== -1;
			});
		}
		// random order (no preference signals in this build)
		return list
			.map(function (d) {
				return { d: d, r: Math.random() };
			})
			.sort(function (a, b) {
				return a.r - b.r;
			})
			.map(function (o) {
				return o.d;
			});
	}

	function chip(label, value, group, active) {
		return (
			'<button type="button" class="idf-chip" data-group="' +
			group +
			'" data-val="' +
			esc(value) +
			'" aria-pressed="' +
			(active ? 'true' : 'false') +
			'">' +
			esc(label) +
			'</button>'
		);
	}

	function renderShell() {
		var locChips = chip('כל הסניפים', '', 'city', state.city === '');
		DATA.locations.forEach(function (l) {
			locChips += chip(l.name, String(l.id), 'city', state.city === String(l.id));
		});

		var langChips = chip('אין העדפה', '', 'lang', state.lang === '');
		DATA.languages.forEach(function (l) {
			langChips += chip(l, l, 'lang', state.lang === l);
		});

		root.innerHTML =
			'<div class="idf-app">' +
			'<div class="idf-head"><h2>מצאו את הרופא המתאים לכם</h2><p>בחרו סניף ושפה, ונציג את הרופאים המתאימים.</p></div>' +
			'<div class="idf-filters">' +
			'<div class="idf-group"><span class="idf-glabel">סניף</span><div class="idf-chips" id="idf-city">' +
			locChips +
			'</div></div>' +
			'<div class="idf-group"><span class="idf-glabel">הרופא שלי חייב לדבר</span><div class="idf-chips" id="idf-lang">' +
			langChips +
			'</div></div>' +
			'<div class="idf-go-row"><button type="button" class="idf-btn idf-btn-primary" id="idf-go">הצגת הרופאים המתאימים</button></div>' +
			'</div>' +
			'<div id="idf-results"></div>' +
			'</div>';

		root.querySelectorAll('.idf-chip').forEach(function (btn) {
			btn.addEventListener('click', function () {
				var group = btn.getAttribute('data-group');
				state[group] = btn.getAttribute('data-val');
				// reflect selection within its group
				root
					.querySelectorAll('.idf-chip[data-group="' + group + '"]')
					.forEach(function (b) {
						b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
					});
				if (searched) {
					renderResults();
				}
			});
		});
		root.querySelector('#idf-go').addEventListener('click', function () {
			searched = true;
			renderResults();
			var r = root.querySelector('#idf-results');
			if (r && r.scrollIntoView) {
				r.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		});
	}

	function card(d) {
		var clinics = doctorClinics(d);
		var avatar = d.thumb
			? '<span class="idf-avatar"><img src="' + esc(d.thumb) + '" alt="' + esc(d.name) + '" loading="lazy"></span>'
			: '<span class="idf-avatar">' + esc(initials(d.name)) + '</span>';
		var langChips = (d.langs || [])
			.map(function (l) {
				return '<span class="idf-lchip">' + esc(l) + '</span>';
			})
			.join('');
		var clinicHtml = clinics.length
			? '<div class="idf-clinic">' + ICON_PIN + '<span>' + esc(clinics.join(' · ')) + '</span></div>'
			: '';
		var langHtml = langChips
			? '<div class="idf-row"><div class="idf-row-lbl">שפות</div><div class="idf-mini-chips">' + langChips + '</div></div>'
			: '';
		var descHtml = d.desc ? '<div class="idf-desc">' + esc(d.desc) + '</div>' : '';

		return (
			'<article class="idf-card">' +
			'<div class="idf-card-top">' +
			avatar +
			'<div><div class="idf-name">' + esc(d.name) + '</div>' +
			(d.sub ? '<div class="idf-sub">' + esc(d.sub) + '</div>' : '') +
			'</div></div>' +
			clinicHtml +
			langHtml +
			descHtml +
			'<div class="idf-cta">' +
			'<a class="idf-btn idf-btn-primary" href="' + waLink(d) + '" target="_blank" rel="noopener">' + ICON_WA + ' תיאום בדיקת התאמה</a>' +
			'<a class="idf-btn idf-btn-secondary" href="' + esc(d.url) + '">לעמוד הרופא</a>' +
			'</div>' +
			'</article>'
		);
	}

	function renderResults() {
		var list = filtered();
		var box = root.querySelector('#idf-results');
		if (!box) {
			return;
		}
		var cityTxt = state.city ? ' ב' + centerName(parseInt(state.city, 10)) : '';

		if (!list.length) {
			box.innerHTML =
				'<div class="idf-results"><div class="idf-empty">לא נמצאו רופאים מתאימים לסינון הזה. נסו להרחיב את הבחירה.' +
				'<div><button type="button" class="idf-btn idf-btn-secondary" id="idf-reset">ניקוי הסינון</button></div></div></div>';
			var rb = box.querySelector('#idf-reset');
			if (rb) {
				rb.addEventListener('click', function () {
					state.city = '';
					state.lang = '';
					renderShell();
					searched = true;
					renderResults();
				});
			}
			return;
		}

		var cards = list
			.map(function (d) {
				return card(d);
			})
			.join('');

		box.innerHTML =
			'<div class="idf-results">' +
			'<div class="idf-rhead"><h2>הרופאים שעשויים להתאים לכם' + esc(cityTxt) + '</h2>' +
			'<div class="idf-count">מציג ' + list.length + ' רופאים</div></div>' +
			'<div class="idf-grid">' + cards + '</div>' +
			'<div class="idf-disclaimer">' + ICON_INFO + '<span>המידע כאן עוזר לכם למצוא רופא. ההחלטה על התאמה לטיפול ועל השיטה המתאימה נעשית בבדיקת התאמה אצל הרופא.</span></div>' +
			'</div>';
	}

	renderShell();
})();
