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

= 1.1.0 =
* feat: stepped wizard (goal, age, glasses/contacts, prescription, cylinder, location, language) for a personalized feel.
* Only location + language filter the results; the other answers are appended to the WhatsApp exam message so the clinic gets full context.
* Lucide-style line-icon option cards, progress bar, "not sure" path.

= 1.0.0 =
* Initial release: [doctor_finder] shortcode; clinic + language filters; branded RTL doctor cards; WhatsApp suitability-exam CTA; no-JS fallback doctor list.
