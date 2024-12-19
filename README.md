# Web Scraping Adventure with Playwright

Welcome to the world of web scraping! Here, you'll witness how we interact with the web programmatically, harvest data, and dive deep into automation. Below is an exciting journey of what has been accomplished so far:

---

## **What is Web Scraping?**
Web scraping is the art of extracting data from websites. Think of it as a robot browsing the internet, clicking on links, fetching information, and even downloading images for you. And guess what? You're the master behind the curtain!

---

## **Setup**
We chose **Playwright**, a powerful Node.js library for browser automation. It allows you to control Chromium, Firefox, and WebKit browsers in headless or full UI mode. The adventure begins with setting up:

```bash
npm install playwright
```

---

## **Current Achievements**

### 1. **Closing Popups Like a Ninja**
Websites often bombard you with popups. Not anymore! Our script detects those sneaky popups and closes them seamlessly, using Playwright's precise click functions.

```javascript
const closeSelector = 'a.npop-btn.npop-btn_br.trigger.js-npop-btn';
try {
    await page.click(closeSelector);
    console.log('Closed popup.');
} catch {
    console.log('No popup to close.');
}
```

### 2. **Extracting Links from News Pages**
We navigated to the NDTV Food News page and extracted all article links. With a simple query, the script pulls every valid URL from the specified container:

```javascript
const links = await page.evaluate((containerId) => {
    const container = document.querySelector(containerId);
    if (!container) return [];

    return Array.from(container.querySelectorAll('a'))
        .map(a => a.href)
        .filter(href => href && href.startsWith('http'));
}, '#article_container');
```

### 3. **Navigating and Scraping Each News Article**
The script visits each news link, extracts the title, and lists the images found on the page. It handles navigation, waits for the content to load, and fetches details efficiently.

```javascript
const newsContent = await page.evaluate(() => {
    const title = document.querySelector('h1')?.innerText || 'Untitled';
    const imageElements = Array.from(document.querySelectorAll('img'));
    const images = imageElements.map(img => img.src).filter(src => src);
    return { title, images };
});
```

### 4. **Downloading Images and Organizing Them**
Here comes the most satisfying part: downloading images! Each news article gets its own folder named after its title. Inside, all the images related to that article are stored.

```javascript
const newsFolder = path.join(__dirname, 'news', sanitizeFileName(newsContent.title));
if (!fs.existsSync(newsFolder)) {
    fs.mkdirSync(newsFolder, { recursive: true });
}

for (let i = 0; i < newsContent.images.length; i++) {
    const imageUrl = newsContent.images[i];
    const imagePath = path.join(newsFolder, `image_${i + 1}.jpg`);
    await downloadImage(imageUrl, imagePath);
}
```

---

## **Tools and Techniques Used**
1. **Playwright:** For browser automation and scraping.
2. **Node.js:** Our scripting powerhouse.
3. **FS (File System):** To create directories and save files.
4. **HTTPS Module:** For downloading images securely.
5. **Error Handling:** Graceful fallback for unexpected issues.

---

## **What Have I Learned?**
- **Navigating the DOM:** Using selectors to extract data.
- **Popup Handling:** How to manage those annoying interruptions.
- **Dynamic Navigation:** Visiting multiple pages programmatically.
- **Data Extraction:** Fetching text, links, and images from websites.
- **File Organization:** Creating structured directories and saving content.

---

## **Next Steps**
The journey doesn't stop here! Here's what's next on my roadmap:
- **Handling Pagination:** Scraping data from multiple pages.
- **Interacting with Forms:** Automating login and data submission.
- **Advanced Image Processing:** Resizing or tagging images after download.
- **Data Storage:** Saving extracted data in databases like MongoDB or PostgreSQL.
- **Building an API:** Serving scraped data to other applications.