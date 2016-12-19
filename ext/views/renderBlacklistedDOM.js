////////////////////////////////////////////////////////////////////////////////
// CONTENT SCRIPT
// If the site loaded is not a fake site, renderDom checks each href in the
// DOM.
////////////////////////////////////////////////////////////////////////////////
MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

// CREATE THE PORT FOR THE SHORTLINKS
var port = chrome.runtime.connect({ name: 'shorts' });

$('a[href]').mouseover(function(event) {
  reference = $(event.target).attr('href');
  if (reference !== undefined) {
    chrome.runtime.sendMessage({text: 'sending element', href: reference}, function(response) {
    });
  }
});
// DEFINES THE SHORTS TO CHECK AGAINST
var shorts = {
    'bit.do': 'bit.do',
    'bit.ly': 'bit.ly',
    'cutt.us': 'cutt.us',
    'goo.gl': 'goo.gl',
    'ht.ly': 'ht.ly',
    'is.gd': 'is.gd',
    'ow.ly': 'ow.ly',
    'po.st': 'po.st',
    'tinyurl.com': 'tinyurl.com',
    'tr.im': 'tr.im',
    'trib.al': 'trib.al',
    'u.to': 'u.to',
    'v.gd': 'v.gd',
    'x.co': 'x.co'
  };
// SETS THE FUNCTION TO RUN ON OBSERVING CHANGE
var observer = new MutationObserver(renderDom);


//SETS WHAT TO OBSERVE WITH 'DOCUMENT' AND ITS 'CHILDLIST' AND 'SUBTREE' ELEMENTS
observer.observe(document, {
  childList: true,
  subtree: true,
  attributes: false
});

function renderDom() {
  observer.disconnect();
  // Inject themes.css into head of current website page
  var path = chrome.extension.getURL('styles/themes.css');
  $('head').append($('<link>')
      .attr("rel","stylesheet")
      .attr("type","text/css")
      .attr("href", path));

  observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: false
  });
  chrome.runtime.sendMessage({disabled: 'give'}, function(response) {
    if (!response.disabled) {
      renderBlacklist();
    } else {
      console.log("DISABLED: DIDN'T RENDERBLACKLIST");
    }
  })
};


// MUTATION OBSERVER WATCHES FOR CHANGES



function renderBlacklist () {
  var fakeDomains = 0;
  var reference = null;
  // $(document).ready(function() {
  // This file pings background scripts and compares DOM hrefs with
  // ones found on the blacklist and user-preferenced blacklist
  // and modifies the matching elements on the DOM

  // Short links are handled through live-connection where short
  // links are sent to background scripts and the respective DOM
  // element is modified as responses are received
  $('a[href]').each(function(index, element) {
    $(element).off('mouseover');
   });
  $('a[href]').mouseover(function(event) {
    reference = $(event.target).attr('href');
    if (reference !== undefined) {
      chrome.runtime.sendMessage({text: 'sending element', href: reference}, function(response) {
      });
    }
  });
  var sites = [];
  var unfilteredSites = [];

  var shortSites = [];


  // regex to reduce down to XXXXX.com
  // populate sites and shortSites with DOM links
  var populateSites = function() {
    var DOMLinks = $('a[href]');
    var cache = {};

    DOMLinks.each(function(index, element) {
      var href = $(element).attr('href');
      var filtered = filterLinks(href);
      unfilteredSites.push(href);
      if (!cache[filtered]) {

        // if a short link, add original link to shortSites
        if (shorts[filtered]) {
          shortSites.push(href);
        } else {
          sites.push(filtered);
          cache[filtered] = filtered;
        }
      }
    });
  };

  populateSites();
  // sends to background script array of sites in form ['xxx.com']

  // ONLY GETS FIRST RESPONSE, THEN REAL RESPONSE COMES IN ~5 SEC LATER
  // console.log(sites, 'SITES DATAS');
  // console.log(unfilteredSites, 'UNFILTERED SITES');
  chrome.runtime.sendMessage({data: sites}, function(response) {
    // console.log('ABOUT TO RENDER DOM')
    renderDOM(response, $('a[href]'));
    // return true;
  });
  //  POST MESSAGE FOR SHORT SITES IN ORDER TO GRAB BACK LONG SITES.
  if (shortSites.length > 0) {
    port.postMessage({ data: shortSites });
  }
};

function filterLinks (unfilteredLink) {
  var domain = unfilteredLink.replace(/^https?:\/\//,''); // Strip off https:// and/or http://
  domain = domain.replace(/^(www\.)/,''); // Strip off www.
  domain = domain.replace(/^(\/*)/, ''); // Strip off any // remaining
  domain = domain.split('/')[0]; // Get the domain and just the domain (not the path)
  domain = domain.split('.').slice(-2).join('.'); // remove prefixes ie: mail.google.com to google.com
  return domain;
};

  // compares all links on page with what model returns
function renderDOM(response, DOMLinks) {
  // console.log(response.data.length, "HAS LENGTH OF ?");
  console.log(response.data);
  fakeDomains = Object.keys(response.data['blacklist']).length;
  DOMLinks.each(function(index, element) {
    var href = $(element).attr('href');
    var domain = filterLinks(href);
    if (shorts[domain]) {
      domain = href
    }
    // Check if the domain is in the blacklist, if so, inject css theme class
    if (response.data['blacklist'][domain]) {
      var bias = getHrefClassBasedOn(response.data.blacklist[domain]);
      chrome.storage.sync.get('theme', function(syncStore) {
        console.log('ADDING', syncStore.theme[bias]);
        $(element).addClass(syncStore.theme[bias]); // Inject css theme class
      });
    }

    // If domain is in whitelist, remove the injected css classes
    if (response.data['whitelist'][domain]) {
      var bias = getHrefClassBasedOn(response.data.whitelist[domain]);
      chrome.storage.sync.get('theme', function(syncStore) {
        // Loop through possible bias types and remove those classes
        for (var prop in syncStore.theme) {
          $(element).removeClass(syncStore.theme[prop]);
        }
      });
    }
  // console.log(response.data, 'response data');
  });
}

  ///////////////////////////////////////////////////////////////////////////////////////////
  // Messenger for Shortened Links
  ///////////////////////////////////////////////////////////////////////////////////////////

// send array of short links
// expect back in piecemeal which we will modify specific elements of DOM with
port.onMessage.addListener(function(response) {
  // console.log('response for shortener', response);
  var urlToCheck;
  if (Object.keys(response.data.blacklist).length !== 0) {
    for (key in response.data.blacklist) {
      urlToCheck = key;
    }
  } else if (Object.keys(response.data.whitelist).length !== 0) {
    for (key in response.data.whitelist) {
      urlToCheck = key;
    }
  }
  renderDOM(response, $(`a[href="${urlToCheck}"]`));
});


// Helper function, returns object with appropriate css class info
function getHrefClassBasedOn(type) {
  switch (type) {
    ////////////////////////////////////////////////////////////////////////////
    // FAKE SITE
    ////////////////////////////////////////////////////////////////////////////
    case 'fake ':
    case 'fake':
    case 'clickbait ':
    case 'clickbait':
    case 'fake, conspiracy':
    case 'bias, fake':
    case 'userAdded':
      return 'fake';

    ////////////////////////////////////////////////////////////////////////////
    // SATIRE SITE
    ////////////////////////////////////////////////////////////////////////////
    case 'satire':
    case 'rumor':
    case 'parody':
      return 'satire';

    ////////////////////////////////////////////////////////////////////////////
    // BIASED SITE
    ////////////////////////////////////////////////////////////////////////////
    case "conspiracy ":
    case "conspiracy":
    case "conpisracy":
    case "conpsiracy":
    case "conpiracy":
    case "unreliable ":
    case "unreliable":
    case "bias":
    case "credible":
    case "hate":
    case "junksci":
    case "political":
    case "rumors":
      return 'biased';

    ////////////////////////////////////////////////////////////////////////////
    // DEFAULT CASE
    ////////////////////////////////////////////////////////////////////////////
    default:
      return 'fake';
  };
};
// THIS ADDS A MESSAGE TO REFRESH IF ADDED INTO WHITELIST
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.refresh === 'refresh') {
    chrome.runtime.sendMessage({disabled: 'give'}, function(response) {
      // console.log(response, 'THIS IS THE DISABLED RESPONSE in BOTTOM OF PAGE');
      // console.log(response.disabled, "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
      if (!response.disabled) {
        renderBlacklist();
      } else {
        console.log("DISABLED: DIDN'T RENDERBLACKLIST");
      }
    })
  }
});
