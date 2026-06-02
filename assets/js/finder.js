/* ============================================================
   Insight - Levinger - Doctor Finder (front-end)
   Vanilla JS. Reads window.INSIGHT_LDF (localized by PHP).
   Stepped wizard: goal → age → glasses/contacts → number → cylinder
   → location → language → results.
   ONLY location + language filter the doctor list. The other answers are
   collected for personalization and appended to the WhatsApp exam message.
   Results are doctor cards only — no diagnosis, no treatment names shown.
   ============================================================ */
(function () {
	'use strict';

	var DATA = window.INSIGHT_LDF;
	var root = document.getElementById('insight-doctor-finder');
	if (!DATA || !root || !Array.isArray(DATA.doctors)) {
		return;
	}

	var answers = {};
	var stepIdx = 0;

	/* ---- icons (Lucide-style line icons; no emoji) ---- */
	var ICON = {
		eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
		book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
		help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
		glasses: '<circle cx="6" cy="15" r="3.4"/><circle cx="18" cy="15" r="3.4"/><path d="M10.2 15a1.8 1.8 0 0 1 3.6 0"/><path d="M2.6 13.4 4.6 10"/><path d="M21.4 13.4 19.4 10"/>',
		lens: '<circle cx="12" cy="12" r="8"/><path d="M8.5 9.5A5 5 0 0 1 12 8"/>',
		layers: '<path d="M12 2 21 7l-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5"/>',
		pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
		info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
		check: '<path d="M20 6 9 17l-5-5"/>'
	};
	function svg(name, size) {
		size = size || 22;
		return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICON[name] || '') + '</svg>';
	}
	var WA_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15l-1.4 5 5.1-1.3A10 10 0 1012 2zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5s-1.2-1.6-1.2-3 .7-2.1 1-2.4c.2-.3.5-.4.7-.4h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.5-.3.4c-.1.1-.3.3-.1.6s.6 1 1.3 1.7c.9.8 1.6 1 1.9 1.2.3.1.5.1.6-.1l.7-.9c.2-.3.4-.2.6-.1l1.9.9c.2.1.4.2.5.3.1.3.1.7-.1 1.4z"/></svg>';

	/* ---- steps. filter:true means it narrows the doctor list. ---- */
	var STEPS = {
		goal: { q: 'מה תרצו לשפר?', opts: [
			{ v: 'distance', icon: 'eye', label: 'ראייה למרחק', desc: 'נהיגה, שלטים, טלוויזיה' },
			{ v: 'near', icon: 'book', label: 'גם קריאה מקרוב', desc: 'ספר, טלפון, מסך' },
			{ v: 'not_sure', icon: 'help', label: 'עוד לא יודע/ת', desc: 'רוצה לבדוק מה מתאים' }
		] },
		age: { q: 'מה טווח הגיל שלכם?', opts: [
			{ v: 'u40', label: 'עד 40' }, { v: '40_55', label: '40 עד 55' }, { v: '55', label: '55 ומעלה' }
		] },
		wear: { q: 'מה אתם מרכיבים היום?', opts: [
			{ v: 'glasses', icon: 'glasses', label: 'משקפיים' }, { v: 'contacts', icon: 'lens', label: 'עדשות מגע' }, { v: 'both', icon: 'layers', label: 'שניהם' }
		] },
		rx: { q: 'עוצמת המספר, אם ידועה לכם', opts: [
			{ v: 'low', label: 'נמוך', desc: 'עד 3 בערך' }, { v: 'med', label: 'בינוני', desc: '3 עד 6' },
			{ v: 'high', label: 'גבוה', desc: '6 ומעלה' }, { v: 'unknown', label: 'לא ידוע לי' }
		] },
		cyl: { q: 'צילינדר (אסטיגמציה)?', opts: [
			{ v: 'yes', label: 'יש לי' }, { v: 'no', label: 'אין' }, { v: 'unknown', label: 'לא יודע/ת' }
		] },
		location: { q: 'איפה נוח לכם?', filter: true, dynamic: 'location' },
		language: { q: 'הרופא שלי חייב לדבר', filter: true, dynamic: 'language' }
	};

	function optsFor(key) {
		var step = STEPS[key];
		if (step.dynamic === 'location') {
			return DATA.locations.map(function (l) {
				return { v: String(l.id), label: l.name };
			});
		}
		if (step.dynamic === 'language') {
			return [{ v: '', label: 'אין העדפה' }].concat(
				DATA.languages.map(function (l) {
					return { v: l, label: l };
				})
			);
		}
		return step.opts;
	}

	function sequence() {
		var s = ['goal'];
		if (answers.goal !== 'not_sure') {
			s.push('age', 'wear', 'rx', 'cyl');
		}
		s.push('location', 'language');
		return s;
	}

	/* ---- helpers ---- */
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
		var p = clean.split(/\s+/);
		return ((p[0] || '')[0] || '') + ((p[1] || '')[0] || '');
	}
	function labelFor(key, val) {
		var opts = optsFor(key);
		for (var i = 0; i < opts.length; i++) {
			if (opts[i].v === val) {
				return opts[i].label;
			}
		}
		return val;
	}
	function doctorClinics(d) {
		return (d.centers || []).map(centerName).filter(Boolean);
	}

	/* ---- WhatsApp message: name + clinic + every collected answer ---- */
	function waMessage(name, clinic) {
		var first = 'שלום, הגעתי דרך מאתר רופאי העיניים באתר דר לוינגר. אשמח לתאם בדיקת התאמה';
		if (name) {
			first += ' אצל ' + name;
		}
		if (clinic) {
			first += ' בסניף ' + clinic;
		}
		first += '.';
		var det = [];
		[['goal', 'מטרה'], ['age', 'גיל'], ['wear', 'מרכיב/ה'], ['rx', 'מספר'], ['cyl', 'צילינדר']].forEach(function (p) {
			if (answers[p[0]]) {
				det.push(p[1] + ': ' + labelFor(p[0], answers[p[0]]));
			}
		});
		if (answers.language) {
			det.push('שפה מועדפת: ' + answers.language);
		}
		var msg = first;
		if (det.length) {
			msg += '\nהפרטים שמילאתי במאתר: ' + det.join(' · ') + '.';
		}
		return msg;
	}
	function waUrl(msg) {
		return 'https://api.whatsapp.com/send?phone=' + DATA.waPhone + '&text=' + encodeURIComponent(msg);
	}
	function doctorWaUrl(d) {
		var clinic = answers.location ? centerName(parseInt(answers.location, 10)) : '';
		if (!clinic) {
			var cl = doctorClinics(d);
			clinic = cl.length ? cl[0] : '';
		}
		return waUrl(waMessage(d.name, clinic));
	}

	/* ---- filtering (location + language ONLY) ---- */
	function filterBy(city, lang) {
		var list = DATA.doctors.slice();
		if (city) {
			var cid = parseInt(city, 10);
			list = list.filter(function (d) {
				return (d.centers || []).indexOf(cid) !== -1;
			});
		}
		if (lang) {
			list = list.filter(function (d) {
				return (d.langs || []).indexOf(lang) !== -1;
			});
		}
		return list
			.map(function (d) { return { d: d, r: Math.random() }; })
			.sort(function (a, b) { return a.r - b.r; })
			.map(function (o) { return o.d; });
	}

	/* ---- shell ---- */
	function mount() {
		root.innerHTML =
			'<div class="idf-app">' +
			'<div class="idf-head"><h2>מצאו את הרופא המתאים לכם</h2><p>ענו על כמה שאלות קצרות, ואנחנו נמצא עבורכם את הרופאים המתאימים.</p></div>' +
			'<div class="idf-wizard">' +
			'<div id="idf-question">' +
			'<div class="idf-progress-row"><span class="idf-step-lbl" id="idf-steplbl"></span><button type="button" class="idf-back" id="idf-back" style="visibility:hidden">חזרה ←</button></div>' +
			'<div class="idf-pbar"><span id="idf-pbar" style="width:0%"></span></div>' +
			'<div class="idf-qtitle" id="idf-qtitle"></div>' +
			'<div class="idf-opts" id="idf-opts"></div>' +
			'</div>' +
			'<div class="idf-done" id="idf-done" style="display:none">' +
			'<div class="idf-chk">' + svg('check', 28) + '</div>' +
			'<h3>מצאנו עבורך רופאים מעולים</h3><p>גללו למטה לתוצאות, או שנו את התשובות.</p>' +
			'<button type="button" class="idf-btn idf-btn-secondary" id="idf-edit">שינוי התשובות</button>' +
			'</div>' +
			'</div>' +
			'<div id="idf-results"></div>' +
			'</div>';
		document.getElementById('idf-back').addEventListener('click', function () {
			if (stepIdx > 0) {
				stepIdx--;
				renderStep();
			}
		});
		document.getElementById('idf-edit').addEventListener('click', function () {
			stepIdx = 0;
			renderStep();
			document.getElementById('idf-question').scrollIntoView({ behavior: 'smooth', block: 'center' });
		});
		renderStep();
	}

	function renderStep() {
		document.getElementById('idf-done').style.display = 'none';
		document.getElementById('idf-question').style.display = 'block';
		var seq = sequence();
		var key = seq[stepIdx];
		var step = STEPS[key];
		var opts = optsFor(key);
		document.getElementById('idf-steplbl').textContent = 'שאלה ' + (stepIdx + 1) + ' מתוך ' + seq.length;
		document.getElementById('idf-pbar').style.width = (stepIdx / seq.length) * 100 + '%';
		document.getElementById('idf-back').style.visibility = stepIdx === 0 ? 'hidden' : 'visible';
		document.getElementById('idf-qtitle').textContent = step.q;
		document.getElementById('idf-opts').innerHTML = opts
			.map(function (o) {
				return (
					'<button type="button" class="idf-opt" data-val="' + esc(o.v) + '">' +
					(o.icon ? '<span class="idf-opt-ico">' + svg(o.icon, 22) + '</span>' : '') +
					'<span class="idf-ol">' + esc(o.label) + '</span>' +
					(o.desc ? '<span class="idf-od">' + esc(o.desc) + '</span>' : '') +
					'</button>'
				);
			})
			.join('');
		Array.prototype.forEach.call(document.getElementById('idf-opts').querySelectorAll('.idf-opt'), function (btn) {
			btn.addEventListener('click', function () {
				var k = sequence()[stepIdx];
				answers[k] = btn.getAttribute('data-val');
				var seq2 = sequence();
				if (stepIdx >= seq2.length - 1) {
					finish();
				} else {
					stepIdx++;
					renderStep();
				}
			});
		});
	}

	function finish() {
		document.getElementById('idf-question').style.display = 'none';
		document.getElementById('idf-done').style.display = 'block';
		document.getElementById('idf-pbar').style.width = '100%';
		renderResults();
		var r = document.getElementById('idf-results');
		if (r && r.scrollIntoView) {
			r.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	/* ---- cards + results ---- */
	function card(d) {
		var clinics = doctorClinics(d);
		var avatar = d.thumb
			? '<span class="idf-avatar"><img src="' + esc(d.thumb) + '" alt="' + esc(d.name) + '" loading="lazy"></span>'
			: '<span class="idf-avatar">' + esc(initials(d.name)) + '</span>';
		var langChips = (d.langs || [])
			.map(function (l) { return '<span class="idf-lchip">' + esc(l) + '</span>'; })
			.join('');
		var clinicHtml = clinics.length
			? '<div class="idf-clinic">' + svg('pin', 15) + '<span>' + esc(clinics.join(' · ')) + '</span></div>'
			: '';
		var langHtml = langChips
			? '<div class="idf-row"><div class="idf-row-lbl">שפות</div><div class="idf-mini-chips">' + langChips + '</div></div>'
			: '';
		var descHtml = d.desc ? '<div class="idf-desc">' + esc(d.desc) + '</div>' : '';
		return (
			'<article class="idf-card">' +
			'<div class="idf-card-top">' + avatar +
			'<div><div class="idf-name">' + esc(d.name) + '</div>' +
			(d.sub ? '<div class="idf-sub">' + esc(d.sub) + '</div>' : '') + '</div></div>' +
			clinicHtml + langHtml + descHtml +
			'<div class="idf-cta">' +
			'<a class="idf-btn idf-btn-primary" href="' + doctorWaUrl(d) + '" target="_blank" rel="noopener">' + WA_SVG + ' תיאום בדיקת התאמה</a>' +
			'<a class="idf-btn idf-btn-secondary" href="' + esc(d.url) + '">לעמוד הרופא</a>' +
			'</div></article>'
		);
	}

	function renderResults() {
		var box = document.getElementById('idf-results');
		if (!box) {
			return;
		}
		var cityName = answers.location ? centerName(parseInt(answers.location, 10)) : '';
		var lang = answers.language;
		var list = filterBy(answers.location, lang);
		var relaxedLang = false;
		if (!list.length && lang) {
			var alt = filterBy(answers.location, '');
			if (alt.length) {
				list = alt;
				relaxedLang = true;
			}
		}
		var unsure = answers.goal === 'not_sure';
		var cityTxt = cityName ? ' ב' + cityName : '';

		var notsure = unsure
			? '<div class="idf-notsure"><h3>עוד לא בטוחים? זה בסדר גמור.</h3>' +
			'<p>בדיקת התאמה היא הדרך הבטוחה לדעת בדיוק מה מתאים לכם, ללא התחייבות. בינתיים ריכזנו עבורכם את הרופאים הרלוונטיים.</p>' +
			'<a class="idf-btn idf-btn-white" href="' + waUrl(waMessage('', cityName)) + '" target="_blank" rel="noopener">תיאום בדיקת התאמה</a></div>'
			: '';

		if (!list.length) {
			box.innerHTML =
				notsure +
				'<div class="idf-results"><div class="idf-empty">לא נמצאו רופאים מתאימים בסניף הזה. נסו לבחור סניף אחר דרך "שינוי התשובות".</div></div>';
			return;
		}

		var langNote = relaxedLang
			? '<div class="idf-empty" style="margin-bottom:18px">לא נמצאו רופאים שדוברים ' + esc(lang) + ' ב' + esc(cityName) + '. הנה הרופאים ב' + esc(cityName) + ':</div>'
			: '';

		box.innerHTML =
			notsure +
			'<div class="idf-results">' +
			langNote +
			'<div class="idf-rhead"><h2>' + (unsure ? 'רופאים רלוונטיים' : 'הרופאים שעשויים להתאים לכם') + esc(cityTxt) + '</h2>' +
			'<div class="idf-count">מציג ' + list.length + ' רופאים</div></div>' +
			'<div class="idf-grid">' + list.map(card).join('') + '</div>' +
			'<div class="idf-disclaimer">' + svg('info', 18) + '<span>המידע כאן עוזר לכם למצוא רופא. ההחלטה על התאמה לטיפול ועל השיטה המתאימה נעשית בבדיקת התאמה אצל הרופא.</span></div>' +
			'</div>';
	}

	mount();
})();
