
const https = require('https');

const RSC_PREFIX = 'self.__next_f.push([1,"';
const RSC_SUFFIX = '"])';

function decodeRSCBlock(block) {
  const b = block.trim();
  if (!b.startsWith(RSC_PREFIX) || !b.endsWith(RSC_SUFFIX)) return null;
  const encoded = b.slice(RSC_PREFIX.length, b.length - RSC_SUFFIX.length);
  try { return JSON.parse('"' + encoded + '"'); } catch { return null; }
}

function extractBalancedObject(str, openPos) {
  let depth = 0, closePos = -1;
  for (let i = openPos; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') { depth--; if (depth === 0) { closePos = i + 1; break; } }
  }
  if (closePos === -1) return null;
  try { return JSON.parse(str.substring(openPos, closePos)); } catch { return null; }
}

function debugQuery(keyword) {
  return new Promise((resolve) => {
    const params = new URLSearchParams({
      q: keyword,
      countryCode: 'US',
      page: '1',
      pageSize: '20',
      'filters.postedDate': 'ONE',
      location: 'United States',
      latitude: '38.7945952',
      longitude: '-106.5348379',
      locationPrecision: 'Country',
    });

    const req = https.request({
      hostname: 'www.dice.com',
      path: '/jobs?' + params.toString(),
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,*/*',
      }
    }, (res) => {
      let html = '';
      res.on('data', c => html += c);
      res.on('end', () => {
        console.log(`\n--- Debugging: "${keyword}" ---`);
        const scriptParts = html.split('<script>');
        
        for (let i = 1; i < scriptParts.length; i++) {
          const closeIdx = scriptParts[i].indexOf('</script>');
          const raw = closeIdx !== -1 ? scriptParts[i].substring(0, closeIdx) : scriptParts[i];
          const decoded = decodeRSCBlock(raw);
          if (!decoded) continue;
          if (!decoded.includes('"jobList"')) continue;

          console.log(`Found chunk with "jobList" (${decoded.length} chars)`);

          // Check all jobList occurrences
          let searchPos = 0;
          let occurrence = 0;
          while (true) {
            const jlStart = decoded.indexOf('"jobList"', searchPos);
            if (jlStart === -1) break;
            occurrence++;
            
            const jlOpen = decoded.indexOf('{', jlStart + 9);
            if (jlOpen === -1) { searchPos = jlStart + 9; continue; }
            
            const jlObj = extractBalancedObject(decoded, jlOpen);
            if (jlObj) {
              console.log(`  jobList occurrence ${occurrence} at pos ${jlStart}:`);
              console.log(`    Keys: ${Object.keys(jlObj).join(', ')}`);
              if (jlObj.data !== undefined) {
                console.log(`    data.length: ${jlObj.data?.length ?? 'null'}`);
                if (jlObj.data?.length > 0) {
                  console.log(`    First job: "${jlObj.data[0].title}" @ ${jlObj.data[0].companyName}`);
                }
              }
            }
            searchPos = jlStart + 9;
          }

          // Show the raw snippet around the first jobList
          const jl = decoded.indexOf('"jobList"');
          console.log(`  Raw snippet around jobList:\n  ${decoded.substring(jl, jl + 150)}`);
          break;
        }
        resolve();
      });
    });
    req.on('error', err => { console.error('Error:', err.message); resolve(); });
    req.end();
  });
}

(async () => {
  await debugQuery('Azure cloud engineer');
})();
