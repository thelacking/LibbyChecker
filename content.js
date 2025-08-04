function getBookInfo() {
  const isbnElement = Array.from(document.querySelectorAll("#detailBullets_feature_div li span"))
    .find(el => el.innerText.includes("ISBN-13"));

  const title = titleElement ? titleElement.innerText.trim() : null;
  let isbn = isbnElement ? isbnElement.innerText.split(":")[1].trim() : null;

  // remove dashes, invisible characters, and spaces
  if (isbn) {
    isbn = isbn.replace(/[\u200E\u200F\u202A-\u202E\s-]/g, "");
  }

  chrome.storage.local.set({ bookTitle: title, isbn: isbn });
}

window.addEventListener("load", getBookInfo);