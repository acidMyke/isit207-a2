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
 * @property {number} id
 * @property {number} carId
 * @property {string} userId
 * @property {string} dateTimeFrom
 * @property {string} dateTo
 * @property {string} last4cc
 * @property {number} total
 * @property {number?} penalty
 * @property {string[]} photos
 * @property {'reserved' | 'collected' | 'returned' | 'inspected'} status
 * @property {number} checkedOutAt
 */

const dateFormatter = Intl.DateTimeFormat('en-SG', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});

const currencyFormatter = Intl.NumberFormat('en-SG', {
  style: 'currency',
  currency: 'SGD',
});

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

/** @type {Record<Booking['status'], {displayStr: string, order: number}>} */
const BOOKING_STATUS_CONST = {
  reserved: {
    displayStr: 'Reserved, Pending collection',
    order: 0,
  },
  collected: {
    displayStr: 'Collected, Pending returned',
    order: 0,
  },
  returned: {
    displayStr: 'Returned, Pending inspection',
    order: 1,
  },
  inspected: {
    displayStr: 'Inspected',
    order: 2,
  },
};

/**
 *
 * @param {string | string[]} status
 * @param {'error' | 'success'} [type]
 * @param {HTMLElement?} [el]
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

/**
 * @param {((data: ReturnType<typeof saveToLocalStorage>) => void)} callback
 */
function initFromLocalStorage(callback) {
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
    callback(saveToLocalStorage());
  } catch {}
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
          <li class="loginonly"><a href="#" onclick="processLogout(event)">Log out</a></li>
        </ul>
      </nav>
    </header>`;
  }

  static authPath = ['login.html', 'sign-up.html'];

  connectedCallback() {
    initFromLocalStorage(() => {
      renderCarGrid();
      renderBookingHistory();
      initializeCarCheckout();
    });
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
  rentFromEl.min = now.toISOString().slice(0, 16);

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
        .slice(0, 16);
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
    dateTimeFrom: rentFromStr,
    dateTo: rentToStr,
    last4cc: ccStr?.slice(12, 16),
    total: parseFloat(preCalcTotalStr),
    status: 'rented',
    checkedOutAt: new Date().getTime(),
    penalty: 0,
    photos: [],
  });

  carQty[carId.toString().padStart(2, '0')] -= 1;
  saveToLocalStorage();

  location.replace('/history.html');
}

function renderBookingHistory() {
  const historyListEl = document.getElementById('history-list');
  if (!historyListEl) {
    return;
  }

  const sortedBookings = bookings.toSorted((a, b) => {
    const statusDiff =
      BOOKING_STATUS_CONST[a.status].order -
      BOOKING_STATUS_CONST[b.status].order;
    if (statusDiff !== 0) {
      return statusDiff;
    }

    return (
      new Date(a.dateTimeFrom).getTime() - new Date(b.dateTimeFrom).getTime()
    );
  });

  sortedBookings.forEach((booking, index) => {
    const el = renderBookingAccordion(booking, index);
    if (el) {
      historyListEl.appendChild(el);
    }
  });
}

/**
 *
 * @param {Booking} booking
 * @param {number} index
 */
function renderBookingAccordion(booking, index) {
  if (booking.userId !== currentAccount?.id) {
    return null;
  }

  const car = carListing.find(({ id }) => id === booking.carId);

  if (!car) {
    return null;
  }

  const accordion = document.createElement('div');
  accordion.className = 'accordion';
  accordion.setAttribute('data-status', booking.status);

  accordion.innerHTML = `
  <input type="checkbox" name="accordion-control-${booking.id}" ${booking.status === 'reserved' || booking.status === 'collected' ? 'checked' : ''}/>
  <div class="accordion-title">
    <span>${car.brand} ${car.model}</span>
    <span>${dateFormatter.format(new Date(booking.checkedOutAt))}</span>
    <span>${BOOKING_STATUS_CONST[booking.status].displayStr}</span>
  </div>
  <div class="accordion-content">
    <p>${BOOKING_STATUS_CONST[booking.status].displayStr}</p>
    <p>From: <strong>${dateFormatter.format(new Date(booking.dateTimeFrom))}</strong></p>
    <p>To: <strong>${dateFormatter.format(new Date(booking.dateTo))}</strong></p>
    <p>Total: <strong>${currencyFormatter.format(booking.total)}</strong></p>
    ${booking.penalty ? `<p>Penalty: ${currencyFormatter.format(booking.penalty)}</p>` : ''}
  </div>`;

  let contentEl = accordion.querySelector('.accordion-content');
  let buttonEl = document.createElement('button');
  buttonEl.classList.add('btn-primary');

  if (booking.status === 'reserved') {
    buttonEl.onclick = () => updateBookingStatus(booking.id, 'collected');
    buttonEl.textContent = 'Collect';
    contentEl?.appendChild(buttonEl);
  }

  if (booking.status === 'collected') {
    buttonEl.onclick = () => updateBookingStatus(booking.id, 'returned');
    buttonEl.textContent = 'Return';
    contentEl?.appendChild(buttonEl);
  }

  return accordion;
}

/**
 * @param {number} id
 * @param {Booking['status']} status
 */
function updateBookingStatus(id, status) {
  let booking = bookings.find(b => b.id == id);
  if (booking) {
    booking.status = status;
  }
  saveToLocalStorage();
  location.reload();
}
