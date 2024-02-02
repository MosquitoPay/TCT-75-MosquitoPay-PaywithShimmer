<?php

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Sends API requests to Mosquitopay.
 */
class Mosquitopay_API_Handler
{

	/**
	 * Log variable function
	 * 
	 * @var string/array Log variable function.
	 * */
	public static $log;
	/**
	 * Call the $log variable function.
	 *
	 * @param string $message Log message.
	 * @param string $level   Optional. Default 'info'.
	 *     emergency|alert|critical|error|warning|notice|info|debug
	 */
	public static function log($message, $level = 'info')
	{
		return call_user_func(self::$log, $message, $level);
	}

	/**
	 * Mosquitopay API url
	 * 
	 * @var string Mosquitopay API url.
	 * */
	public static $api_url = '{{API_URL}}';

	/**
	 * MosquitoPAY API key
	 * 
	 * @var string MosquitoPAY API key.
	 * */
	public static $api_key;

	/**
	 * Get the response from an API request.
	 * 
	 * @param  string $endpoint
	 * @param  array  $params
	 * @param  string $method
	 * @return array
	 */
	public static function send_request($endpoint, $params = array(), $method = 'POST')
	{
		$customer_id = wp_generate_uuid4();
		$shop_name = get_bloginfo('name');

		$shop_page_url = get_home_url();
		// phpcs:ignore
		write_log('MosquitoPAY Request Args for ' . self::$api_key . ': ' . print_r($params, true) . ":". $shop_page_url);
		$args = array(
			'method'  => $method,
			'headers' => array(
				'x-cc-api-key' => self::$api_key,
				'Content-Type' => 'application/json',
				'x-shop' => $shop_page_url,
				'x-user' => $customer_id
			),
			'timeout' => '100000'
		);

		/* $url = self::$api_url . $endpoint; */
		$url = self::$api_url;
		// write_log('MosquitoPAY Request Args for ' . $url);

		// write_log($args);
		if (in_array($method, array('POST', 'PUT'))) {
			$args['body'] = json_encode($params);
		} else {
			$url = add_query_arg($params, $url);
		}
		write_log($args);
		write_log(array(esc_url_raw($url), $args));
		$response = wp_remote_request(esc_url_raw($url), $args);
		write_log($response);

		if (is_wp_error($response)) {
			write_log('WP response error: ' . $response->get_error_message());
			return array(false, $response->get_error_message());
		} else {

			$result = json_decode($response['body'], true);
			/* write_log($result); */

			/* if (!empty($result['warnings'])) {
				foreach ($result['warnings'] as $warning) {
					write_log('API Warning: ' . $warning);
				}
			} */

			$code = $response['response']['code'];
			// write_log($code);

			if (in_array($code, array(200, 201), true)) {
				return array(true, $result);
			} else {
				$e      = empty($result['error']['message']) ? '' : $result['error']['message'];
				$errors = array(
					400 => 'Error response from API: ' . $e,
					401 => 'Authentication error, please check your API key.',
					429 => 'Mosquitopay API rate limit exceeded.',
				);

				if (array_key_exists($code, $errors)) {
					$msg = $errors[$code];
				} else {
					$msg = 'Unknown response from API: ' . $code;
				}
				// write_log($msg); 

				return array(false, $code);
			}
		}
	}

	/**
	 * Check if authentication is successful.
	 * 
	 * @return bool|string
	 */
	public static function check_auth()
	{
		$result = self::send_request('checkouts', array('limit' => 0));

		if (!$result[0]) {
			return 401 === $result[1] ? false : 'error';
		}

		return true;
	}

	/**
	 * Create a new charge request.
	 * 
	 * @param  int    $amount
	 * @param  string $currency
	 * @param  array  $metadata
	 * @param  string $redirect
	 * @param  string $name
	 * @param  string $cancel
	 * @return array
	 */
	public static function create_charge(
		$amount = null,
		$currency = null,
		$metadata = null,
		$redirect = null,
		$name = null,
		$cancel = null
	) {
		$args = array(
			'name' => is_null($name) ? get_bloginfo('name') : $name,
		);
		$args['name'] = sanitize_text_field($args['name']);

		if (is_null($amount)) {
			$args['pricing_type'] = 'no_price';
		} elseif (is_null($currency)) {
			self::log('Error: if amount is given, currency must be given (in create_charge()).', 'error');
			return array(false, 'Missing currency.');
		} else {
			$args['pricing_type'] = 'fixed_price';
			$args['local_price']  = array(
				'amount'   => $amount,
				'currency' => $currency,
			);
		}

		if (!is_null($metadata)) {
			$args['metadata'] = $metadata;
		}
		if (!is_null($redirect)) {
			$args['redirect_url'] = $redirect;
		}
		if (!is_null($cancel)) {
			$args['cancel_url'] = $cancel;
		}

		$result = self::send_request('charges', $args, 'POST');

		// Cache last-known available payment methods.
		if (!empty($result[1]['data']['addresses'])) {
			update_option(
				'mosquitopay_payment_methods',
				array_keys($result[1]['data']['addresses']),
				false
			);
		}

		return $result;
	}
}
