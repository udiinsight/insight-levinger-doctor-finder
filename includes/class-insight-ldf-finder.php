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

		// Keep WP Rocket (and similar optimizers) from delaying/minifying our bundle,
		// which otherwise leaves the finder un-hydrated until first interaction.
		add_filter( 'script_loader_tag', array( __CLASS__, 'untouchable_script' ), 10, 2 );
		add_filter( 'style_loader_tag', array( __CLASS__, 'untouchable_style' ), 10, 2 );
		add_filter( 'rocket_excluded_inline_js_content', array( __CLASS__, 'rocket_inline_exclusions' ) );
		add_filter( 'rocket_minify_excluded_external_js', array( __CLASS__, 'rocket_minify_js_exclusions' ) );
		add_filter( 'rocket_exclude_css', array( __CLASS__, 'rocket_css_exclusions' ) );
		add_filter( 'rocket_delay_js_exclusions', array( __CLASS__, 'rocket_delay_js_exclusions' ) );
	}

	/**
	 * Add no-minify / no-defer / no-delay attributes to our external script tag.
	 *
	 * @param string $tag    Script tag HTML.
	 * @param string $handle Script handle.
	 * @return string
	 */
	public static function untouchable_script( $tag, $handle ) {
		if ( self::HANDLE !== $handle ) {
			return $tag;
		}
		$attrs = ' data-no-minify="1" data-no-defer="1" data-no-optimize="1" data-cfasync="false" data-wpmeteor-nooptimize="true"';
		return (string) preg_replace_callback(
			'/<script\b([^>]*)>/i',
			function ( $m ) use ( $attrs ) {
				if ( false === strpos( $m[1], 'src=' ) ) {
					return $m[0];
				}
				return '<script' . $attrs . $m[1] . '>';
			},
			$tag
		);
	}

	/**
	 * Same for our stylesheet link.
	 *
	 * @param string $tag    Link tag HTML.
	 * @param string $handle Style handle.
	 * @return string
	 */
	public static function untouchable_style( $tag, $handle ) {
		if ( self::HANDLE !== $handle ) {
			return $tag;
		}
		$attrs = ' data-no-minify="1" data-no-optimize="1" data-cfasync="false"';
		return (string) preg_replace_callback(
			'/<link\b([^>]*)>/i',
			function ( $m ) use ( $attrs ) {
				if ( false === strpos( $m[1], 'href=' ) ) {
					return $m[0];
				}
				return '<link' . $attrs . $m[1] . '>';
			},
			$tag
		);
	}

	/**
	 * Exclude our localized inline data from Rocket inline-JS optimization.
	 *
	 * @param array $excluded Patterns.
	 * @return array
	 */
	public static function rocket_inline_exclusions( $excluded ) {
		$excluded   = is_array( $excluded ) ? $excluded : array();
		$excluded[] = 'INSIGHT_LDF';
		return $excluded;
	}

	/**
	 * Exclude finder.js from Rocket JS minify/combine.
	 *
	 * @param array $excluded Patterns.
	 * @return array
	 */
	public static function rocket_minify_js_exclusions( $excluded ) {
		$excluded   = is_array( $excluded ) ? $excluded : array();
		$excluded[] = 'insight-levinger-doctor-finder/assets/js/finder.js';
		return $excluded;
	}

	/**
	 * Exclude finder.css from Rocket CSS minify/combine (protects @font-face URLs).
	 *
	 * @param array $excluded Patterns.
	 * @return array
	 */
	public static function rocket_css_exclusions( $excluded ) {
		$excluded   = is_array( $excluded ) ? $excluded : array();
		$excluded[] = 'insight-levinger-doctor-finder/assets/css/finder.css';
		return $excluded;
	}

	/**
	 * Exclude finder.js + our inline data from Rocket "Delay JavaScript Execution".
	 *
	 * @param array $excluded Patterns.
	 * @return array
	 */
	public static function rocket_delay_js_exclusions( $excluded ) {
		$excluded   = is_array( $excluded ) ? $excluded : array();
		$excluded[] = 'insight-levinger-doctor-finder/assets/js/finder.js';
		$excluded[] = 'INSIGHT_LDF';
		return $excluded;
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
