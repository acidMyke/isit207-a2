// @ts-check
const SPA_ACTIVE_CLASSNAME = 'spaactive';
let activeViewElId = 'loginView';

/**
 * @param {string} viewElId
 */
function toggleSpaView(viewElId) {
  const activeViewEl = document.getElementById(activeViewElId);
  const nextViewEl = document.getElementById(viewElId);

  if (!activeViewEl || !nextViewEl) {
    throw new Error('cant find the id!!');
  }

  activeViewEl.classList.remove(SPA_ACTIVE_CLASSNAME);
  nextViewEl.classList.add(SPA_ACTIVE_CLASSNAME);
}

const adminCredentials = [{ username: 'notadmin', password: 'notpassword' }];

/**
 *
 * @param {SubmitEvent} event
 */
function processAdminLogin(event) {
  if (!event || !event.target) return;
  event.preventDefault();
  const data = new FormData(event.target);
  const username = data.get('username').trim();
  const password = data.get('password');

  if (username.length === 0) {
    setFormStatus('Username cannot be empty');
    return;
  }

  for (let creds of adminCredentials) {
    if ((creds.username = username && creds.password == password)) {
      toggleSpaView('bookingListView');
    }
  }

  setFormStatus('Invalid credentials');
}

function initCars() {
  const carSelectEl = document.getElementById('bookingFilterCar');

  if (!carSelectEl) {
    return;
  }

  for (const car of carListing) {
    const optionEl = document.createElement('option');
    optionEl.value = car.id.toString();
    optionEl.textContent = `${car.brand} ${car.model}`;
    carSelectEl.appendChild(optionEl);
  }
}

function initStatusOption() {
  const statusSelectEl = document.getElementById('bookingFilterStatus');

  if (!statusSelectEl) {
    return;
  }

  statusSelectEl.append(...generateStatusOptionEls(true));
}

/**
 *
 * @param {Account[]} accounts
 */
function initAccounts(accounts) {
  const customerSelectEl = document.getElementById('bookingFilterCust');

  if (!customerSelectEl) {
    return;
  }

  for (const account of accounts) {
    const optionEl = document.createElement('option');
    optionEl.value = account.id;
    optionEl.textContent = account.name;
    customerSelectEl.appendChild(optionEl);
  }
}

function initAdminPage() {
  initCars();
  initStatusOption();
  initAccounts(accounts);
  renderBookingList();
}

initFromLocalStorage().then(() => initAdminPage());

/**
 *
 * @param {Event} [event]
 */
function renderBookingList(event) {
  event?.preventDefault();

  const bookingFilterFormEl = /** @type {HTMLFormElement} */ (
    document.getElementById('bookingFilter')
  );

  const bookingListResultEl = document.getElementById('bookingListResult');

  if (!bookingFilterFormEl || !bookingListResultEl) {
    return;
  }

  bookingListResultEl.innerHTML = '';

  const filterData = new FormData(bookingFilterFormEl);
  const userIdStr = /** @type {string} */ (filterData.get('userId'));
  const carIdStr = /** @type {string} */ (filterData.get('carId'));
  const statusStr = /** @type {string} */ (filterData.get('status'));

  const carId = parseInt(carIdStr);
  let totalCount = 0;
  let shownCount = 0;

  for (const booking of bookings) {
    totalCount++;
    if (!isNaN(carId) && carId !== -1 && carId !== booking.carId) {
      continue;
    }
    if (userIdStr !== '-1' && userIdStr !== booking.userId) {
      continue;
    }
    if (statusStr !== '' && statusStr !== booking.status) {
      continue;
    }
    /** @type {HTMLElement[]} */
    const addonElements = [];
    if (booking.status !== 'inspected' && booking.status !== 'refunded') {
      addonElements.push(
        createButton('Update', () => showUpdateBookingModel(booking, true)),
      );
    } else if (booking.comment) {
      const strongEl = document.createElement('strong');
      strongEl.textContent = booking.comment;
      const commentEl = document.createElement('p');
      commentEl.textContent = 'Comment: ';
      commentEl.appendChild(strongEl);
      addonElements.push(commentEl);
    }

    const bookingCard = renderBookingCard(booking, addonElements);
    if (bookingCard) {
      shownCount++;
      bookingListResultEl.appendChild(bookingCard);
    }
  }
}

/**
 *
 * @param {Booking} booking
 * @param {HTMLElement[]} addonElements
 */
function renderBookingCard(booking, addonElements) {
  const car = carListing.find(({ id }) => id === booking.carId);
  const user = accounts.find(({ id }) => id === booking.userId);

  if (!car || !user) {
    return null;
  }

  const card = document.createElement('div');
  card.className = 'card';
  card.setAttribute('data-status', booking.status);

  card.innerHTML = `
  <div class="card-title">
    <span>Booking ${booking.id}</span>
    <span>${BOOKING_STATUS_CONST[booking.status].label}</span>
  </div>
  <div class="card-content">
    <p>Customer: <strong>${user.name}</strong></p>
    <p>Car: <strong>${car.brand} ${car.model}</strong></p>
    <p>Checkout at:</p>
    <p class="indent"><strong>${dateFormatter.format(new Date(booking.checkedOutAt))}</strong></p>
    <p class="indent"><strong>${timeFormatter.format(new Date(booking.checkedOutAt))}</strong></p>
    <p>From: <strong>${dateFormatter.format(new Date(booking.dateTimeFrom))}</strong></p>
    <p>To: <strong>${dateFormatter.format(new Date(booking.dateTo))}</strong></p>
    <p>Subtotal: <strong>${currencyFormatter.format(booking.status === 'refunded' ? 0 : booking.total)}</strong></p>
    <p>Penalty: <strong>${currencyFormatter.format(booking.penalty ?? 0)}</strong></p>
  </div>`;

  let contentEl = card.querySelector('.card-content');

  if (addonElements && addonElements.length > 0) {
    for (const el of addonElements) {
      contentEl?.appendChild(el);
    }
  }

  if (booking.status) {
    const finalizedTotalEl = document.createElement('h2');
    finalizedTotalEl.textContent = `Total: ${currencyFormatter.format(booking.total + (booking.penalty ?? 0))}`;

    contentEl?.appendChild(finalizedTotalEl);
  }

  return card;
}

/**
 * @typedef {Booking & {penaltyStr?: string}} ExtendedBookingForAdminUpdate
 */

/**
 * @param {ExtendedBookingForAdminUpdate} booking
 * @param {boolean} triggerShowModal
 */
function showUpdateBookingModel(booking, triggerShowModal) {
  const dialogEl = /** @type {HTMLDialogElement} */ (
    document.getElementById('updateBookingDialog')
  );

  if (!dialogEl) {
    return;
  }

  /** @type {HTMLElement[]} */
  const formElements = [
    updateStatusFormField(booking),
    updatePenaltyFormField(booking),
    updateCommentFormField(booking),
    createButton('Save', () => {
      saveUpdateBooking(booking);
      dialogEl.close();
    }),
    createButton('Cancel', () => dialogEl.close(), 'btn-link'),
  ];

  if (booking.status === 'inspected') {
    const saveWarningDiv = document.createElement('div');
    saveWarningDiv.classList.add('formStatus');
    saveWarningDiv.innerHTML = `
      <p class="warning">Saving as "Inspected" will finalized this booking and charged the customer</p>
    `;
    formElements.splice(1, 0, saveWarningDiv);
  }

  if (booking.status === 'refunded') {
    const saveWarningDiv = document.createElement('div');
    saveWarningDiv.classList.add('formStatus');
    saveWarningDiv.innerHTML = `
      <p class="warning">Saving as "Refunded" will finalized this booking and refund the total (less penalty) the customer</p>
    `;
    formElements.splice(1, 0, saveWarningDiv);
  }

  let updateFormEl = document.createElement('form');
  updateFormEl.onsubmit = event => event.preventDefault();
  formElements.forEach(el => updateFormEl.appendChild(el));

  const cardEl = renderBookingCard(booking, [updateFormEl]);

  if (!cardEl) {
    return;
  }

  dialogEl.innerHTML = '';
  dialogEl.appendChild(cardEl);
  if (triggerShowModal) {
    dialogEl.showModal();
  }
}

function generateStatusOptionEls(withNone = false) {
  const optionEls = Object.entries(BOOKING_STATUS_CONST).map(
    ([value, { label }]) => {
      const optionEl = document.createElement('option');
      optionEl.value = value;
      optionEl.textContent = label;
      return optionEl;
    },
  );

  if (withNone) {
    const optionEl = document.createElement('option');
    optionEl.value = '';
    optionEl.textContent = 'None';
    return [optionEl, ...optionEls];
  }

  return optionEls;
}

/**
 * @param {ExtendedBookingForAdminUpdate} booking
 */
function updateStatusFormField(booking) {
  const labelEl = document.createElement('label');
  labelEl.setAttribute('for', 'updateStatus');
  labelEl.textContent = 'Status';

  const selectEl = document.createElement('select');
  selectEl.id = 'updateStatus';
  selectEl.name = 'status';
  selectEl.append(...generateStatusOptionEls());

  selectEl.value = booking.status;
  selectEl.onchange = () =>
    showUpdateBookingModel({ ...booking, status: selectEl.value }, false);

  const statusSelectField = document.createElement('div');
  statusSelectField.classList.add('formfield');
  statusSelectField.appendChild(labelEl);
  statusSelectField.appendChild(selectEl);

  return statusSelectField;
}

/**
 * @param {ExtendedBookingForAdminUpdate} booking
 */
function updateCommentFormField(booking) {
  const labelEl = document.createElement('label');
  labelEl.setAttribute('for', 'updateCommet');
  labelEl.textContent = 'Comment';

  const commentEl = document.createElement('input');
  commentEl.id = 'updateComment';
  commentEl.name = 'comment';
  commentEl.value = booking.comment ?? '';
  commentEl.onchange = () =>
    showUpdateBookingModel({ ...booking, comment: commentEl.value }, false);

  const commentField = document.createElement('div');
  commentField.classList.add('formfield');
  commentField.appendChild(labelEl);
  commentField.appendChild(commentEl);

  return commentField;
}

/**
 * @param {ExtendedBookingForAdminUpdate} booking
 */
function updatePenaltyFormField(booking) {
  const labelEl = document.createElement('label');
  labelEl.setAttribute('for', 'updatePenalty');
  labelEl.textContent = 'Penalty';

  const penaltyEl = document.createElement('input');
  penaltyEl.id = 'updatePenalty';
  penaltyEl.name = 'penalty';
  penaltyEl.value = booking.penaltyStr ?? booking.penalty?.toString() ?? '0';
  penaltyEl.type = 'number';
  penaltyEl.onchange = () =>
    showUpdateBookingModel({ ...booking, penaltyStr: penaltyEl.value }, false);

  const penaltyField = document.createElement('div');
  penaltyField.classList.add('formfield');
  penaltyField.appendChild(labelEl);
  penaltyField.appendChild(penaltyEl);

  return penaltyField;
}

/**
 * @param {string | null} label
 * @param {() => any} onclick
 */
function createButton(label, onclick, className = 'btn-primary') {
  const buttonEl = document.createElement('button');
  buttonEl.classList.add(className);
  buttonEl.onclick = () => onclick();
  buttonEl.textContent = label;
  buttonEl.type = 'button';
  return buttonEl;
}

/**
 * @param {ExtendedBookingForAdminUpdate} bookingForUpdate
 */
function saveUpdateBooking(bookingForUpdate) {
  const { penaltyStr, ...booking } = bookingForUpdate;
  if (penaltyStr) {
    const penalty = parseFloat(penaltyStr);
    if (!isNaN(penalty) && penalty > 0) {
      booking.penalty = penalty;
    }
  }

  if (booking.status === 'refunded') {
    booking.total = 0;
  }

  const indexToUpdate = bookings.findIndex(({ id }) => id === booking.id);
  if (indexToUpdate > -1) {
    bookings.splice(indexToUpdate, 1, booking);
  }

  saveToLocalStorage();
  renderBookingList();
}
