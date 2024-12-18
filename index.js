const { chromium } = require('playwright');

async function scrape() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // Configure page to handle potential loading issues
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    try {
        await page.goto('https://food.ndtv.com/news', { 
            waitUntil: 'domcontentloaded' 
        });

        // Handle popup more efficiently
        const closeSelector = 'a.npop-btn.npop-btn_br.trigger.js-npop-btn';
        await page.evaluate((selector) => {
            const popupClose = document.querySelector(selector);
            if (popupClose) popupClose.click();
        }, closeSelector);

        // Use page.evaluate to extract links in one go
        const links = await page.evaluate((containerId) => {
            const container = document.querySelector(containerId);
            if (!container) return [];

            return Array.from(container.querySelectorAll('.lst-pg-a-li .lst-pg-a .lst-pg_img'))
                .map(a => a.href)
                .filter(href => href && href.startsWith('http'));
        }, '#article_container');

        console.log(`Found ${links.length} links`);

        // Process links with concurrency and error handling
        for (const href of links.slice(0, 5)) { // Limit to first 5 for testing
            try {
                console.log(`Processing: ${href}`);

                // Navigate to link
                await page.goto(href, { 
                    waitUntil: 'domcontentloaded' 
                });

                // Extract basic content
                const pageContent = await page.evaluate(() => ({
                    title: document.title,
                    description: document.querySelector('meta[name="description"]')?.content || '',
                    firstParagraph: document.querySelector('p')?.innerText || '',
                    news: Array.from(document.querySelectorAll('.sp_only-ul-ol p'))
                    .map(p => p.innerText)
                    .filter(text => text.trim() !== '')
                }));

                console.log('Page Details:', pageContent);

                // Optional: Add small delay between requests
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

scrape().catch(console.error);