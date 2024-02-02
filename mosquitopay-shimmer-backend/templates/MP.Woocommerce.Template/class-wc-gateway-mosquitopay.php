<?php // phpcs:disable
/**
 * Mosquitopay Commerce Payment Gateway.
 *
 * Provides a Mosquitopay Commerce Payment Gateway.
 *
 * @class       WC_Gateway_Mosquitopay
 * @extends     WC_Payment_Gateway
 * @since       0.0.1
 * @package     WooCommerce/Classes/Payment
 */

if (!defined('ABSPATH')) {
	exit;
}

/**
 * WC_Gateway_Mosquitopay Class.
 */
class WC_Gateway_Mosquitopay extends WC_Payment_Gateway
{

	/**
	 * Log_enabled - whether or not logging is enabled
	 * 
	 * @var bool	Whether or not logging is enabled 
	 */
	public static $log_enabled = false;

	/** 
	 * WC_Logger Logger instance
	 * 
	 * @var WC_Logger Logger instance
	 * */
	public static $log = false;

	/**
	 * Constructor for the gateway.
	 */
	public function __construct()
	{
		$this->id = 'mosquitopay';
		$this->icon = apply_filters('woocommerce_mosquitopay_icon', plugins_url('/assets/logo/mpay_logo.png'), __FILE__);
		$this->has_fields = false;
		$this->order_button_text = __('Proceed to Mosquitopay', 'Mosquitopay');
		$this->method_title = __('Mosquitopay ', 'Pay with Shimmer');
		$this->method_description = '<p>' .
			// translators: Introduction text at top of Mosquitopay Commerce settings page.
			__('A payment gateway that sends your customers to Mosquitopay Commerce to pay with shimmer.', 'mosquitopay')
			. '</p><p>' .
			sprintf(
				// translators: Introduction text at top of Mosquitopay Commerce settings page. Includes external URL.
				__('If you do not currently have a Mosquitopay Commerce account, you can set one up here: %s', 'mosquitopay'),
				'<a target="_blank" href="https://mosquitopay.io/">https://mosquitopay.io/</a>'
			);

		// Timeout after 3 days. Default to 3 days as pending IOTA tokens
		// are usually forgotten after 1 days.
		$this->timeout = (new WC_DateTime())->sub(new DateInterval('P1D'));

		// Load the settings.
		$this->init_form_fields();
		$this->init_settings();



		// Define user set variables.
		$this->title = "Pay with Shimmer - Powered by Mosquito Pay";
		// $this->description = $this->get_option('description');
		$this->description = sprintf(__('Use the desktop versions of Shimmer wallet and enable deep links to pay with Shimmer tokens. This payment gateway is offered within this event until 31st January 2024. Every purchaser is allowed to pay only once with crypto money.', 'mosquitopay'));
		$this->debug = 'yes' === $this->get_option('debug', 'no');

		self::$log_enabled = $this->debug;

		add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));
		add_filter('woocommerce_order_data_store_cpt_get_orders_query', array($this, '_custom_query_var'), 10, 2);
		// add_filter('woocommerce_gateway_description', array($this, 'mosquitopay_description_fields_update'), 10, 2);
		//This part hadles webhook request and http adress is https://test1.local/?wc-api=WC_Gateway_Mosquitopay
		add_action('woocommerce_api_wc_gateway_mosquitopay', array($this, 'handle_webhook'));
	}

	/**
	 * Logging method.
	 *
	 * @param string $message Log message.
	 * @param string $level   Optional. Default 'info'.
	 *     emergency|alert|critical|error|warning|notice|info|debug
	 */
	public static function log($message, $level = 'info')
	{
		if (self::$log_enabled) {
			if (empty(self::$log)) {
				self::$log = wc_get_logger();
			}
			self::$log->log($level, $message, array('source' => 'mosquitopay'));
		}
	}

	/**
	 * Get gateway icon.
	 * 
	 * @return string
	 */
	public function get_icon()
	{
		if ($this->get_option('show_icons') === 'no') {
			return '';
		}

		$image_path = plugin_dir_path(__FILE__) . 'assets/images';
		$icon_html = '';
		$methods = get_option('mosquitopay_payment_methods', array('shimmer'));

		// Load icon for each available payment method.
		foreach ($methods as $m) {
			$path = realpath($image_path . '/' . $m . '.png');
			if ($path && dirname($path) === $image_path && is_file($path)) {
				$url = WC_HTTPS::force_https_url(plugins_url('/assets/images/' . $m . '.png', __FILE__));
				$icon_html .= '<img width="26" src="' . esc_attr($url) . '" alt="' . esc_attr__($m, 'mosquitopay') . '" />';
			}
		}

		/** DOCBLOCK - Makes linter happy.
		 *  
		 * @since today
		 */
		return apply_filters('woocommerce_gateway_icon', $icon_html, $this->id);
	}



	/**
	 * Initialise Gateway Settings Form Fields.
	 */
	public function init_form_fields()
	{
		$this->form_fields = array(
			'enabled' => array(
				'title' => __('Enable/Disable', 'woocommerce'),
				'type' => 'checkbox',
				'label' => __('Enable Mosquitopay Commerce Payment', 'mosquitopay'),
				'default' => 'yes',
			),
			// 'title' => array(
			// 	'title' => __('Title', 'woocommerce'),
			// 	'type' => 'text',
			// 	'description' => __('This controls the title which the user sees during checkout.', 'woocommerce'),
			// 	'default' => __('mosquitopay', 'mosquitopay'),
			// 	'desc_tip' => true,
			// ),
			// 'description' => array(
			// 	'title' => __('Description', 'woocommerce'),
			// 	'type' => 'text',
			// 	'desc_tip' => true,
			// 	'description' => __('This controls the description which the user sees during checkout.', 'woocommerce'),
			// 	'default' => __('Pay with IOTA tokens (Save %5).', 'mosquitopay'),
			// ),
			'api_key' => array(
				'title' => __('API Key', 'mosquitopay'),
				'type' => 'text',
				'default' => '',
				'description' => sprintf(
					// translators: Description field for API on settings page. Includes external link.
					__(
						'You can manage your API keys within the Mosquitopay My Shops page, available here: %s',
						'mosquitopay'
					),
					esc_url('https://mosquitopay.io')
				),
			),
			'webhook_secret' => array(
				'title' => __('Webhook Shared Secret', 'mosquitopay'),
				'type' => 'text',
				'default' => '',
				'description' =>

					// translators: Instructions for setting up 'webhook shared secrets' on settings page.
					__('Using webhooks allows Mosquitopay to send payment confirmation messages to the website. To fill this out:', 'mosquitopay')

					. '<br /><br />' .

					// translators: Step 1 of the instructions for 'webhook shared secrets' on settings page.
					__('1. In your Mosquitopay My Shops page page, click to the \'Shop Details\' section', 'mosquitopay')

					. '<br />' .

					// translators: Step 2 of the instructions for 'webhook shared secrets' on settings page. Includes webhook URL.
					sprintf(__('2. Click \'Add an endpoint\' and paste the following URL: %s', 'mosquitopay'), add_query_arg('wc-api', 'WC_Gateway_Mosquitopay', home_url('/', 'https')))

					. '<br />' .

					// translators: Step 3 of the instructions for 'webhook shared secrets' on settings page.
					__('3. Make sure to select "Send me all events", to receive all payment updates.', 'mosquitopay')

					. '<br />' .

					// translators: Step 4 of the instructions for 'webhook shared secrets' on settings page.
					__('4. Click "Show shared secret" and paste into the box above.', 'mosquitopay'),

			),
			'show_icons' => array(
				'title' => __('Show icons', 'mosquitopay'),
				'type' => 'checkbox',
				'label' => __('Display currency icons on checkout page.', 'mosquitopay'),
				'default' => 'yes',
			),
			// 'debug' => array(
			// 	'title' => __('Debug log', 'woocommerce'),
			// 	'type' => 'checkbox',
			// 	'label' => __('Enable logging', 'woocommerce'),
			// 	'default' => 'no',
			// 	// translators: Description for 'Debug log' section of settings page.
			// 	'description' => sprintf(__('Log Mosquitopay API events inside %s', 'mosquitopay'), '<code>' . WC_Log_Handler_File::get_log_file_path('mosquitopay') . '</code>'),
			// ),
		);
	}



	/**
	 * Process the payment and return the result.
	 * 
	 * @param  int $order_id
	 * @return array
	 */
	public function process_payment($order_id)
	{
		$order = wc_get_order($order_id);
		$admin_email = get_option('admin_email');

		$administrator = get_user_by('email', $admin_email);

		$addressWC = $order->get_address();
		$country = $order->get_billing_country();
		$state = $order->get_billing_state();
		/* $address2 = $order->get_address_prop(); */

		// Access the state code map in a WooCommerce PHP plugin
		$stateCodeMap = WC()->countries->get_states();

		// Example usage: Convert state code to name
		$stateCode = $state;
		$stateName = isset($stateCodeMap[$country][$stateCode]) ? $stateCodeMap[$country][$stateCode] : 'Unknown';

		// Example usage: Convert country code to name

		$countryName = WC()->countries->countries[$country];

		write_log($countryName);
		write_log($stateName);

		// $address['state']= $stateName;
		// $address['country']= $countryName;

		// write_log($address);


		$adress = $addressWC['address_1'] . ', ' . $addressWC['address_2'] . ', ' . $addressWC['city'] . ', ' . $stateName . ', ' . $countryName . ' ' . $addressWC['postcode'];


		//write_log($order);

		/* write_log($admin_email); */
		/* write_log($order->get_items()); */

		// Create description for charge based on order's products. Ex: 1 x Product1, 2 x Product2
		try {
			$order_items = array_map(function ($item) {
				$price = $item['subtotal'] / $item['quantity'];
				return '{' . 'id: ' . $item['product_id'] . ', ' . 'name: ' . $item['name'] . ', ' . 'price: ' . $price . ', ' . 'quantity:' . $item['quantity'] . '}';
			}, $order->get_items());
			//write_log($order->get_items());
			$cart = implode(', ', $order_items);
		} catch (Exception $e) {
			$cart = null;
		}

		/* 		try {
												$cart_details = array_map(function ($item) {
													return $item['name'];
												}, $order->get_items());
												$cart =  $cart_details;
											} catch (Exception $e) {
												$cart = null;
											} */

		$this->init_api();





		/* 		write_log($address2);
											write_log(gettype($address2)); */


		// Create a new charge.
		$metadata = array(
			'order_id' => $order->get_id(),
			'order_key' => $order->get_order_key(),
			'source' => 'woocommerce',
			'customer_id' => $order->get_customer_id(),
			// Or $order->get_user_id()
			'mosquitopay_status' => 'waiting',
			/* 'admin_email' => $wp_options_>get_option('admin_email'), */
			'admin_email' => $admin_email,
			'admin_fistname' => $administrator->first_name,
			'admin_lastname' => $administrator->last_name,

			'billing_first_name' => $order->get_billing_first_name(),
			'billing_last_name' => $order->get_billing_last_name(),
			'billing_company' => $order->get_billing_company(),
			'billing_address' => $adress,
			'cart' => $cart,



			// Get the Customer billing email address
			'billing_email' => $order->get_billing_email(),

			// Get the Customer billing phone
			'billing_phone' => $order->get_billing_phone()
		);

		$result = Mosquitopay_API_Handler::create_charge(
			$order->get_total(),
			get_woocommerce_currency(),
			$metadata,
			$this->get_return_url($order),
			null,
			$this->get_cancel_url($order)
		);
		/* write_log($result); */

		if (!$result[0]) {
			return array('result' => 'fail');
		}
		/* write_log($result[0]['result']);
											write_log($result[0]['redirect_url']); */

		/* $charge = $result[1]['data']; */

		/* $order->update_meta_data('_mosquitopay_charge_id', $charge['code']);
											$order->save(); */

		/* wp_redirect( 'https://mosquitopay.io/'); */
		/* $respons = $result[0]['result'];
											$redirect = $result[0]['redirect_url']; */
		//write_log($result);

		/* Return url must be MosquitoPAY payment website 
											on the payment webiste they should just metamask, firefly or tangle pay when they finished payment they should be redirected to woocommerce again with payment success page
											payment completed redirect url $result[1]['redirect_url']
									 */
		write_log($result);
		return array(
			'result' => $result[1]['result'],
			'redirect' => $result[1]['redirect_url'],
		);
	}

	// /**
	//  * Gets cart discount dynamically and inform customer discount for customer.
	//  * @param string $description
	//  * @param int $payment_id
	//  */
	// public function mosquitopay_description_fields_update($description, $payment_id)
	// {

	// 	if ('mosquitopay' !== $payment_id) {
	// 		return $description;
	// 	}
	// 	$order_id = WC()->session->get('order_awaiting_payment');

	// 	if ($order_id <= 0) {
	// 		return $description;
	// 	}
	// 	// Get the order object
	// 	$order = wc_get_order($order_id);

	// 	// Get order total
	// 	$order_total = $order->get_total();
	// 	$discount = $order_total * 0.05;
	// 	$currency_symbol = get_woocommerce_currency_symbol();
	// 	// Format the numeric value

	// 	//echo '<p>Pay with IOTA tokens (Save %5: ' . $discount . ' '. $currency_symbol. ')</p>';

	// 	ob_start();

	// 	echo '<p>Pay with IOTA tokens (Save %5: ' . $discount . ' ' . $currency_symbol . ')</p>';

	// 	$description .= ob_get_clean();

	// 	return $description;
	// }

	/**
	 * Get the cancel url.
	 *
	 * @param WC_Order $order Order object.
	 * @return string
	 */
	public function get_cancel_url($order)
	{
		$return_url = $order->get_cancel_order_url();

		if (is_ssl() || get_option('woocommerce_force_ssl_checkout') == 'yes') {
			$return_url = str_replace('http:', 'https:', $return_url);
		}

		/** DOCBLOCK - Makes linter happy.
		 * 
		 * @since today
		 */
		return apply_filters('woocommerce_get_cancel_url', $return_url, $order);
	}

	/**
	 * Check payment statuses on orders and update order statuses.
	 */
	public function check_orders()
	{
		$this->init_api();

		// Check the status of non-archived Mosquitopay orders.
		$orders = wc_get_orders(
			array(
				'mosquitopay_archived' => false,
				'status' => array('wc-pending'),
				'meta_query' => array(
					array(
						'key' => '_mosquitopay_archived',
						'compare' => 'NOT EXISTS',
					),
					array(
						'key' => '_mosquitopay_charge_id',
						'compare' => 'EXISTS',
					)
				)
			)
		);

		foreach ($orders as $order) {
			$charge_id = $order->get_meta('_mosquitopay_charge_id');

			usleep(300000); // Ensure we don't hit the rate limit.
			$result = Mosquitopay_API_Handler::send_request('charges/' . $charge_id);

			if (!$result[0]) {
				//write_log('Failed to fetch order updates for: ' . $order->get_id());
				continue;
			}

			/* $timeline = $result[1]['data']['timeline'];
																  write_log('Timeline: ' . print_r($timeline, true));
																  $this->_update_order_status($order, $timeline); */
		}
	}

	/**
	 * Handle requests sent to webhook.
	 */
	public function handle_webhook()
	{
		//inside payload we need to put a payload this function reads raw body
		$payload = file_get_contents('php://input');
		/* write_log($payload); */
		$this->validate_webhook($payload);
		if (!empty($payload)) {
			$data = json_decode($payload, true);
			/* write_log($data); */
			$event_data = $data['event']['data'];
			/* write_log($event_data); */

			/* write_log('Webhook received event: ' . print_r($data, true)); */

			/* write_log($event_data['metadata']['order_id']); */

			if (!isset($event_data['metadata']['order_id'])) {
				// Probably a charge not created by us.
				exit;
			}

			$order_id = $event_data['metadata']['order_id'];

			/* 	write_log(wc_get_order($order_id)); */

			$this->_update_order_status(wc_get_order($order_id), $event_data['timeline']);

			exit; // 200 response for acknowledgement.
		}

		wp_die('Mosquitopay Webhook Request Failure', 'Mosquitopay Webhook', array('response' => 500));
	}

	/**
	 * Check Mosquitopay webhook request is valid.
	 * 
	 * @param  string $payload
	 */

	public function validate_webhook($payload)
	{
		// write_log('Checking Webhook response is valid');

		if (!isset($_SERVER['x_cc_webhook_signature'])) {
			return false;
		}

		$sig = $_SERVER['x_cc_webhook_signature'];

		$secret = $this->get_option('webhook_secret');

		///get the x_cc_webhook_signature
		//For furthermore encrption to increase security requirements
		/* $sig2 = hash_hmac('sha256', $payload, $secret); */

		if ($sig === $secret) {
			// write_log('Webhooks is valid');
			return true;
		}

		return false;
	}

	/* 	 public function validate_webhook($payload)
					  {
						  write_log('Checking Webhook response is valid');

						  if (!isset($_SERVER['HTTP_X_CC_WEBHOOK_SIGNATURE'])) {
							  return false;
						  }

						  $sig = $_SERVER['HTTP_X_CC_WEBHOOK_SIGNATURE'];

						  $secret = $this->get_option('webhook_secret');

						  /* $sig2 = hash_hmac('sha256', $payload, $secret); 

						  if ($sig === $sig2) {
							  return true;
						  }

						  return false;
					  }
				   */


	/**
	 * Init the API class and set the API key etc.
	 */
	protected function init_api()
	{
		include_once dirname(__FILE__) . '/includes/class-mosquitopay-api-handler.php';

		Mosquitopay_API_Handler::$log = get_class($this) . '::log';
		Mosquitopay_API_Handler::$api_key = $this->get_option('api_key');
	}

	/**
	 * Update the status of an order from a given timeline.
	 * 
	 * @param  WC_Order $order
	 * @param  array    $timeline
	 */

	/*  public function _update_order_status($order, $timeline) */
	public function _update_order_status($order, $timeline)
	{
		$prev_status = $order->get_status();
		/* $prev_status = $order->get_meta('_mosquitopay_status'); */
		// write_log($prev_status);

		//This part receives event from webhook with metadata as mosquitopay_status inside body
		/* write_log($timeline); */
		/* $last_update = end($timeline); */
		$last_update = $timeline['mosquitopay_status'];
		/* write_log($last_update); */


		/* $admin_email = $wp_options->get_option( 'admin_email' );

											$subject = 'New Order Notification';
											$message = "A new order with status processing has been placed."; */
		/* $status      = $last_update['status']; */
		if ($last_update !== $prev_status) {
			/* $order->update_meta_data('_mosquitopay_status', $status); */
			if ('COMPLETED' === $last_update || 'OVERPAID' === $last_update) {
				$order->update_status('processing', __('Mosquitopay payment was successfully processed.', 'mosquitopay'));
				$order->payment_complete();
				/* wp_mail($admin_email, $subject, $message); */
			} else if ('FAILED' === $last_update) {
				$order->update_status('on-hold', __('Mosquitopay payment was insufficent.', 'mosquitopay'));
				$order->cancel_order();
				/* wp_mail($admin_email, $subject, $message); */
			}
			/* if ('EXPIRED' === $status && 'pending' == $order->get_status()) {
																	  $order->update_status('cancelled', __('Mosquitopay payment expired.', 'mosquitopay'));
																  } elseif ('CANCELED' === $status) {
																	  $order->update_status('cancelled', __('Mosquitopay payment cancelled.', 'mosquitopay'));
																  } elseif ('UNRESOLVED' === $status) {
																	  if ('OVERPAID' === $last_update['context']) {
																		  $order->update_status('processing', __('Mosquitopay payment was successfully processed.', 'mosquitopay'));
																		  $order->payment_complete();
																	  } else {
																		  // translators: Mosquitopay error status for "unresolved" payment. Includes error status.
																		  $order->update_status('failed', sprintf(__('Mosquitopay payment unresolved, reason: %s.', 'mosquitopay'), $last_update['context']));
																	  }
																  }
																   elseif ('RESOLVED' === $status) {
																	  // We don't know the resolution, so don't change order status.
																	  $order->add_order_note(__('Mosquitopay payment marked as resolved.', 'mosquitopay'));
																  } elseif ('COMPLETED' === $status) {
																	  $order->update_status('processing', __('Mosquitopay payment was successfully processed.', 'mosquitopay'));
																	  $order->payment_complete();
																  } */
		}

		// Archive if in a resolved state and idle more than timeout.v 
		/* if (
												in_array($status, array('EXPIRED', 'COMPLETED', 'RESOLVED'), true) &&
												$order->get_date_modified() < $this->timeout
											) {
												write_log('Archiving order: ' . $order->get_order_number());
												$order->update_meta_data('_mosquitopay_archived', true);
											} */
	}

	/**
	 * Handle a custom 'mosquitopay_archived' query var to get orders
	 * payed through Mosquitopay with the '_mosquitopay_archived' meta.
	 * 
	 * @param array $query - Args for WP_Query.
	 * @param array $query_vars - Query vars from WC_Order_Query.
	 * @return array modified $query
	 */
	public function _custom_query_var($query, $query_vars)
	{
		if (array_key_exists('mosquitopay_archived', $query_vars)) {
			$query['meta_query'][] = array(
				'key' => '_mosquitopay_archived',
				'compare' => $query_vars['mosquitopay_archived'] ? 'EXISTS' : 'NOT EXISTS',
			);
			// Limit only to orders payed through Mosquitopay.
			$query['meta_query'][] = array(
				'key' => '_mosquitopay_charge_id',
				'compare' => 'EXISTS',
			);
		}

		return $query;
	}
}