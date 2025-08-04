chrome.storage.local.get(["bookTitle", "isbn"], ({ bookTitle, isbn }) => {
  const status = document.getElementById("status");
  const result = document.getElementById("result");

  if (!bookTitle && !isbn) {
    status.innerText = "No book info found.";
    return;
  }

  const query = isbn ? isbn : bookTitle;
  const libbySearchUrl = `https://sdcl.overdrive.com/search?query=${encodeURIComponent(query)}`;

  status.innerText = "Book info found:";
  result.innerHTML = `<a href="${libbySearchUrl}" target="_blank">Search Libby for "${query}"</a>`;
});