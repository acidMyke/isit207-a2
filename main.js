/**
 * @typedef {Object} Account
 * @property {String} name
 * @property {String} email
 * @property {String} password
 * @property {number?} loginMs
 */

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

function redirectAfterLogin() {}

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
}

function initFromLocalStorage() {
  const dynamicDataJson = localStorage.getItem('dynamicData');
  if (!dynamicDataJson) return;
  try {
    const dynamicData = JSON.parse(dynamicDataJson);
    console.log('dynamicData', dynamicData);
    accounts = dynamicData.accounts;
    if (
      dynamicData.currentAccount &&
      dynamicData.currentAccount.loginMs + 600_000 > new Date().getTime()
    ) {
      currentAccount = dynamicData.currentAccount;
    }
  } catch {}
}

function saveToLocalStorage() {
  currentAccount.loginMs = new Date().getTime();
  const dynamicData = { accounts, currentAccount };
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
    }
    const currentPath =
      window.location.pathname.split('/').pop() || 'index.html';

    const links = this.shadowRoot.querySelectorAll('li > a');

    links.forEach(link => {
      const li = link.parentElement;
      const linkPath = link.getAttribute('href');

      li.classList.toggle('active', linkPath === currentPath);
    });
  }
}

customElements.define('app-nav', AppNavCompoenent);
