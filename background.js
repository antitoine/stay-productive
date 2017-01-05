const TITLE_OFF = "Stay Productive is Off";
const TITLE_ON = "Stay Productive is On";
const APPLICABLE_PROTOCOLS = ["http:", "https:"];
const APPLICABLE_URL_WITH_STYLES = {
  "facebook.com": "/css/facebook.css",
  "twitter.com": "/css/twitter.css"
};

var tabIdWithStyles = {};

function setOff(tab) {
  browser.pageAction.setIcon({tabId: tab.id, path: "icons/do_not_disturb_off_white.svg"});
  browser.pageAction.setTitle({tabId: tab.id, title: TITLE_OFF});
  browser.tabs.removeCSS({file: tabIdWithStyles[tab.id].style});
}

function setOn(tab) {
  browser.pageAction.setIcon({tabId: tab.id, path: "icons/do_not_disturb_on_white.svg"});
  browser.pageAction.setTitle({tabId: tab.id, title: TITLE_ON});
  browser.tabs.insertCSS({file: tabIdWithStyles[tab.id].style});
}

/*
Toggle CSS: based on the current title, insert or remove the CSS.
Update the page action's title and icon to reflect its state.
*/
function toggle(tab) {
  if (tabIdWithStyles[tab.id.toString()].active) {
    tabIdWithStyles[tab.id.toString()].active = false;
    setOff(tab);
  } else {
    tabIdWithStyles[tab.id.toString()].active = true;
    setOn(tab);
  }
}

/*
Returns true only if the URL's protocol is in APPLICABLE_PROTOCOLS.
*/
function protocolIsApplicable(url) {
  var anchor =  document.createElement('a');
  anchor.href = url;
  return APPLICABLE_PROTOCOLS.includes(anchor.protocol);
}

/*
Returns the path to the stylesheet to apply if exist from APPLICABLE_URL_WITH_STYLES, else returns false.
 */
function urlHasStyleToApply(url) {
  var anchor =  document.createElement('a');
  anchor.href = url;
  var domain = Object.keys(APPLICABLE_URL_WITH_STYLES).find((domain) => anchor.hostname.endsWith(domain));
  if (domain !== undefined) {
    return APPLICABLE_URL_WITH_STYLES[domain];
  }
  return false;
}

/*
Initialize the page action: set icon and title, then show.
*/
function initializePageAction(tab) {
  if (protocolIsApplicable(tab.url)) {
    console.log(tabIdWithStyles);
    console.log('Tab Id: ' + tab.id);
    if (Object.keys(tabIdWithStyles).includes(tab.id.toString())) {
      // Set the current state
      console.log('Found, and active ?' + tabIdWithStyles[tab.id.toString()].active);
      if (tabIdWithStyles[tab.id.toString()].active) {
        setOn(tab);
      } else {
        setOff(tab);
      }
      browser.pageAction.show(tab.id);
    } else {
      console.log('Not found');
      // Initialize
      var style = urlHasStyleToApply(tab.url);
      if (style) {
        browser.pageAction.setIcon({tabId: tab.id, path: "icons/do_not_disturb_off_white.svg"});
        browser.pageAction.setTitle({tabId: tab.id, title: TITLE_OFF});
        browser.pageAction.show(tab.id);
        tabIdWithStyles[tab.id.toString()] = {style: style, active: false};
      }
    }
  }
}

/*
When first loaded, initialize the page action for all tabs.
*/
var gettingAllTabs = browser.tabs.query({});
gettingAllTabs.then((tabs) => {
  for (tab of tabs) {
    initializePageAction(tab);
  }
});

/*
Each time a tab is updated, reset the page action for that tab.
*/
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
  initializePageAction(tab);
});

/*
 When a tab is close, we remove his state of the tabIdWithStyles
 */
browser.tabs.onRemoved.addListener((id) => {
  delete tabIdWithStyles[id.toString()]
});

/*
Toggle CSS when the page action is clicked.
*/
browser.pageAction.onClicked.addListener(toggle);

