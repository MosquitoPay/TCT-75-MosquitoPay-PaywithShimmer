=== Mosquitopay Payment Gateway for WooCommerce ===
Contributors: Mosquitopay development team
Plugin URL: https://commerce.mosquitopay.com/
Tags: mosquitopay, woo, woocommerce, ecommerce, iota, blockchain, commerce, crypto, cryptocurrency
Requires at least: 3.0
Requires PHP: 5.6+
Tested up to: 6.0
Stable tag: 1.3
License: GPLv2 or later

== Description ==

Accept cryptocurrencies through Mosquitopay Commerce such as IOTA mainnet tokens on your WooCommerce store.

== Installation ==


= From WordPress.org =

1. Download Mosquitopay Commerce.
2. Upload to your '/wp-content/plugins/' directory, using your favorite method (ftp, sftp, scp, etc...)
3. Activate Mosquitopay Commerce from your Plugins page.

= Once Activated =

1. Go to WooCommerce > Settings > Payments
2. Configure the plugin for your store

= Configuring Mosquitopay Commerce =

* Within the WordPress administration area, go to the WooCommerce > Settings > Payments page and you will see Mosquitopay in the table of payment gateways.
* Clicking the Manage button on the right hand side will take you into the settings page, where you can configure the plugin for your store.

**Note: If you are running version of WooCommerce older than 3.4.x your Mosquitopay Commerce tab will be underneath the WooCommerce > Settings > Checkout tab**

= Enable / Disable =

Turn the Mosquitopay Commerce payment method on / off for visitors at checkout.

= Title =

Title of the payment method on the checkout page

= Description =

Description of the payment method on the checkout page

Using webhooks allows Mosquitopay Commerce to send payment confirmation messages to the website. To fill this out:

1. In your Mosquitopay Commerce settings page, scroll to the 'Webhook subscriptions' section
2. Click 'Add an endpoint' and paste the URL from within your settings page.
3. Make sure to select "Send me all events", to receive all payment updates.
4. Click "Show shared secret" and paste into the box within your settings page.

= Debug log =

Whether or not to store debug logs.

If this is checked, these are saved within your `wp-content/uploads/wc-logs/` folder in a .log file prefixed with `mosquitopay-`


== Frequently Asked Questions ==

= What cryptocurrencies does the plugin support?

The plugin supports all cryptocurrencies available at https://b2b.mosquitopay.io/

= Prerequisites=

To use this plugin with your WooCommerce store you will need:
* WooCommerce plugin



== Screenshots ==

1. Admin panel
2. Mosquitopay Commerce payment gateway on checkout page
3. Cryptocurrency payment screen


== Changelog ==


= 0.0.1 =
* Mosquitopay Commerce Alpha version
* Tested against WordPress 6.0
* Tested against WooCommerce 6.5.1
* Added support for charge cancel url.
* Add option to disable icons on checkout page.
* Updated README.md
* Updated README.md
* Updated plugin meta in mosquitopay-commerce.php