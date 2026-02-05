//@ts-check

/**
 * @typedef {Object} Account
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} password
 * @property {number?} loginMs
 */

/**
 * @typedef {Object} Car
 * @property {number} id
 * @property {string} brand
 * @property {string} model
 * @property {number} price
 * @property {string} imagePath
 */

/**
 * @typedef {Object} Booking
 * @property {number} carId
 * @property {string} userId
 * @property {string} datetimeform
 * @property {string} dateto
 * @property {string} last4cc
 * @property {number} total
 * @property {number?} penalty
 * @property {string[]} photos
 */

/** @type {Car[]} */
let carListing = [
  {
    id: 0,
    brand: 'BMW',
    model: '3 Series',
    price: 333,
    imagePath: 'images/cars/00-3series.webp',
  },
  {
    id: 1,
    brand: 'Audi',
    model: 'A4',
    price: 200,
    imagePath: 'images/cars/01-a4.webp',
  },
  {
    id: 2,
    brand: 'Mercedes',
    model: 'GLA',
    price: 280,
    imagePath: 'images/cars/02-m-gla.avif',
  },
  {
    id: 3,
    brand: 'Mercedes',
    model: 'E Class',
    price: 280,
    imagePath: 'images/cars/03-m-eclass.webp',
  },
  {
    id: 4,
    brand: 'Mercedes',
    model: 'GLC',
    price: 280,
    imagePath: 'images/cars/04-m-glc.webp',
  },
  {
    id: 5,
    brand: 'Mercedes',
    model: 'GLE',
    price: 280,
    imagePath: 'images/cars/05-m-gle.avif',
  },
];

let carQty = {
  '00': 3,
  '01': 4,
  '02': 1,
  '03': 1,
  '04': 1,
  '05': 1,
};

/** @type {Account[]} */
let accounts = [];

/** @type {Account | null} */
let currentAccount = null;

/** @type {Booking[]} */
let bookings = [];

/**
 *
 * @param {string | string[]} status
 * @param {'error' | 'success'} type
 * @param {HTMLElement?} el
 */
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

/** @param {Account} account*/
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

  const acc = { id: accounts.length.toString(), name, email, password };

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
    /** @type {ReturnType<typeof saveToLocalStorage>} */
    const dynamicData = JSON.parse(dynamicDataJson);
    accounts = dynamicData.accounts;
    if (dynamicData.carQty) {
      for (const key in dynamicData.carQty) {
        carQty[key] = dynamicData.carQty[key];
      }
    }

    if (
      dynamicData.bookings &&
      Array.isArray(dynamicData.bookings) &&
      dynamicData.bookings.length
    ) {
      bookings = dynamicData.bookings;
    }

    if (
      dynamicData.currentAccount &&
      dynamicData.currentAccount.loginMs &&
      dynamicData.currentAccount.loginMs + 600_000 > new Date().getTime()
    ) {
      currentAccount = dynamicData.currentAccount;
    }
  } catch {}
  renderCarGrid();
  initializeCarCheckout();
  setInterval(() => saveToLocalStorage(), 20_000);
}

function saveToLocalStorage() {
  if (currentAccount) {
    currentAccount.loginMs = new Date().getTime();
  }
  const dynamicData = { accounts, currentAccount, carQty, bookings };
  localStorage.setItem('dynamicData', JSON.stringify(dynamicData));
  return dynamicData;
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

  static authPath = ['login.html', 'sign-up.html'];

  connectedCallback() {
    initFromLocalStorage();
    if (currentAccount) {
      const menuEl = this.shadowRoot?.getElementById('menu');
      menuEl?.setAttribute('data-isLoggedIn', 'true');
      document.body.setAttribute('data-isLoggedIn', 'true');
    }
    const currentPath =
      window.location.pathname.split('/').pop() || 'index.html';

    const links = this.shadowRoot?.querySelectorAll('li > a');

    links?.forEach(link => {
      const li = link.parentElement;
      const linkPath = link.getAttribute('href');

      li?.classList.toggle('active', linkPath === currentPath);

      if (linkPath && AppNavCompoenent.authPath.includes(linkPath)) {
        let redirectTo = currentPath;
        if (AppNavCompoenent.authPath.includes(currentPath)) {
          redirectTo = getRedirectUrl();
        }
        link.setAttribute(
          'href',
          linkPath + '?redirect=' + encodeURIComponent(redirectTo),
        );
      }
    });
  }
}

customElements.define('app-nav', AppNavCompoenent);

function renderCarGrid() {
  const carGrid = document.getElementById('car-grid');
  if (!carGrid) {
    return;
  }
  carGrid.innerHTML = '';
  for (let car of carListing) {
    const carOptionEl = document.createElement('div');
    const { id, brand, imagePath, model, price } = car;
    const qty = carQty[id.toString().padStart(2, '0')];
    carOptionEl.innerHTML = `
      <img src="${imagePath}" alt="${brand} ${model}">
      <h3>${brand} ${model}</h3>
      <p>SGD ${price} per day</p>
      <a class="btn-primary" href="/checkout.html?carid=${id}">Select!</a>`;
    carOptionEl.setAttribute('data-qty', qty.toString());
    carGrid?.appendChild(carOptionEl);
  }
}

function initializeCarCheckout() {
  const caridInput = /** @type {HTMLInputElement | null} */ (
    document.getElementById('carid')
  );
  if (!caridInput) {
    return;
  }
  const params = new URLSearchParams(location.search);
  const caridStr = params.get('carid');
  if (!caridStr) {
    location.href = '/booking.html';
    return;
  }

  caridInput.value = caridStr;
  onCheckoutFormChange();
}

const dateFormatter = Intl.DateTimeFormat('en-SG', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});

const currencyFormatter = Intl.NumberFormat('en-SG', {
  style: 'currency',
  currency: 'SGD',
});

const DAYS_MS = 86_400_000;

function onCheckoutFormChange() {
  const checkoutform = /** @type {HTMLFormElement | null} */ (
    document.getElementById('checkoutform')
  );

  const dynamicCheckoutContentDiv = /** @type {HTMLDivElement | null} */ (
    document.getElementById('dynamicCheckoutContent')
  );
  if (!checkoutform || !dynamicCheckoutContentDiv) {
    return;
  }

  const rentFromEl = /** @type {HTMLInputElement} */ (
    document.querySelector('input[name="rentFrom"]')
  );
  const rentToEl = /** @type {HTMLInputElement} */ (
    document.querySelector('input[name="rentTo"]')
  );
  const preCalcTotalEl = /** @type {HTMLInputElement} */ (
    document.querySelector('input[name="preCalcTotal"]')
  );
  const now = new Date();
  rentFromEl.min = now.toISOString().slice(0, 10);

  dynamicCheckoutContentDiv.innerHTML = '';

  const formData = new FormData(checkoutform);
  const carIdStr = formData.get('carid');
  const rentFromStr = formData.get('rentFrom');
  const rentToStr = formData.get('rentTo');

  console.log({ carIdStr, rentFromStr, rentToStr });

  const carId = parseInt(carIdStr);
  const car = carListing.find(({ id }) => id === carId);

  if (!car) {
    return;
  }

  const carNameEl = document.createElement('h2');
  carNameEl.innerText = `${car.brand} ${car.model}`;

  dynamicCheckoutContentDiv.appendChild(carNameEl);
  const appendLabelAndValue = (
    /** @type {string} */ labelText,
    /** @type {string} */ value,
  ) => {
    const labelEl = document.createElement('p');
    labelEl.innerText = labelText;
    dynamicCheckoutContentDiv.appendChild(labelEl);

    const valueEl = document.createElement('p');
    valueEl.innerText = value;
    dynamicCheckoutContentDiv.appendChild(valueEl);
  };

  let rentToDate;
  let rentFromDate;
  if (rentFromStr) {
    rentFromDate = new Date(rentFromStr);
    if (!isNaN(rentFromDate.getTime())) {
      rentToEl.min = new Date(rentFromDate.getTime() + DAYS_MS)
        .toISOString()
        .slice(0, 10);
      appendLabelAndValue('From: ', dateFormatter.format(rentFromDate));
    }
  }

  if (rentToStr) {
    rentToDate = new Date(rentToStr);
    if (!isNaN(rentToDate.getTime())) {
      rentFromEl.max = new Date(rentToDate.getTime() - DAYS_MS)
        .toISOString()
        .slice(0, 10);
      appendLabelAndValue('To: ', dateFormatter.format(rentToDate));
    }
  }

  if (rentToDate && rentFromDate) {
    const msDiff = rentToDate.getTime() - rentFromDate.getTime();
    const daysDiff = Math.ceil(msDiff / DAYS_MS);

    appendLabelAndValue('Duration: ', `${daysDiff} days`);

    const subtotal = daysDiff * car.price;

    appendLabelAndValue('Subtotal: ', currencyFormatter.format(subtotal));

    const gst = subtotal * 0.09;
    const grandTotal = subtotal + gst;
    appendLabelAndValue('GST: ', currencyFormatter.format(gst));
    appendLabelAndValue('Total: ', currencyFormatter.format(grandTotal));
    preCalcTotalEl.value = grandTotal.toString();
  }
}

/**
 *
 * @param {SubmitEvent} event
 */
function processCheckout(event) {
  if (!event || !event.target) return;
  event.preventDefault();
  const formData = new FormData(/** @type {HTMLFormElement} */ (event.target));
  const carIdStr = formData.get('carid');
  const rentFromStr = formData.get('rentFrom');
  const rentToStr = formData.get('rentTo');
  const ccStr = formData.get('cc');
  const preCalcTotalStr = formData.get('preCalcTotal');

  console.log({ carIdStr, rentFromStr, rentToStr, preCalcTotalStr });

  const carId = parseInt(carIdStr);
  const car = carListing.find(({ id }) => id === carId);

  if (!car) {
    return;
  }

  bookings.push({
    userId: currentAccount?.id,
    carId,
    datetimeform: rentFromStr,
    dateto: rentToStr,
    last4cc: ccStr?.slice(12, 16),
    total: parseFloat(preCalcTotalStr),
  });

  carQty[carId.toString().padStart(2, '0')] -= 1;
  saveToLocalStorage();

  location.replace('/history.html');
}
