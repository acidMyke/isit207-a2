/**
 * @typedef {Object} Account
 * @property {String} name
 * @property {String} email
 * @property {String} password
 */

/** @type {Account[]} */
const accounts = [];

/** @type {Account | null} */
const currentAccount = null;

/**
 *
 * @param {SubmitEvent} event
 */
function processLogin(event) {
  if (!event || !event.target) return;
  event.preventDefault();
  const data = new FormData(event.target);
  const namail = data.get('namail');
  const password = data.get('password');
}

/**
 *
 * @param {SubmitEvent} event
 */
function processSignUp(event) {
  if (!event || !event.target) return;
  event.preventDefault();
  const data = new FormData(event.target);
  const name = data.get('name');
  const email = data.get('email');
  const password = data.get('password');
}
