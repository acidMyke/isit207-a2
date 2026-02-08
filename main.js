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
 * @property {'reserved' | 'collected' | 'returned' | 'inspected' | 'cancelled' | 'refunded' } status
 * @property {number} checkedOutAt
 * @property {string?} comment
 * @property {number?} penalty
 */

const dateFormatter = Intl.DateTimeFormat('en-SG', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});

const timeFormatter = Intl.DateTimeFormat('en-SG', {
  hour12: true,
  hour: 'numeric',
  minute: '2-digit',
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
    price: 120,
    imagePath: 'images/cars/00-3series.webp',
  },
  {
    id: 1,
    brand: 'Audi',
    model: 'A4',
    price: 110,
    imagePath: 'images/cars/01-a4.webp',
  },
  {
    id: 2,
    brand: 'Mercedes',
    model: 'GLA',
    price: 130,
    imagePath: 'images/cars/02-m-gla.avif',
  },
  {
    id: 3,
    brand: 'Mercedes',
    model: 'E Class',
    price: 160,
    imagePath: 'images/cars/03-m-eclass.webp',
  },
  {
    id: 4,
    brand: 'Mercedes',
    model: 'GLC',
    price: 150,
    imagePath: 'images/cars/04-m-glc.webp',
  },
  {
    id: 5,
    brand: 'Mercedes',
    model: 'GLE',
    price: 190,
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

/** @type {Record<Booking['status'], {desription: string, order: number, label: string }>} */
const BOOKING_STATUS_CONST = {
  reserved: {
    desription: 'Reserved, Pending collection',
    order: 0,
    label: 'Reserved',
  },
  collected: {
    desription: 'Collected, Pending returned',
    order: 0,
    label: 'Collected',
  },
  returned: {
    desription: 'Returned, Pending inspection',
    order: 1,
    label: 'Returned',
  },
  inspected: {
    desription: 'Inspected',
    order: 2,
    label: 'Inspected',
  },
  cancelled: {
    desription: 'Cancelled, Pending refund',
    order: 2,
    label: 'Cancelled',
  },
  refunded: {
    desription: 'Refunded',
    order: 2,
    label: 'Refunded',
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

function getRedirectUrl() {
  const params = new URLSearchParams(location.search);
  return params.get('redirect') ?? 'index.html';
}

/**
 * @type {() => void}
 * @private
 */
let localStorageInitPromiseResolved;
const localStorageInitPromise = new Promise(
  resolve => (localStorageInitPromiseResolved = () => resolve(undefined)),
);

/**
 * @param {((data: ReturnType<typeof saveToLocalStorage>) => void)} callback
 */
function initFromLocalStorage(callback) {
  const dynamicDataJson = localStorage.getItem('dynamicData');
  if (dynamicDataJson) {
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
  }
  callback(saveToLocalStorage());
  localStorageInitPromiseResolved();
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
    <span>${BOOKING_STATUS_CONST[booking.status].desription}</span>
  </div>
  <div class="accordion-content">
    <p>Status: <strong>${BOOKING_STATUS_CONST[booking.status].desription}</strong></p>
    <p>From: <strong>${dateFormatter.format(new Date(booking.dateTimeFrom))}</strong></p>
    <p>To: <strong>${dateFormatter.format(new Date(booking.dateTo))}</strong></p>
    <p>Subtotal: <strong>${currencyFormatter.format(booking.total)}</strong></p>
    ${booking.penalty ? `<p>Penalty: <strong>${currencyFormatter.format(booking.penalty)} [Reason: ${booking.comment ?? ''}]</strong></p>` : ''}
    ${booking.penalty ? `<p>Total: <strong>${currencyFormatter.format(booking.total + booking.penalty)}</strong></p>` : ''}
    ${!booking.penalty && booking.comment ? `<p>Employee comment: <strong>${booking.comment}</strong></p>` : ''}
  </div>`;

  let contentEl = accordion.querySelector('.accordion-content');
  let primaryButtonEl = document.createElement('button');
  primaryButtonEl.classList.add('btn-primary');
  let linkButtonEl = document.createElement('button');
  linkButtonEl.classList.add('btn-link');

  if (booking.status === 'reserved') {
    primaryButtonEl.onclick = () =>
      updateBookingStatus(booking.id, 'collected');
    primaryButtonEl.textContent = 'Collect';
    contentEl?.appendChild(primaryButtonEl);

    linkButtonEl.onclick = () => updateBookingStatus(booking.id, 'cancelled');
    linkButtonEl.textContent = 'Cancel';
    contentEl?.appendChild(linkButtonEl);
  }

  if (booking.status === 'collected') {
    primaryButtonEl.onclick = () => updateBookingStatus(booking.id, 'returned');
    primaryButtonEl.textContent = 'Return';
    contentEl?.appendChild(primaryButtonEl);
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
