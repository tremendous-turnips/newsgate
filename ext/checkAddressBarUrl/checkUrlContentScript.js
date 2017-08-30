////////////////////////////////////////////////////////////////////////////////
// CONTENT SCRIPT
// Listens for messages from the background script for whether the site loaded
// is a fake site or not. Create an alert banner or render the dom depending.
////////////////////////////////////////////////////////////////////////////////
chrome.runtime.onMessage.addListener(function(message) {
  
  if ( message.fake ) {
    alertFakeSite(message.urlObj.rating.type);
  }
});

chrome.runtime.onMessage.addListener(function(message) {
  if ( message.action === 'refresh' ) {
    console.log('Refreshing theme css');
    renderDom();
  } else if ( message.action === 'removeThemeCSS' ) {
    console.log('Resetting theme css');
    // removeThemeCSS();
  }
});

