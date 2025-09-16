function getAmazonBookInfo() {
  let title = null;
  let isbn = null;

  // Try multiple selectors for title (Amazon changes these frequently)
  const titleSelectors = [
    '#productTitle',
    '[data-cy="product-title"]',
    '.product-title',
    'h1[data-automation-id="title"]',
    'h1.a-size-large'
  ];

  for (const selector of titleSelectors) {
    const titleElement = document.querySelector(selector);
    if (titleElement) {
      title = titleElement.innerText.trim();
      break;
    }
  }

  // Try multiple approaches for ISBN
  // Method 1: Look in detail bullets
  const detailBullets = document.querySelectorAll('#detailBullets_feature_div li, #detailBulletsWrapper_feature_div li');
  for (const bullet of detailBullets) {
    const text = bullet.innerText;
    if (text.includes('ISBN-13') || text.includes('ISBN')) {
      const match = text.match(/ISBN[-\s]*13?[:\s]*([0-9\-\s]+)/i);
      if (match) {
        isbn = match[1].replace(/[\u200E\u200F\u202A-\u202E\s-]/g, "");
        break;
      }
    }
  }

  // Method 2: Look in product details table
  if (!isbn) {
    const detailRows = document.querySelectorAll('[data-feature-name="detailBullets"] tr, .prodDetTable tr');
    for (const row of detailRows) {
      const text = row.innerText;
      if (text.includes('ISBN-13') || text.includes('ISBN')) {
        const match = text.match(/ISBN[-\s]*13?[:\s]*([0-9\-\s]+)/i);
        if (match) {
          isbn = match[1].replace(/[\u200E\u200F\u202A-\u202E\s-]/g, "");
          break;
        }
      }
    }
  }

  // Method 3: Look for ISBN anywhere in the page as fallback
  if (!isbn && title) {
    const bodyText = document.body.innerText;
    const isbnMatch = bodyText.match(/ISBN[-\s]*13?[:\s]*([0-9]{13})/i);
    if (isbnMatch) {
      isbn = isbnMatch[1];
    }
  }

  return { title, isbn };
}

function getGoodreadsBookInfo() {
  let title = null;
  let isbn = null;
  let author = null;

  // Get title from Goodreads
  const titleSelectors = [
    '[data-testid="bookTitle"]',
    'h1[data-testid="bookTitle"]',
    '.BookPageTitleSection__title h1',
    '#bookTitle',
    'h1.gr-h1--serif',
    'h1[itemprop="name"]'
  ];

  for (const selector of titleSelectors) {
    const titleElement = document.querySelector(selector);
    if (titleElement) {
      title = titleElement.innerText.trim();
      break;
    }
  }

  // Get author from Goodreads
  const authorSelectors = [
    '[data-testid="name"]',
    '.ContributorLink__name',
    '.BookPageMetadataSection__contributor a',
    '.authorName span',
    '[itemprop="author"]',
    'span[itemprop="author"] a',
    '.ContributorLink a'
  ];

  for (const selector of authorSelectors) {
    const authorElement = document.querySelector(selector);
    if (authorElement) {
      author = authorElement.innerText.trim();
      break;
    }
  }

  // Method 1: Try to extract ISBN from URL (most reliable for Goodreads)
  const url = window.location.href;
  const urlMatch = url.match(/\/book\/show\/(\d{13}|\d{10})/);
  if (urlMatch && urlMatch[1].length >= 10) {
    const possibleIsbn = urlMatch[1];
    // Check if it looks like an ISBN (starts with 978 or 979 for ISBN-13, or is 10 digits)
    if ((possibleIsbn.length === 13 && (possibleIsbn.startsWith('978') || possibleIsbn.startsWith('979'))) || 
        possibleIsbn.length === 10) {
      isbn = possibleIsbn;
    }
  }

  // Method 2: Look for ISBN in various detail sections
  const detailSelectors = [
    '.BookDetails .BookDetails__item',
    '[data-testid="bookDataBox"] div',
    '.BookPageMetadataSection div',
    '.FeaturedDetails div',
    '.EditionDetails div',
    '.DetailsLayoutRightParagraph div'
  ];

  if (!isbn) {
    for (const selector of detailSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.innerText || element.textContent;
        if (text && text.match(/isbn/i)) {
          const match = text.match(/ISBN[-\s]*1?3?[:\s]*([0-9]{10,13})/i);
          if (match) {
            isbn = match[1].replace(/[\u200E\u200F\u202A-\u202E\s-]/g, "");
            break;
          }
        }
      }
      if (isbn) break;
    }
  }

  // Method 3: Look in meta tags
  if (!isbn) {
    const metaTags = document.querySelectorAll('meta[property*="isbn"], meta[name*="isbn"], meta[content*="isbn"]');
    for (const meta of metaTags) {
      const content = meta.getAttribute('content') || meta.getAttribute('value');
      if (content) {
        const match = content.match(/([0-9]{10,13})/);
        if (match) {
          isbn = match[1];
          break;
        }
      }
    }
  }

  // Method 4: Look in JSON-LD structured data
  if (!isbn) {
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent);
        if (data.isbn) {
          isbn = data.isbn.replace(/[\u200E\u200F\u202A-\u202E\s-]/g, "");
          break;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }

  // Method 5: Broad search in page content as last resort
  if (!isbn && title) {
    const bodyText = document.body.innerText;
    const isbnMatch = bodyText.match(/ISBN[-\s]*1?3?[:\s]*([0-9]{10,13})/i);
    if (isbnMatch) {
      isbn = isbnMatch[1].replace(/[\u200E\u200F\u202A-\u202E\s-]/g, "");
    }
  }

  // Method 6: Try to find ISBN in data attributes
  if (!isbn) {
    const elementsWithData = document.querySelectorAll('[data-book-id], [data-isbn], [data-resource-id]');
    for (const element of elementsWithData) {
      const bookId = element.getAttribute('data-book-id') || element.getAttribute('data-isbn') || element.getAttribute('data-resource-id');
      if (bookId && bookId.match(/^[0-9]{10,13}$/)) {
        isbn = bookId;
        break;
      }
    }
  }

  console.log('Goodreads extraction:', { title, author, isbn, url: window.location.href });
  return { title, isbn, author };
}

function getBookInfo() {
  let bookData = { title: null, isbn: null, author: null, site: null };
  
  const hostname = window.location.hostname;
  
  if (hostname.includes('amazon.com')) {
    const amazonData = getAmazonBookInfo();
    bookData = { ...amazonData, site: 'amazon' };
  } else if (hostname.includes('goodreads.com')) {
    const goodreadsData = getGoodreadsBookInfo();
    bookData = { ...goodreadsData, site: 'goodreads' };
  }

  // Store the book data
  chrome.storage.local.set({
    bookTitle: bookData.title,
    isbn: bookData.isbn,
    author: bookData.author,
    site: bookData.site
  });

  console.log('Book info extracted:', bookData);
}

// Run when page loads
window.addEventListener("load", getBookInfo);

// Also run when URL changes (for single-page app navigation)
let currentUrl = location.href;
new MutationObserver(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    setTimeout(getBookInfo, 1000); // Wait a bit for content to load
  }
}).observe(document, { subtree: true, childList: true });