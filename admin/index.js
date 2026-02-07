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
