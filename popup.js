chrome.storage.local.get(["bookTitle", "isbn", "author", "site"], ({ bookTitle, isbn, author, site }) => {
  const status = document.getElementById("status");
  const result = document.getElementById("result");

  // Debug info
  console.log('Popup received:', { bookTitle, isbn, author, site });

  if (!bookTitle && !isbn) {
    status.innerText = "No book info found on this page.";
    result.innerHTML = `<p>Make sure you're on a book page on Amazon or Goodreads.</p>
      <details>
        <summary>Debug Info</summary>
        <small>Title: ${bookTitle || 'Not found'}<br>
        ISBN: ${isbn || 'Not found'}<br>
        Author: ${author || 'Not found'}<br>
        Site: ${site || 'Unknown'}</small>
      </details>`;
    return;
  }

  // Prioritize ISBN search, fallback to title only if no ISBN
  let query = '';
  let displayInfo = '';
  let searchType = '';

  if (isbn && isbn.length >= 10) {
    query = isbn;
    displayInfo = `ISBN: ${isbn}`;
    searchType = 'ISBN';
  } else if (bookTitle) {
    query = bookTitle;
    displayInfo = `"${bookTitle}"`;
    if (author) {
      displayInfo += ` by ${author}`;
    }
    searchType = 'Title';
  } else {
    status.innerText = "No searchable book information found.";
    return;
  }

  // Create Libby search URL (you can change the library system here)
  const libbySearchUrl = `https://sdcl.overdrive.com/search?query=${encodeURIComponent(query)}`;
  
  // Also create a general OverDrive search for users with different library systems
  const overdriveSearchUrl = `https://www.overdrive.com/search?q=${encodeURIComponent(query)}`;

  status.innerText = `Found ${site === 'amazon' ? 'Amazon' : 'Goodreads'} book:`;
  
  result.innerHTML = `
    <div class="book-info">
      <p><strong>${displayInfo}</strong></p>
      <p class="search-type">Searching by: ${searchType}</p>
      <div class="search-links">
        <a href="${libbySearchUrl}" target="_blank" class="primary-link">🔍 Search San Diego Library</a>
        <br><br>
        <a href="${overdriveSearchUrl}" target="_blank" class="secondary-link">🔍 Search Other Libraries</a>
      </div>
      <div class="instructions">
        <p><small>${searchType === 'ISBN' ? 'ISBN searches are most accurate and will find exact editions.' : 'No ISBN found - searching by title. Results may include different editions.'}</small></p>
        <p><small>Don't have San Diego Library? Click "Search Other Libraries" and select your local library system.</small></p>
      </div>
      ${searchType === 'Title' ? `
        <details class="debug-info">
          <summary>Why no ISBN?</summary>
          <small>ISBN not found on this ${site} page. This can happen if:<br>
          • The book page doesn't display ISBN publicly<br>
          • The page layout changed recently<br>
          • This is a preview/sample page<br>
          Searching by title will still work, but may show multiple editions.</small>
        </details>
      ` : ''}
    </div>
  `;
});