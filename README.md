<a name="readme-top"></a>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/github_username/repo_name">
    <img src="assets/logo.jpeg" alt="Logo" height="80">
  </a>

<h3 align="center">MosquitoPay - Pay with Shimmer</h3>

  <p align="center">
    This project is <strong>Mosquitopay Pay with Shimmer</strong> for Tangle Community Treasury
    <br />
    <br />
    <a href="https://wp.mosquitopay.io">View Demo</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project

[![Product Name Screen Shot][product-screenshot]](assets/pay_with_shimmer.png)

This project is based on Tangle Community Treasury Grant [TCT-75: Mosquito Pay - Pay with Shimmer](https://www.tangletreasury.org/proposal-details?recordId=recVHKCZDBin0tddE).

This project consist of two core function:
* [mosquitopay-shimmer-client](mosquitopay-shimmer-client) Rust code with [iota-sdk](https://github.com/iotaledger/iota-sdk) for listening payment to the specified shimmer wallet address
* [mosquitopay-shimmer-charge-package](mosquitopay-shimmer-charge-package) for parsing purchase request from woocommerce 

And sample how to use it on backend and frontend of payment receiver:
* [mosquitopay-shimmer-backend](mosquitopay-shimmer-backend) for handling payment request
* [mosquitopay-shimmer-frontend](mosquitopay-shimmer-frontend) for handling payment request to the customer

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

* [![Rust][Rustlang.org]][Rustlang-url]
* [![Fastify][Fastify.js]][Fastify-url]
* [![Wordpress][Wordpress.com]][Wordpress-url]
* [![Vite][Vitejs.dev]][Vite-url]
* [![React][React.js]][React-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

To run this project locally, you need some preparation.

### Prerequisites

> #### This plugin has been developed and is guaranteed to work with:
>
> - PHP version 8.2.10
> - Wordpress version 6.4.2
> - Woocommerce plugin version 8.4.0
> - Node.js version LTS
> - Rust and Cargo version 1.74.0
> - Firefly Shimmer version 2.1.12
> - iota-sdk version 1.1.2
> 
> ***

For iota-sdk, need to check their documentation on [github](https://github.com/iotaledger/iota-sdk/tree/develop?tab=readme-ov-file#before-you-start).

After all of it installed successfully, you can run:

* pnpm
  ```sh
  npm install pnpm@latest -g
  ```
* packages
  ```sh
  pnpm install
  ```

### Installation

1. Copy paste .env.example into .env on [mosquitopay-shimmer-backend](mosquitopay-shimmer-backend/.env.example) you can change the payment page base url and api url
2. Copy paste .env.example into .env on [mosquitopay-shimmer-client](mosquitopay-shimmer-client/.env.example) you can change the shimmer wallet address with your wallet address and api url and also you custom api key
3. Copy paste .env.example into .env on [mosquitopay-shimmer-frontend](mosquitopay-shimmer-frontend/.env.example) you can change the vite backend url with running http server and websocket server on [mosquitopay-shimmer-backend](mosquitopay-shimmer-backend)
3. Go to web that run from [mosquitopay-shimmer-frontend](mosquitopay-shimmer-frontend) on default it's on [localhost:5173](http://localhost:5173)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->
## Usage

* To run all of the packages, run with the command:
  ```sh
  pnpm dev
  ``` 

* Use [sample.shop.json](mosquitopay-shimmer-backend/sample.shop.json) to specify your shop url on shopName, your custom api key and webhhook key also your shommer wallet address to receive the [Shimmer](https://shimmer.network/token) payment.

* Upload it on web that run from [mosquitopay-shimmer-frontend](mosquitopay-shimmer-frontend) on default it's on [localhost:5173](http://localhost:5173).

* Download the plugin, and put it on your woocommerce shop plugin.

* Now you can make purchase on your shop and can use payment Mosquitopay Pay with Shimmer.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

Distributed under the [Apache-2.0](LICENSE) License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->
## Contact

Mosquitopay - [@MosquitoPay](https://twitter.com/MosquitoPay) - info@mosquitopay.io

Project Link: [https://github.com/github_username/repo_name](https://github.com/github_username/repo_name)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Tangle Community Treasury](https://www.tangletreasury.org)
* [IOTA Foundation](https://www.iota.org)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/github_username/repo_name.svg?style=for-the-badge
[contributors-url]: https://github.com/github_username/repo_name/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/github_username/repo_name.svg?style=for-the-badge
[forks-url]: https://github.com/github_username/repo_name/network/members
[stars-shield]: https://img.shields.io/github/stars/github_username/repo_name.svg?style=for-the-badge
[stars-url]: https://github.com/github_username/repo_name/stargazers
[issues-shield]: https://img.shields.io/github/issues/github_username/repo_name.svg?style=for-the-badge
[issues-url]: https://github.com/github_username/repo_name/issues
[license-shield]: https://img.shields.io/github/license/github_username/repo_name.svg?style=for-the-badge
[license-url]: https://github.com/github_username/repo_name/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/linkedin_username
[product-screenshot]: assets/pay_with_shimmer.png
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Vue.js]: https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D
[Vue-url]: https://vuejs.org/
[Angular.io]: https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white
[Angular-url]: https://angular.io/
[Svelte.dev]: https://img.shields.io/badge/Svelte-4A4A55?style=for-the-badge&logo=svelte&logoColor=FF3E00
[Svelte-url]: https://svelte.dev/
[Laravel.com]: https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white
[Laravel-url]: https://laravel.com
[Bootstrap.com]: https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white
[Bootstrap-url]: https://getbootstrap.com
[JQuery.com]: https://img.shields.io/badge/jQuery-0769AD?style=for-the-badge&logo=jquery&logoColor=white
[JQuery-url]: https://jquery.com 
[Vitejs.dev]: https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white
[Vite-url]: https://vitejs.dev
[Fastify.js]: https://img.shields.io/badge/fastify-%23000000.svg?style=for-the-badge&logo=fastify&logoColor=white
[Fastify-url]: https://fastify.dev
[Wordpress.com]: https://img.shields.io/badge/WordPress-%23117AC9.svg?style=for-the-badge&logo=WordPress&logoColor=white
[Wordpress-url]: https://wordpress.com
[Rustlang.org]: https://img.shields.io/badge/rust-%23000000.svg?style=for-the-badge&logo=rust&logoColor=white
[Rustlang-url]: https://www.rust-lang.org