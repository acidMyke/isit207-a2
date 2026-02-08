//@ts-check

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

localStorageInitPromise.then(() => renderBookingHistory());

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

  if (booking.status === 'reserved' || booking.status === 'collected') {
    const label = booking.status === 'reserved' ? 'Pickup at ' : 'Return to ';
    const linkEl = getGoogleMapsLinkElement(booking.placeId, label);
    linkEl && contentEl?.appendChild(linkEl);
  }

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
 * @param {string} placeId
 * @param {string} label
 */
function getGoogleMapsLinkElement(placeId, label) {
  const place = OFFICE_PLACES.find(p => p.id === placeId);
  if (!place) {
    return null;
  }
  const linkEl = document.createElement('a');
  linkEl.href = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
  linkEl.target = '_blank';
  linkEl.rel = 'noopener noreferrer';
  linkEl.textContent = label + place.name;
  return linkEl;
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
