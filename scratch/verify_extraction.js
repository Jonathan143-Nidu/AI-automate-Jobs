
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
    const rscRegex = /self\.__next_f\.push\(\[[\d]+,("[\s\S]*?")\]\)/g;
    let m;
    let jobList = [];
    let totalResults = 0, pageCount = 0, currentPage = 1;
    let found = false;

    while ((m = rscRegex.exec(html)) !== null) {
      let decoded;
      try { decoded = JSON.parse(m[1]); } catch { continue; }
      
      if (!decoded.includes('"jobList"') || !decoded.includes('"totalResults"')) continue;

      // Extract jobList object with bracket counting
      const jlKey = '"jobList":';
      const jlStart = decoded.indexOf(jlKey);
      const objStart = decoded.indexOf('{', jlStart + jlKey.length);
      let depth = 0, objEnd = -1;
      for (let i = objStart; i < decoded.length; i++) {
        if (decoded[i] === '{') depth++;
        else if (decoded[i] === '}') { depth--; if (depth === 0) { objEnd = i + 1; break; } }
      }
      
      const jlObj = JSON.parse(decoded.substring(objStart, objEnd));
      jobList = jlObj.data || [];

      // Extract meta
      const metaKey = '"meta":';
      const mStart = decoded.indexOf(metaKey, jlStart);
      if (mStart !== -1) {
        const mObjStart = decoded.indexOf('{', mStart + metaKey.length);
        let d2 = 0, mObjEnd = -1;
        for (let i = mObjStart; i < decoded.length; i++) {
          if (decoded[i] === '{') d2++;
          else if (decoded[i] === '}') { d2--; if (d2 === 0) { mObjEnd = i + 1; break; } }
        }
        const meta = JSON.parse(decoded.substring(mObjStart, mObjEnd));
        totalResults = meta.totalResults;
        pageCount = meta.pageCount;
        currentPage = meta.currentPage;
      }
      
      found = true;
      break;
    }

    if (!found) {
      console.log('❌ Could not extract job data');
      return;
    }

    console.log(`✅ Extraction successful!`);
    console.log(`   Jobs found: ${jobList.length}`);
    console.log(`   Total results: ${totalResults}`);
    console.log(`   Pages: ${pageCount}`);
    console.log(`   Current page: ${currentPage}`);
    if (jobList[0]) {
      const j = jobList[0];
      console.log(`   First job: "${j.title}" @ ${j.companyName}`);
      console.log(`   Location: ${j.jobLocation?.displayName}`);
      console.log(`   Workplace: ${JSON.stringify(j.workplaceTypes)}`);
      console.log(`   LogoUrl: ${j.companyLogoUrl ? 'YES' : 'No'}`);
    }
  });
});
req.on('error', err => console.error(err));
req.end();
