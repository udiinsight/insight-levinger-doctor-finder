<?php
/**
 * Builds the laser glasses-removal doctor dataset from ACF fields.
 *
 * @package Insight_Levinger_Doctor_Finder
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Query + shape doctors who perform laser glasses removal.
 */
class Insight_LDF_Query {

	/**
	 * Hebrew "laser glasses removal" procedure post ID. Doctors relate to it via
	 * the bi-directional ACF relationship field `related_proc`.
	 */
	const PROC_ID = 8099;

	/**
	 * Medical centers that actually perform laser glasses removal, per the
	 * Dr. Levinger location–procedure matrix (system-prompts/he.md). Only these are
	 * offered as locations so the finder never implies laser at a branch that does
	 * not perform it. Laser doctors also practice at other (cataract) centers; those
	 * are intentionally excluded here. Filterable via `insight_ldf_laser_center_ids`.
	 *   Display order: 211 Jerusalem · 214 Tel Aviv · 208 Beersheba · 212 Haifa
	 */
	const LASER_CENTER_IDS = array( 211, 214, 208, 212 );

	/**
	 * Transient cache key (bump suffix when the data shape changes).
	 */
	const CACHE_KEY = 'insight_ldf_data_v1';

	/**
	 * Return the cached dataset, building it on a miss.
	 *
	 * @return array{doctors:array,locations:array,languages:array}
	 */
	public static function get_data() {
		$cached = get_transient( self::CACHE_KEY );
		if ( is_array( $cached ) && isset( $cached['doctors'] ) ) {
			return $cached;
		}
		$data = self::build();
		set_transient( self::CACHE_KEY, $data, 6 * HOUR_IN_SECONDS );
		return $data;
	}

	/**
	 * Clear the cache (hooked to doctor / medical-center saves).
	 */
	public static function clear_cache() {
		delete_transient( self::CACHE_KEY );
	}

	/**
	 * Procedure ID, filterable for reuse on other procedures.
	 *
	 * @return int
	 */
	public static function proc_id() {
		return (int) apply_filters( 'insight_ldf_procedure_id', self::PROC_ID );
	}

	/**
	 * Laser-eligible medical-center IDs (the only ones offered as locations).
	 *
	 * @return int[]
	 */
	public static function laser_center_ids() {
		return array_map( 'intval', (array) apply_filters( 'insight_ldf_laser_center_ids', self::LASER_CENTER_IDS ) );
	}

	/**
	 * Clean, short display label for a center (chips + card clinic line). Falls back to
	 * the post title for any center not in the map. Filterable.
	 *
	 * @param int    $cid      Center post ID.
	 * @param string $fallback Decoded post title.
	 * @return string
	 */
	public static function center_label( $cid, $fallback ) {
		$labels = apply_filters(
			'insight_ldf_center_labels',
			array(
				211 => 'ירושלים',
				214 => 'תל אביב',
				208 => 'באר שבע',
				212 => 'חיפה',
			)
		);
		return isset( $labels[ $cid ] ) ? (string) $labels[ $cid ] : $fallback;
	}

	/**
	 * Build the dataset from the doctor CPT.
	 *
	 * @return array{doctors:array,locations:array,languages:array}
	 */
	private static function build() {
		$empty = array(
			'doctors'   => array(),
			'locations' => array(),
			'languages' => array(),
		);

		if ( ! function_exists( 'get_field' ) ) {
			return $empty;
		}

		$args = array(
			'post_type'      => 'doctor',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'no_found_rows'  => true,
			'orderby'        => 'title',
			'order'          => 'ASC',
			'meta_query'     => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				array(
					'key'     => 'related_proc',
					'value'   => '"' . self::proc_id() . '"',
					'compare' => 'LIKE',
				),
			),
		);

		// The finder is Hebrew-only; force the Hebrew language set when Polylang is active.
		if ( function_exists( 'pll_default_language' ) ) {
			$args['lang'] = 'he';
		}

		$query     = new WP_Query( $args );
		$doctors   = array();
		$centers   = array();
		$langs_set = array();
		$allow     = self::laser_center_ids();

		foreach ( $query->posts as $post ) {
			$id = (int) $post->ID;

			$sub  = (string) get_field( 'sub_title', $id );
			$desc = trim( wp_strip_all_tags( (string) get_field( 'the_short_description', $id ) ) );
			if ( function_exists( 'mb_strlen' ) && mb_strlen( $desc ) > 170 ) {
				$desc = mb_substr( $desc, 0, 168 ) . '…';
			}

			$lang_raw = get_field( 'lang', $id );
			$langs    = is_array( $lang_raw ) ? array_values( array_filter( array_map( 'strval', $lang_raw ) ) ) : array();
			foreach ( $langs as $lang ) {
				$langs_set[ $lang ] = true;
			}

			$doc_centers = array();
			$rc          = get_field( 'related_medical_center', $id );
			if ( is_array( $rc ) ) {
				foreach ( $rc as $center ) {
					$cid = is_object( $center ) ? (int) $center->ID : (int) $center;
					if ( ! $cid || ! in_array( $cid, $allow, true ) ) {
						continue; // Only laser-eligible branches (see LASER_CENTER_IDS).
					}
					$doc_centers[]   = $cid;
					$centers[ $cid ] = self::center_label( $cid, html_entity_decode( wp_strip_all_tags( get_the_title( $cid ) ), ENT_QUOTES, 'UTF-8' ) );
				}
			}

			$thumb = get_the_post_thumbnail_url( $id, 'medium' );

			$doctors[] = array(
				'id'      => $id,
				'name'    => html_entity_decode( wp_strip_all_tags( get_the_title( $id ) ), ENT_QUOTES, 'UTF-8' ),
				'sub'     => html_entity_decode( $sub, ENT_QUOTES, 'UTF-8' ),
				'desc'    => html_entity_decode( $desc, ENT_QUOTES, 'UTF-8' ),
				'langs'   => $langs,
				'centers' => array_values( array_unique( $doc_centers ) ),
				'url'     => get_permalink( $id ),
				'thumb'   => $thumb ? $thumb : '',
			);
		}

		// Location options — in the canonical laser-center order (LASER_CENTER_IDS),
		// including only centers that actually have laser doctors.
		$locations = array();
		foreach ( self::laser_center_ids() as $cid ) {
			if ( isset( $centers[ $cid ] ) ) {
				$locations[] = array(
					'id'   => (int) $cid,
					'name' => $centers[ $cid ],
				);
			}
		}

		// Language options — preferred order first, then any extras present.
		$order     = array( 'עברית', 'אנגלית', 'רוסית', 'ערבית', 'צרפתית', 'ספרדית', 'רומנית', 'איטלקית', 'גרמנית' );
		$languages = array();
		foreach ( $order as $lang ) {
			if ( isset( $langs_set[ $lang ] ) ) {
				$languages[] = $lang;
				unset( $langs_set[ $lang ] );
			}
		}
		foreach ( array_keys( $langs_set ) as $lang ) {
			$languages[] = $lang;
		}

		return array(
			'doctors'   => $doctors,
			'locations' => $locations,
			'languages' => $languages,
		);
	}
}
