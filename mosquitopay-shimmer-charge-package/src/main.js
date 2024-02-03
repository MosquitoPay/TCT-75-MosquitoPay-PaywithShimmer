/**
 * @typedef RedirectUrl
 * @property { string } redirect_url
 */

/**
 * @typedef OrderLocalPrice
 * @property { string } amount
 * @property { string } currency
 */

/**
 * @typedef OrderKeyId
 * @property { number } id
 * @property { string } key
 */

/**
 * @typedef TotalPrice
 * @property { number } eur
 * @property { number } shimmer
 */

/**
 * @typedef OrderParsed
 * @property { string } customer
 * @property { string } email
 * @property { string } shopOwner
 * @property { string } shopOwnerEmail
 * @property { OrderKeyId } order
 * @property { string } address
 * @property { object } cart
 * @property { number } tax
 * @property { TotalPrice } total
 */

/**
 * @typedef OrderMetadata
 * @property { number } order_id
 * @property { string } order_key
 * @property { number } customer_id
 * @property { string } mosquitopay_status
 * @property { string } admin_email
 * @property { string } admin_fistname
 * @property { string } admin_lastname
 * @property { string } billing_first_name
 * @property { string } billing_last_name
 * @property { string } billing_company
 * @property { string } billing_address
 * @property { string } cart
 * @property { string } billing_email
 * @property { string } billing_phone
 */

/**
 * @typedef Order
 * @property { string } name
 * @property { string } pricing_type
 * @property { OrderLocalPrice } local_price
 * @property { OrderMetadata } metadata
 * @property { string } redirect_url
 * @property { string } cancel_url
 */

/**
 * cartDataParser(data)
 *
 * @param { string } data
 * @returns { object }
 */
const cartDataParser = (data) => {
  try {
    // JSON parsing of cart data request
    const cartData = JSON.parse(
      '[' +
        data
          .replace(/{/g, '{"')
          .replace(/}/g, '"}')
          .replace(/, /g, '", "')
          .replace(/: /g, '": "')
          .replace(/quantity:/g, 'quantity": "')
          .replace(/}\", \"{/g, '}, {') +
        ']'
    )

    // returning the parsed cart data that ready to be processsed
    return cartData.map((x) => {
      x.price = Number(x.price)
      x.quantity = Number(x.quantity)
      return x
    })
  } catch (err) {
    // parsing error return
    return new Error('Failed to parse cart data request from woocommerce shop')
  }
}

/**
 *
 * @param { Order } order
 * @param { object } cart
 * @param { number } shimmerExchange
 * @param { number } tax
 * @returns { OrderParsed }
 */
const orderParser = (order, cart, shimmerExchange, tax = 0) => {
  return {
    customer: order.metadata.billing_first_name + ' ' + order.metadata.billing_last_name,
    email: order.metadata.billing_email,
    shopOwner: order.metadata.admin_fistname + ' ' + order.metadata.admin_lastname,
    shopOwnerEmail: order.metadata.admin_email,
    phone: order.metadata.billing_phone,
    order: {
      id: order.metadata.order_id,
      key: order.metadata.order_key
    },
    address: order.metadata.billing_address,
    cart,
    tax: taxEur(order.local_price.amount, tax),
    total: {
      eur: totalEurTax(order.local_price.amount, taxEur(order.local_price.amount, tax)),
      shimmer: totalShimmer(
        totalEurTax(order.local_price.amount, taxEur(order.local_price.amount, tax)),
        shimmerExchange
      )
    }
  }
}

/**
 * taxEuro(totalInEuro)
 *
 * count tax in euro
 *
 * @param { string } totalInEuro
 * @param { number } taxAmount
 * @returns { number }
 */
const taxEur = (totalInEuro, taxAmount) => {
  return Number(totalInEuro) * taxAmount
}

/**
 *
 * @param { string } totalInEuro
 * @param { number } taxInEuro
 * @returns { number }
 */
const totalEurTax = (totalInEuro, taxInEuro) => {
  return Number(totalInEuro) + taxInEuro
}

/**
 *
 * @param { number } totalInEuroWithTax
 * @param { number } currencyShimmerEuro
 * @returns { number }
 */
const totalShimmer = (totalInEuroWithTax, currencyShimmerEuro) => {
  return (totalInEuroWithTax / currencyShimmerEuro)
}

/**
 * 
 * @param { string } base_redirect 
 * @param { Order } order 
 * @param { string } cart
 * @param { number } shimmerExchange 
 * @param { number } tax 
 * @returns { Error | RedirectUrl }
 */
export const createCharge = (base_redirect, order, cart, shimmerExchange, tax = 0) => {
  try {
    // redirect and cancel url
    const redirecting = order.redirect_url
    const canceling = order.cancel_url

    //
    // console.log({ shimmerExchange })

    // parsing cart data
    const cartData = cartDataParser(cart)
    // console.log('CART DATA: ', cartData)

    // order received parser
    const orderReceived = orderParser(order, cartData, shimmerExchange, tax)
    // console.log('ORDER RECEIVED: ', orderReceived)

    // creating redirect url for woocommerce webshop
    const redirect_url =
      base_redirect +
      '/?r=' +
      encodeURIComponent(redirecting) +
      '&c=' +
      encodeURIComponent(canceling) +
      '&m=' +
      orderReceived.order.id +
      '&s=' +
      ((orderReceived.total.shimmer * (10**6)).toFixed().toString()) +
      '&e=' +
      orderReceived.total.eur
      
    // returning redirect url to woocommerce webshop
    return { redirect_url }
  } catch (err) {
    // returning error
    return new Error(err.message)
  }
}
