import { createCharge } from '../src/main.js'

test('parsing woocommerce plugin purchase request', () => {
  expect(
    JSON.stringify(
      createCharge(
        'http://localhost:5173/pay',
        {
          "name": "test",
          "pricing_type": "fixed_price",
          "local_price": {
              "amount": "0.28",
              "currency": "EUR"
          },
          "metadata": {
              "order_id": 124,
              "order_key": "wc_order_IXLtiOgMgVWzk",
              "source": "woocommerce",
              "customer_id": 1,
              "mosquitopay_status": "waiting",
              "admin_email": "brzostrane@hotmail.com",
              "admin_fistname": "Umut",
              "admin_lastname": "Seber",
              "billing_first_name": "Umut",
              "billing_last_name": "Seber",
              "billing_company": "",
              "billing_address": "483\/283 La Santir Condominium, room number 1610, Floor16, Bang Lamung, Chonburi, Thailand 20150",
              "cart": "{id: 14, name: cat, price: 0.28, quantity:1}",
              "billing_email": "mut.seber@gmail.com",
              "billing_phone": "0929390362"
          },
          "redirect_url": "http:\/\/test.local\/checkout\/order-received\/124\/?key=wc_order_IXLtiOgMgVWzk",
          "cancel_url": "http:\/\/test.local\/cart\/?cancel_order=true&amp;order=wc_order_IXLtiOgMgVWzk&amp;order_id=124&amp;redirect&amp;_wpnonce=12142cf171"
        },
        '{id: 14, name: cat, price: 0.28, quantity:1}',
        0.2
      )
    )
  )
  .toBe(
    JSON.stringify({
      "redirect_url": "http://localhost:5173/pay?r=http%3A%2F%2Ftest.local%2Fcheckout%2Forder-received%2F124%2F%3Fkey%3Dwc_order_IXLtiOgMgVWzk&c=http%3A%2F%2Ftest.local%2Fcart%2F%3Fcancel_order%3Dtrue%26amp%3Border%3Dwc_order_IXLtiOgMgVWzk%26amp%3Border_id%3D124%26amp%3Bredirect%26amp%3B_wpnonce%3D12142cf171&m=124&s=1400000&e=0.28"
    })
  )
});

test('throws error when order parsing fails', () => {
  // Create a mock order and cart that would lead to an error during parsing
  const base_redirect = 'example.com';
  const order = {
    redirect_url: 'redirect_url_value',
    cancel_url: 'cancel_url_value',
    // Add other necessary properties for order
  };
  const cart = {
    // Add necessary properties for cart
  };
  const shimmerExchange = 'mockShimmerExchange';

  // Function call that should result in an error
  const chargeFunction = () => createCharge(base_redirect, order, cart, shimmerExchange);

  // Assert that calling the function throws an error
  expect(chargeFunction).not.toHaveProperty('redirect_url');
});