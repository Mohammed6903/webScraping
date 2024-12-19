const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

async function scrape() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    try {
        await page.goto('https://food.ndtv.com/news', { 
            waitUntil: 'domcontentloaded' 
        });

        const closeSelector = 'a.npop-btn.npop-btn_br.trigger.js-npop-btn';
        await page.evaluate((selector) => {
            const popupClose = document.querySelector(selector);
            if (popupClose) popupClose.click();
        }, closeSelector);

        const links = await page.evaluate((containerId) => {
            const container = document.querySelector(containerId);
            if (!container) return [];

            return Array.from(container.querySelectorAll('.lst-pg-a-li .lst-pg-a .lst-pg_img'))
                .map(a => a.href)
                .filter(href => href && href.startsWith('http'));
        }, '#article_container');

        console.log(`Found ${links.length} links`);

        for (const href of links) {
            try {
                console.log(`Processing: ${href}`);

                await page.goto(href, { 
                    waitUntil: 'domcontentloaded' 
                });

                const newsContent = await page.evaluate(() => {
                    const title = document.title;
                    const description = document.querySelector('meta[name="description"]')?.content || '';
                    const firstParagraph = document.querySelector('p')?.innerText || '';
                    const news = Array.from(document.querySelectorAll('.sp_only-ul-ol p'))
                    .map(p => p.innerText)
                    .filter(text => text.trim() !== '');
                    const imageElements = Array.from(document.querySelectorAll('picture img'));
                    const images = imageElements.map(img => img.src).filter(src => src);
                    return { title, images, news, firstParagraph, description };
                });

                console.log('Page Details:', newsContent);

                const newsFolder = path.join(__dirname, 'news', sanitizeFileName(newsContent.title));
                if (!fs.existsSync(newsFolder)) {
                    fs.mkdirSync(newsFolder, { recursive: true });
                }

                // Download images
                for (let i = 0; i < newsContent.images.length; i++) {
                    const imageUrl = newsContent.images[i];
                    const imagePath = path.join(newsFolder, `image_${i + 1}.jpg`);
                    try {
                        await downloadImage(imageUrl, imagePath);
                        console.log(`Downloaded: ${imagePath}`);
                    } catch (error) {
                        console.error(`Failed to download ${imageUrl}:`, error.message);
                    }
                }

                await page.waitForTimeout(500);
            } catch (error) {
                console.error(`Error processing ${href}:`, error.message);
            }
        }
    } catch (error) {
        console.error('Scraping failed:', error);
    } finally {
        await browser.close();
    }
}

async function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filename);
        const request = https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            } else {
                reject(`Failed to get image: ${response.statusCode}`);
            }
        });

        request.on('error', (err) => {
            fs.unlink(filename, () => reject(err));
        });
    });
}

function sanitizeFileName(name) {
    return name.replace(/[^a-z0-9_\-]/gi, '_').toLowerCase();
}

scrape().catch(console.error);