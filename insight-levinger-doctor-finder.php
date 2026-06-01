<?php
/**
 * Plugin Name: Insight - Levinger - Doctor Finder
 * Plugin URI: https://github.com/udiinsight/insight-levinger-doctor-finder
 * Description: Guided finder for Dr. Levinger laser glasses-removal surgeons. Filters by clinic and language and renders branded doctor cards via the [doctor_finder] shortcode.
 * Version: 1.1.0
 * Author: Insight Marketing
 * Author URI: https://insight-marketing.co.il
 * Text Domain: insight-levinger-doctor-finder
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 8.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'INSIGHT_LEVINGER_DOCTOR_FINDER_VERSION', '1.1.0' );
define( 'INSIGHT_LEVINGER_DOCTOR_FINDER_PATH', plugin_dir_path( __FILE__ ) );
define( 'INSIGHT_LEVINGER_DOCTOR_FINDER_URL', plugin_dir_url( __FILE__ ) );

/**
 * Load text domain for translations (Hebrew RTL support).
 */
add_action(
	'plugins_loaded',
	function () {
		load_plugin_textdomain( 'insight-levinger-doctor-finder', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
	}
);

require_once INSIGHT_LEVINGER_DOCTOR_FINDER_PATH . 'includes/class-insight-ldf-query.php';
require_once INSIGHT_LEVINGER_DOCTOR_FINDER_PATH . 'includes/class-insight-ldf-finder.php';

/**
 * Warn admins if ACF is missing — the finder reads ACF relationship/checkbox fields.
 */
add_action(
	'admin_notices',
	function () {
		if ( function_exists( 'get_field' ) ) {
			return;
		}
		if ( ! current_user_can( 'activate_plugins' ) ) {
			return;
		}
		echo '<div class="notice notice-warning"><p>';
		echo esc_html__( 'Insight Doctor Finder requires Advanced Custom Fields (ACF) to be active.', 'insight-levinger-doctor-finder' );
		echo '</p></div>';
	}
);

Insight_LDF_Finder::init();
