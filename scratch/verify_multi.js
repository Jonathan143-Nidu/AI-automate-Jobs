
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
  let depth = 0;
  let i = openPos;
  while (i < str.length) {
    const c = str[i];
    if (c === '"') {
      i++;
      while (i < str.length) {
        if (str[i] === '\\') { i += 2; }
        else if (str[i] === '"') { i++; break; }
        else { i++; }
      }
    } else if (c === '{') { depth++; i++; }
    else if (c === '}') {
      depth--;
      if (depth === 0) { try { return JSON.parse(str.substring(openPos, i + 1)); } catch { return null; } }
      i++;
    } else { i++; }
  }
  return null;
}

function testQuery(keyword) {
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
        const scriptParts = html.split('<script>');
        let found = false;
        for (let i = 1; i < scriptParts.length; i++) {
          const closeIdx = scriptParts[i].indexOf('</script>');
          const raw = closeIdx !== -1 ? scriptParts[i].substring(0, closeIdx) : scriptParts[i];
          const decoded = decodeRSCBlock(raw);
          if (!decoded) continue;
          if (!decoded.includes('"jobList"') || !decoded.includes('"totalResults"')) continue;

          const jlStart = decoded.indexOf('"jobList":');
          const jlOpen = decoded.indexOf('{', jlStart + 10);
          const jlObj = extractBalancedObject(decoded, jlOpen);
          const jobs = jlObj?.data || [];

          const metaStart = decoded.indexOf('"meta":', jlStart);
          const metaOpen = decoded.indexOf('{', metaStart + 7);
          const meta = extractBalancedObject(decoded, metaOpen);

          console.log(`✅ "${keyword}" — ${jobs.length} jobs, total: ${meta?.totalResults || '?'}, pages: ${meta?.pageCount || '?'}`);
          if (jobs[0]) console.log(`   First: "${jobs[0].title}" @ ${jobs[0].companyName}`);
          found = true;
          break;
        }
        if (!found) console.log(`❌ "${keyword}" — Could not extract job data`);
        resolve();
      });
    });
    req.on('error', err => { console.error('Error:', err.message); resolve(); });
    req.end();
  });
}

(async () => {
  await testQuery('Java');
  await testQuery('Azure cloud engineer');
  await testQuery('React Developer');
  await testQuery('AWS Solutions Architect');
})();
