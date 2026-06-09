
const https = require('https');

const params = new URLSearchParams({
  q: 'Java',
  countryCode: 'US',
  page: '1',
  pageSize: '20',
  'filters.postedDate': 'ONE',
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
    const pushMatches = [...html.matchAll(/self\.__next_f\.push\(\[([\d]+),("[\s\S]*?")\]\)/g)];
    
    for (const m of pushMatches) {
      let decoded = '';
      try { decoded = JSON.parse(m[2]); } catch(e) { continue; }
      
      if (decoded.includes('"totalResults"') && decoded.includes('"jobList"')) {
        console.log('Found the MAIN data chunk!\n');
        
        // Find jobList
        const jobListIdx = decoded.indexOf('"jobList"');
        const snippet = decoded.substring(jobListIdx, jobListIdx + 3000);
        console.log('jobList structure:\n', snippet);
        
        // Find meta/pagination
        const metaIdx = decoded.indexOf('"currentPage"');
        if (metaIdx !== -1) {
          console.log('\nmeta snippet:', decoded.substring(metaIdx - 10, metaIdx + 200));
        }
        
        const pageCountIdx = decoded.indexOf('"pageCount"');
        if (pageCountIdx !== -1) {
          console.log('\npageCount snippet:', decoded.substring(pageCountIdx - 10, pageCountIdx + 200));
        }
        
        break;
      }
    }
  });
});
req.on('error', err => console.error(err));
req.end();
