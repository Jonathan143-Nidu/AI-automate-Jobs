
const fs = require('fs');
const html = fs.readFileSync('scratch/dice_search_raw.html', 'utf8');

console.log('Searching for job data in HTML...');

// Look for 'searchResults' or 'totalElements' in the whole file
const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
if (nextDataMatch) {
  console.log('Found __NEXT_DATA__ script!');
} else {
  console.log('__NEXT_DATA__ NOT found. Searching for alternative patterns...');
}

// Search for strings that look like they could be the job listings
const searchPatterns = [
  '\"searchResults\"',
  '\"totalElements\"',
  '\"content\"',
  '\"q\":\"Java\"'
];

searchPatterns.forEach(p => {
  const i = html.indexOf(p.replace(/\\/g, ''));
  if (i !== -1) {
    console.log(`Found pattern ${p} at index ${i}`);
    console.log('Context:', html.substring(i - 100, i + 500));
  } else {
    const rawP = p.replace(/\\"/g, '"').replace(/"/g, '');
    const rawI = html.indexOf(rawP);
    if (rawI !== -1) {
        console.log(`Found raw pattern ${rawP} at index ${rawI}`);
        console.log('Context:', html.substring(rawI - 100, rawI + 500));
    }
  }
});

// Check if it's Next.js streaming format (self.__next_f.push)
const nextFMatch = html.match(/self\.__next_f\.push\(\[1,\"([^\"]*)\"\]\)/g);
if (nextFMatch) {
  console.log(`Found ${nextFMatch.length} self.__next_f.push calls`);
}
