import fs from 'fs/promises';
import fetch from 'node-fetch';

const WORDLIST_FILE = 'words_alpha.txt';
const TLDs = ['io', 'shib', 'ape', 'ai', 'com', 'football'];
const API_URL = 'https://api-pre.d3.app/graphql';
const BATCH_SIZE = 6;

const buildPayload = (words) => {
  const nameDescriptors = [];

  for (const word of words) {
    for (const tld of TLDs) {
      nameDescriptors.push({ sld: word, tld });
    }
  }

  return {
    query: `
      query searchDomains($names: [NameDescriptorInput!]!) {
        searchDomains(names: $names) {
          items {
            sld
            tld
            available
          }
        }
      }
    `,
    variables: {
      names: nameDescriptors,
    },
    operationName: 'searchDomains',
  };
};

const checkDomains = async (words) => {
  const results = [];

  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE);
    const payload = buildPayload(batch);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      const items = json?.data?.searchDomains?.items || [];

      for (const item of items) {
        const { sld, tld, available } = item;
        const domain = `${sld}.${tld}`;
        if (available) {
          console.log(`✅ Available: ${domain}`);
          await fs.appendFile('available.txt', `${domain}\n`);
          results.push(domain);
        } else {
          console.log(`❌ Not available: ${domain}`);
        }
      }

    } catch (error) {
      console.error(`⚠️ Error checking batch: ${error.message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 500)); // optional delay
  }

  return results;
};

const main = async () => {
  console.log('🚀 Loading wordlist...');
  const raw = await fs.readFile(WORDLIST_FILE, 'utf-8');
  const words = raw
    .split('\n')
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length === 4 && /^[a-z]+$/.test(w));

  console.log(`🧠 Total 4-letter words to check: ${words.length}`);
  await fs.writeFile('available.txt', ''); // reset file

  await checkDomains(words);
};

main();
