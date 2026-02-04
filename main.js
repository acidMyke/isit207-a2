/**
 * @typedef {Object} Account
 * @property {string} name
 * @property {string} email
 * @property {string} password
 * @property {number?} loginMs
 */

/**
 * @typedef {Object} Car
 * @property {string} brand
 * @property {string} model
 * @property {string} price
 * @property {string} imagePath
 */

/** @type {Car[]} */
let cars = [
  {
    id: 0,
    make: 'BMW',
    model: '3 Series',
    price: 333,
    image: 'images/cars/00-3series.webp',
    qty: 3,
  },
  {
    id: 0,
    make: 'Audi',
    model: 'A4',
    price: 200,
    image: 'images/cars/01-a4.webp',
    qty: 4,
  },
];

/** @type {Account[]} */
let accounts = [];

/** @type {Account | null} */
let currentAccount = null;

function setFormStatus(status, type = 'error', el) {
  /** @type {HTMLDivElement | null} */
  const formStatusEl = (el ?? document).querySelector('.formStatus');

  if (!formStatusEl) {
    throw new Error('Form status element not found');
  }

  if (status === undefined || status === null) {
    formStatusEl.innerHTML = '';
  }

  if (!Array.isArray(status)) {
    status = [status];
  }

  for (let s of status) {
    if (typeof s == 'string') {
      const pEl = document.createElement('p');
      pEl.classList.add(type);
      pEl.innerText = status;
      formStatusEl.appendChild(pEl);
    }
  }
}

/** @param {Account} */
function setCurrentAccount(account) {
  currentAccount = account;
  saveToLocalStorage();
}

function getRedirectUrl() {
  const params = new URLSearchParams(location.search);
  return params.get('redirect') ?? 'index.html';
}

function redirectAfterLogin() {
  location.href = getRedirectUrl();
}

/**
 *
 * @param {SubmitEvent} event
 */
function processLogin(event) {
  if (!event || !event.target) return;
  event.preventDefault();
  const data = new FormData(event.target);
  const namail = data.get('namail').trim();
  const password = data.get('password');

  if (namail.length === 0) {
    setFormStatus('Name/Email cannot be empty');
    return;
  }

  for (let xAcc of accounts) {
    if (
      (xAcc.name === namail || xAcc.email === namail) &&
      xAcc.password === password
    ) {
      setCurrentAccount(xAcc);
      redirectAfterLogin();
      return;
    }
  }

  setFormStatus('Invalid credentials');
}

/**
 *
 * @param {SubmitEvent} event
 */
function processSignUp(event) {
  if (!event || !event.target) return;
  event.preventDefault();
  const data = new FormData(event.target);
  const name = data.get('name').trim();
  const email = data.get('email').trim();
  const password = data.get('password');

  for (let xAcc of accounts) {
    if (xAcc.name === name) {
      setFormStatus('name used!!');
      return;
    }

    if (xAcc.email === email) {
      setFormStatus('email used!!');
      return;
    }
  }

  const acc = { name, email, password };

  accounts.push(acc);
  setCurrentAccount(acc);
  redirectAfterLogin();
}

/**
 *
 * @param {MouseEvent} event
 */
function processLogout(event) {
  event.preventDefault();
  currentAccount = null;
  saveToLocalStorage();
  redirectAfterLogin();
}

function initFromLocalStorage() {
  const dynamicDataJson = localStorage.getItem('dynamicData');
  if (!dynamicDataJson) return;
  try {
    const dynamicData = JSON.parse(dynamicDataJson);
    console.log('dynamicData', dynamicData);
    accounts = dynamicData.accounts;
    if (
      dynamicData.cars &&
      Array.isArray(dynamicData.cars) &&
      dynamicData.cars.length
    ) {
      cars = dynamicData.cars;
    }
    if (
      dynamicData.currentAccount &&
      dynamicData.currentAccount.loginMs + 600_000 > new Date().getTime()
    ) {
      currentAccount = dynamicData.currentAccount;
    }
  } catch {}
}

function saveToLocalStorage() {
  if (currentAccount) {
    currentAccount.loginMs = new Date().getTime();
  }
  const dynamicData = { accounts, currentAccount, cars };
  localStorage.setItem('dynamicData', JSON.stringify(dynamicData));
}

class AppNavCompoenent extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = `
    <link rel="stylesheet" href="/common.css" />
        <header class="site-header">
      <nav class="nav">
        <a href="index.html" id="logo">
          <img src="/images/logo.webp" alt="Car Rental Logo" />
        </a>

        <input type="checkbox" id="nav-toggle" />
        <label for="nav-toggle">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-menu-icon lucide-menu hamburger"
          >
            <path d="M4 5h16" />
            <path d="M4 12h16" />
            <path d="M4 19h16" />
          </svg>
        </label>

        <ul id="menu" data-isLoggedIn="false">
          <li><a href="index.html">Home</a></li>
          <li><a href="about.html">About Us</a></li>
          <li class="publiconly"><a href="login.html">Login</a></li>
          <li class="publiconly"><a href="sign-up.html">Sign Up</a></li>
          <li class="loginonly"><a href="booking.html">Booking</a></li>
          <li class="loginonly"><a href="history.html">History</a></li>
          <li class="loginonly"><a href="return.html">Return</a></li>
          <li class="loginonly"><a href="#" onclick="processLogout(event)">Log out</a></li>
        </ul>
      </nav>
    </header>`;
  }

  connectedCallback() {
    initFromLocalStorage();
    if (currentAccount) {
      const menuEl = this.shadowRoot.getElementById('menu');
      menuEl?.setAttribute('data-isLoggedIn', 'true');
      document.body.setAttribute('data-isLoggedIn', 'true');
    }
    const currentPath =
      window.location.pathname.split('/').pop() || 'index.html';

    const links = this.shadowRoot.querySelectorAll('li > a');

    links.forEach(link => {
      const li = link.parentElement;
      const linkPath = link.getAttribute('href');

      li.classList.toggle('active', linkPath === currentPath);

      if (['login.html', 'sign-up.html'].includes(linkPath)) {
        link.setAttribute(
          'href',
          linkPath + '?redirect=' + encodeURIComponent(currentPath),
        );
      }
    });
  }
}

customElements.define('app-nav', AppNavCompoenent);

/** @param {Event} event */
function onBookingDetailChange(event) {
  const { target } = event;
  const targetName = target?.getAttribute('name');

  if (!targetName || targetName === 'accordion-control') {
    return;
  }

  console.log(targetName);
}
