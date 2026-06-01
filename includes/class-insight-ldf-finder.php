<?php
/**
 * Shortcode + asset wiring for the doctor finder.
 *
 * @package Insight_Levinger_Doctor_Finder
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers the [doctor_finder] shortcode and front-end assets.
 */
class Insight_LDF_Finder {

	const HANDLE = 'insight-ldf';

	/**
	 * Hook everything up.
	 */
	public static function init() {
		add_shortcode( 'doctor_finder', array( __CLASS__, 'render' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'register_assets' ) );
		add_action( 'save_post_doctor', array( 'Insight_LDF_Query', 'clear_cache' ) );
		add_action( 'save_post_medical-center', array( 'Insight_LDF_Query', 'clear_cache' ) );
	}

	/**
	 * Register (not enqueue) the assets so the shortcode can enqueue on demand.
	 */
	public static function register_assets() {
		$ver = INSIGHT_LEVINGER_DOCTOR_FINDER_VERSION;
		wp_register_style( self::HANDLE, INSIGHT_LEVINGER_DOCTOR_FINDER_URL . 'assets/css/finder.css', array(), $ver );
		wp_register_script( self::HANDLE, INSIGHT_LEVINGER_DOCTOR_FINDER_URL . 'assets/js/finder.js', array(), $ver, true );
	}

	/**
	 * Render the [doctor_finder] shortcode.
	 *
	 * @param array $atts Shortcode attributes (reserved for future use).
	 * @return string
	 */
	public static function render( $atts = array() ) {
		unset( $atts );

		if ( ! function_exists( 'get_field' ) ) {
			return '';
		}

		$data = Insight_LDF_Query::get_data();

		wp_enqueue_style( self::HANDLE );
		wp_enqueue_script( self::HANDLE );
		wp_localize_script(
			self::HANDLE,
			'INSIGHT_LDF',
			array(
				'doctors'   => $data['doctors'],
				'locations' => $data['locations'],
				'languages' => $data['languages'],
				'waPhone'   => '972545622619',
			)
		);

		ob_start();
		?>
		<div id="insight-doctor-finder" class="idf-root" dir="rtl">
			<div class="idf-fallback">
				<h3 class="idf-fb-title"><?php esc_html_e( 'רופאים להסרת משקפיים בלייזר', 'insight-levinger-doctor-finder' ); ?></h3>
				<ul class="idf-fb-list">
					<?php foreach ( $data['doctors'] as $doc ) : ?>
						<li>
							<a href="<?php echo esc_url( $doc['url'] ); ?>"><?php echo esc_html( $doc['name'] ); ?></a>
							<?php if ( ! empty( $doc['sub'] ) ) : ?>
								<span> — <?php echo esc_html( $doc['sub'] ); ?></span>
							<?php endif; ?>
						</li>
					<?php endforeach; ?>
				</ul>
			</div>
		</div>
		<?php
		return ob_get_clean();
	}
}
