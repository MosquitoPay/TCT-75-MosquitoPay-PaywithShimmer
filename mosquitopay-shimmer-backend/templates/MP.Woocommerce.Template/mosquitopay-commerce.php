<?php
/*
Plugin Name:  MosquitoPAY Commerce
Plugin URI:   ""
Description:  A payment gateway that allows your customers to pay with Shimmer tokens via MosquitoPAY (https://mosquitopay.io/).Alpha version.
Version:      0.0.1-alpha
Author:       Mosquitopay Commerce Team
Author URI:   https://mosquitopay.io/
License:      GPLv3+
License URI:  https://www.gnu.org/licenses/gpl-3.0.html
Text Domain:  mosquitopay
Domain Path:  /languages

WC requires at least: 3.0.9
WC tested up to: 6.5.1

MosquitoPAY Commerce is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
any later version.

MosquitoPAY Commerce is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with MosquitoPAY WooCommerce. If not, see https://www.gnu.org/licenses/gpl-3.0.html.
*/

function mp_init_gateway()
{
	// If WooCommerce is available, initialise WC parts.

	/** DOCBLOCK - Makes linter happy.
	 * 
	 * @since today
	 */
	//add_filter( string $hook_name, callable $callback, int $priority = 10, int $accepted_args = 1)
	if (in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins')))) {
		require_once 'class-wc-gateway-mosquitopay.php';
		/* add_action( 'init', 'mp_wc_register_blockchain_status' );
			  add_filter( 'woocommerce_valid_order_statuses_for_payment', 'mp_wc_status_valid_for_payment', 10, 2 ); */
		add_action('mp_check_orders', 'mp_wc_check_orders');
		add_filter('woocommerce_payment_gateways', 'mp_wc_add_mosquitopay_class');
		/* add_filter( 'wc_order_statuses', 'mp_wc_add_status' ); */
		add_action('woocommerce_admin_order_data_after_order_details', 'mp_order_meta_general');
		add_action('woocommerce_order_details_after_order_table', 'mp_order_meta_general');
		/* add_filter( 'woocommerce_email_order_meta_fields', 'mp_custom_woocommerce_email_order_meta_fields', 10, 3 ); */
		add_filter('woocommerce_email_actions', 'mp_register_email_action');
		add_action('woocommerce_email', 'mp_add_email_triggers');
	}
}
add_action('plugins_loaded', 'mp_init_gateway');

if (!function_exists('write_log')) {

	function write_log($log)
	{
		if (true === WP_DEBUG) {
			if (is_array($log) || is_object($log)) {
				error_log(print_r($log, true));
			} else {
				error_log($log);
			}
		}
	}

}

//write_log('THIS IS THE START OF MY CUSTOM DEBUG');
//i can log data like objects


// Setup cron job.

function mp_activation()
{
	if (!wp_next_scheduled('mp_check_orders')) {
		wp_schedule_event(time(), 'hourly', 'mp_check_orders');
	}
}
register_activation_hook(__FILE__, 'mp_activation');

function mp_deactivation()
{
	wp_clear_scheduled_hook('mp_check_orders');
}
register_deactivation_hook(__FILE__, 'mp_deactivation');


// WooCommerce

function mp_wc_add_mosquitopay_class($methods)
{
	$methods[] = 'WC_Gateway_Mosquitopay';
	return $methods;
}

function mp_wc_check_orders()
{
	$gateway = WC()->payment_gateways()->payment_gateways()['mosquitopay'];
	return $gateway->check_orders();
}

/* 
function mp_wc_register_blockchain_status() {
	register_post_status( 'wc-blockchainpending', array(
		'label'                     => __( 'Blockchain Pending', 'mosquitopay' ),
		'public'                    => true,
		'show_in_admin_status_list' => true,
		/* translators: WooCommerce order count in blockchain pending. 
		'label_count'               => _n_noop( 'Blockchain pending <span class="count">(%s)</span>', 'Blockchain pending <span class="count">(%s)</span>' ),
	) );
}


function mp_wc_status_valid_for_payment( $statuses, $order ) {
	$statuses[] = 'wc-blockchainpending';
	return $statuses;
}


function mp_wc_add_status( $wc_statuses_arr ) {
	$new_statuses_arr = array();

	// Add new order status after payment pending.
	foreach ( $wc_statuses_arr as $id => $label ) {
		$new_statuses_arr[ $id ] = $label;

		if ( 'wc-pending' === $id ) {  // after "Payment Pending" status.
			$new_statuses_arr['wc-blockchainpending'] = __( 'Blockchain Pending', 'mosquitopay' );
		}
	}

	return $new_statuses_arr;
}
 */

/**
 * Add order Mosquitopay meta after General and before Billing
 *
 * @see: https://rudrastyh.com/woocommerce/customize-order-details.html
 *
 * @param WC_Order $order WC order instance
 */
function mp_order_meta_general($order)
{
	if ($order->get_payment_method() == 'mosquitopay') {
		?>

		<br class="clear" />
		<h3>Mosquitopay Commerce Data</h3>
		<div class="">
			<p>Mosquitopay Commerce Reference #
				<?php echo esc_html($order->get_meta('_mosquitopay_charge_id')); ?>
			</p>
		</div>

		<?php
	}
}


/*
 * Add Mosquitopay meta to WC emails
 *
 * @see https://docs.woocommerce.com/document/add-a-custom-field-in-an-order-to-the-emails/
 *
 * @param array    $fields indexed list of existing additional fields.
 * @param bool     $sent_to_admin If should sent to admin.
 * @param WC_Order $order WC order instance
 *
 */
/* function mp_custom_woocommerce_email_order_meta_fields( $fields, $sent_to_admin, $order ) {
	if ($order->get_payment_method() == 'mosquitopay') {
		$fields['mosquitopay_commerce_reference'] = array(
			'label' => __( 'Mosquitopay Commerce Reference #' ),
			'value' => $order->get_meta( '_mosquitopay_charge_id' ),
		);
	}

	return $fields;
} */


/**
 * Registers "woocommerce_order_status_pending_to_processing" as a WooCommerce email action.
 *
 * @param array $email_actions
 *
 * @return array
 */
function mp_register_email_action($email_actions)
{
	$email_actions[] = 'woocommerce_order_status_pending_to_processing';

	return $email_actions;
}


/**
 * Adds new triggers for emails sent when the order status transitions to Processing.
 *
 * @param WC_Emails $wc_emails
 */
function mp_add_email_triggers($wc_emails)
{

	$emails = $wc_emails->get_emails();

	/**
	 * A list of WooCommerce emails sent when the order status transitions to Processing.
	 *
	 * Developers can use the `mp_processing_order_emails` filter to add in their own emails.
	 *
	 * @param array $emails List of email class names.
	 *
	 * @return array
	 * 
	 * @since today
	 */
	$processing_order_emails = apply_filters('mp_processing_order_emails', [
		'WC_Email_New_Order',
		'WC_Email_Customer_Processing_Order',
	]);

	foreach ($processing_order_emails as $email_class) {
		if (isset($emails[$email_class])) {
			$email = $emails[$email_class];

			add_action(
				'woocommerce_order_status_pending_to_processing_notification',
				array($email, 'trigger')
			);
		}
	}
}
