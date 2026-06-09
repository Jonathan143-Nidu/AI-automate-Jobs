
const fs = require('fs');
const html = fs.readFileSync('scratch/dice_search_raw.html', 'utf8');

// The data in Next.js App Router streaming is often in <script> tags with hex IDs or self.__next_f.push
// We need to find the one that contains 'searchResults' and is large.

const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
console.log(`Analyzing ${scripts.length} script tags...`);

for (let i = 0; i < scripts.length; i++) {
  const s = scripts[i];
  if (s.includes('searchResults') || s.includes('totalElements') || s.includes('\"title\":\"')) {
    console.log(`\n--- Script ${i} (${s.length} chars) ---`);
    if (s.length < 2000) {
      console.log(s);
    } else {
      // Find the "content" or "searchResults" part
      const searchResultsIndex = s.indexOf('searchResults');
      if (searchResultsIndex !== -1) {
        console.log('Snippet around searchResults:');
        console.log(s.substring(searchResultsIndex - 50, searchResultsIndex + 500));
      } else {
        console.log('Snippet start:', s.substring(0, 500));
        console.log('Snippet end:', s.substring(s.length - 500));
      }
    }
  }
}
