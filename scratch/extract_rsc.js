
const fs = require('fs');
const html = fs.readFileSync('scratch/dice_search_raw.html', 'utf8');

console.log('Attempting to extract data from self.__next_f.push calls...');

// Regex to find the JSON-like strings inside self.__next_f.push calls
// They look like: self.__next_f.push([1,"..."])
const matches = html.matchAll(/self\.__next_f\.push\(\[1,\"([\s\S]*?)\"\]\)/g);

let fullPayload = '';
for (const match of matches) {
  let fragment = match[1];
  // Unescape common characters in these strings
  fragment = fragment.replace(/\\n/g, '\n').replace(/\\\"/g, '\"').replace(/\\\\/g, '\\');
  fullPayload += fragment;
}

console.log(`Extracted payload length: ${fullPayload.length}`);

// Now search for the searchResults JSON in the full payload
// It usually starts with something like : ["searchResults", ...
const resultsIndex = fullPayload.indexOf('\"searchResults\"');
if (resultsIndex !== -1) {
  console.log('Found "searchResults" in payload at:', resultsIndex);
  const snippet = fullPayload.substring(resultsIndex - 20, resultsIndex + 2000);
  console.log('Snippet:', snippet);
  
  // Try to find the "content" array which contains the jobs
  const contentIndex = snippet.indexOf('\"content\"');
  if (contentIndex !== -1) {
      console.log('Found "content" in snippet!');
  }
} else {
  console.log('Could not find "searchResults" in self.__next_f.push payload');
  // Try finding just "totalElements"
  if (fullPayload.includes('totalElements')) {
      console.log('Found "totalElements" in payload!');
  }
}
