import fs from 'fs';
import puppeteer from 'puppeteer';

const words = fs.readFileSync('words_alpha.txt', 'utf-8')
  .split('\n')
  .map(w => w.trim())
  .filter(w => w.length === 4);

const BASE_URL = 'https://testnet.d3.app/search?query=';

const delay = ms => new Promise(res => setTimeout(res, ms));

const checkAvailability = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const results = [];

  for (const word of words) {
    const url = BASE_URL + word;
    await page.goto(url, { waitUntil: 'networkidle2' });

    const isAvailable = await page.evaluate(() => {
      const el = document.querySelector('button'); // tombol "register" biasanya muncul jika domain tersedia
      return el && el.textContent.toLowerCase().includes('register');
    });

    if (isAvailable) {
      console.log(`✅ Available: ${word}.doma`);
      results.push(word);
    } else {
      console.log(`❌ Taken: ${word}`);
    }

    await delay(1000); // hindari diblokir
  }

  fs.writeFileSync('available_domains.txt', results.join('\n'));
  await browser.close();
};

checkAvailability();
