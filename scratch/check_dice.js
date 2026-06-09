
// Using built-in fetch (Node 18+)

async function checkDice() {
  const url = 'https://www.dice.com/jobs?q=Software+Engineer&countryCode=US&page=1&pageSize=20&filters.postedDate=ONE';
  console.log(`Fetching: ${url}`);
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    }
  });
  
  const html = await res.text();
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  
  if (!nextDataMatch) {
    console.log('No __NEXT_DATA__ found');
    return;
  }
  
  const nextData = JSON.parse(nextDataMatch[1]);
  const searchResults = nextData.props?.pageProps?.initialState?.search?.searchResults;
  
  if (searchResults) {
    console.log('Found searchResults');
    console.log('Keys:', Object.keys(searchResults));
    console.log('Total Elements:', searchResults.totalElements);
    console.log('Total Pages:', searchResults.totalPages);
    console.log('Content Length:', searchResults.content?.length);
    if (searchResults.content?.length > 0) {
      console.log('Example Content Item Keys:', Object.keys(searchResults.content[0]));
    }
  } else {
    console.log('searchResults not found in the expected path');
    // Log top level keys to find the right path
    console.log('Props keys:', Object.keys(nextData.props || {}));
    if (nextData.props?.pageProps) console.log('PageProps keys:', Object.keys(nextData.props.pageProps));
  }
}

checkDice();
