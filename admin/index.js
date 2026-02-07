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

initFromLocalStorage(function main(data) {
  const { accounts } = data;

  initCars();
  initAccounts(accounts);
});
