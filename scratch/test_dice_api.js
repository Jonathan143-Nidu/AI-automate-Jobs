
const https = require('https');

const params = new URLSearchParams();
params.set('q', 'Java');
params.set('countryCode', 'US');
params.set('page', '1');
params.set('pageSize', '5');
params.set('fj', 'true');
params.set('includeRemote', 'true');
params.set('radius', '30');
params.set('radiusUnit', 'mi');
params.set('facets', 'employmentType|postedDate|workplaceTypes|easyApply|isRemote|willingToSponsor');
params.set('fields', 'id|guid|summary|title|postedDate|jobLocation|detailsPageUrl|salary|companyLogoUrl|companyName|employmentType|workplaceTypes|isRemote|easyApply|willingToSponsor');
params.set('filters.postedDate', 'ONE');
params.set('filters.workplaceTypes', '');
params.set('recommendations', 'true');

const url = `https://www.dice.com/v1/dice/jobs/search?${params.toString()}`;
console.log('Calling:', url);

const req = https.request({
  hostname: 'www.dice.com',
  path: '/v1/dice/jobs/search?' + params.toString(),
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.dice.com/jobs',
    'Origin': 'https://www.dice.com',
    'X-Requested-With': 'XMLHttpRequest',
  }
}, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
  
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    if (res.headers['content-type']?.includes('application/json')) {
      const json = JSON.parse(data);
      console.log('Keys:', Object.keys(json));
      console.log('Jobs:', json.content?.length || json.data?.length || 0);
      if (json.content?.[0]) {
        console.log('First job:', json.content[0].title, '|', json.content[0].companyName);
      }
    } else {
      console.log('Response preview (first 200):', data.substring(0, 200));
    }
  });
});

req.on('error', err => console.error('Request error:', err));
req.end();
