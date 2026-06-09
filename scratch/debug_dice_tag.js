
const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function debugDice() {
  const url = 'https://www.dice.com/jobs?q=Java&countryCode=US&page=1&pageSize=20&filters.postedDate=ONE';
  console.log(`Fetching: ${url}`);
  
  try {
    const html = await fetchUrl(url);
    console.log(`HTML Length: ${html.length}`);
    
    // Check various script tag patterns
    const patterns = [
      '<script id="__NEXT_DATA__"',
      '<script type="application/json" id="__NEXT_DATA__"',
      'id="__NEXT_DATA__"',
      '__NEXT_DATA__'
    ];
    
    for (const p of patterns) {
      const idx = html.indexOf(p);
      console.log(`Pattern "${p}" index: ${idx}`);
      if (idx !== -1) {
        console.log(`Snippet around "${p}": ${html.substring(idx - 10, idx + 100)}`);
      }
    }
  } catch (err) {
    console.error('Error fetching:', err);
  }
}

debugDice();
