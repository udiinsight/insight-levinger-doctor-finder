=== Insight - Levinger - Doctor Finder ===
Contributors: insightmarketing
Tags: doctors, finder, acf, rtl, ophthalmology
Requires at least: 6.0
Tested up to: 6.9
Requires PHP: 8.0
Stable tag: 1.0.0
License: Proprietary
License URI: https://insight-marketing.co.il

Guided finder for Dr. Levinger laser glasses-removal surgeons. Filters by clinic and language and renders branded doctor cards.

== Description ==

Adds a `[doctor_finder]` shortcode that lets a visitor find the right eye surgeon for laser glasses removal by choosing a clinic and a preferred language. Results are doctor cards only — no diagnosis, no treatment recommendation. Each card links to the doctor's page and offers a WhatsApp message to the central line to book a suitability exam (בדיקת התאמה).

Data source (read-only):
* Doctors: `doctor` CPT, filtered to those whose ACF relationship field `related_proc` includes the laser glasses-removal procedure (post ID 8099, Hebrew).
* Clinics: ACF relationship field `related_medical_center`.
* Languages: ACF checkbox field `lang`.
* Card text: post title, `sub_title`, and `the_short_description`.

Built to the Dr. Levinger Design System (blue #104DA8, FB Reforma, RTL).

== Installation ==

1. Install via WP Pusher from the GitHub repository `udiinsight/insight-levinger-doctor-finder` (branch `main`).
2. Activate the plugin. Requires Advanced Custom Fields (ACF) and the `doctor` / `medical-center` CPTs.
3. Add the shortcode `[doctor_finder]` to any page or Bricks code element.

== Changelog ==

= 1.1.6 =
* fix: bake asset version into the URL as ?v= (WP Rocket strips ?ver= on this host). This finally lets CSS/JS updates reach browsers — header, no-all, and language-fallback changes now render.

= 1.1.5 =
* fix: asset cache-busting now uses file mtime, so CSS/JS changes always load (previously the version constant lagged the header, freezing the ?ver). This makes the 1.1.3/1.1.4 front-end changes actually load in browsers.

= 1.1.4 =
* Header: centered, with an eyebrow tag ("התאמת רופא אישית" + sparkle icon); heading is now an <h1> sized with var(--font-h2).

= 1.1.3 =
* Clinic labels are now city names only: ירושלים, תל אביב, באר שבע, חיפה (fixed order).
* Removed the "all branches" option — a clinic must be chosen.
* If no doctor at the chosen clinic speaks the selected language, the finder says so and shows that clinic's doctors without the language filter.

= 1.1.2 =
* Clean, short clinic labels in the location filter and on cards: ירושלים, תל אביב - עזריאלי, באר שבע, חיפה חוצות המפרץ.

= 1.1.1 =
* fix: WP Rocket compatibility — exclude finder assets from JS delay/minify and CSS minify so the wizard hydrates immediately (no "click to load").

= 1.1.0 =
* feat: stepped wizard (goal, age, glasses/contacts, prescription, cylinder, location, language) for a personalized feel.
* Only location + language filter the results; the other answers are appended to the WhatsApp exam message so the clinic gets full context.
* Lucide-style line-icon option cards, progress bar, "not sure" path.

= 1.0.0 =
* Initial release: [doctor_finder] shortcode; clinic + language filters; branded RTL doctor cards; WhatsApp suitability-exam CTA; no-JS fallback doctor list.
