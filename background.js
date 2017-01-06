const TITLE_OFF = 'Stay Productive is Off';
const TITLE_ON = 'Stay Productive is On';
const APPLICABLE_PROTOCOLS = ['http:', 'https:'];
const APPLICABLE_URL_WITH_STYLES = {
  'facebook.com': '/css/facebook.css',
  'twitter.com': '/css/twitter.css'
};

let tabIdStates = {};

/*
 Set the action's title and icon to off.
 */
function setOff(tab) {
  browser.pageAction.setIcon({tabId: tab.id, path: 'icons/do_not_disturb_off.svg'});
  browser.pageAction.setTitle({tabId: tab.id, title: TITLE_OFF});
}

function setOn(tab) {
  browser.pageAction.setIcon({tabId: tab.id, path: 'icons/do_not_disturb_on.svg'});
  browser.pageAction.setTitle({tabId: tab.id, title: TITLE_ON});
}

/*
 Toggle: based on the current state of the tab, insert or remove the CSS.
 Update the page action's title and icon to reflect its state.
 */
function toggle(tab) {
  let tabIdKey = tab.id.toString();
  if (tabIdStates[tabIdKey].active) {
    tabIdStates[tabIdKey].active = false;
    setOff(tab);
    browser.tabs.removeCSS({file: tabIdStates[tab.id].style}).catch((reason) => console.warn('No CSS file to remove', reason));
  } else {
    tabIdStates[tabIdKey].active = true;
    setOn(tab);
    browser.tabs.insertCSS({file: tabIdStates[tab.id].style}).catch((reason) => console.warn('Unable to add CSS file', reason));
  }
}

/*
 Returns true only if the URL's protocol is in APPLICABLE_PROTOCOLS.
 */
function protocolIsApplicable(url) {
  let anchor = document.createElement('a');
  anchor.href = url;
  return APPLICABLE_PROTOCOLS.includes(anchor.protocol);
}

/*
 Returns the path to the stylesheet to apply if exist from APPLICABLE_URL_WITH_STYLES, else returns false.
 */
function urlHasStyleToApply(url) {
  let anchor = document.createElement('a');
  anchor.href = url;
  let domain = Object.keys(APPLICABLE_URL_WITH_STYLES).find((domain) => anchor.hostname.endsWith(domain));
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
    if (Object.keys(tabIdStates).includes(tab.id.toString())) {
      // Set the current state
      if (tabIdStates[tab.id.toString()].active) {
        setOn(tab);
      } else {
        setOff(tab);
      }
      browser.pageAction.show(tab.id);
    } else {
      // Initialize
      let style = urlHasStyleToApply(tab.url);
      if (style) {
        browser.pageAction.setIcon({tabId: tab.id, path: 'icons/do_not_disturb_off.svg'});
        browser.pageAction.setTitle({tabId: tab.id, title: TITLE_OFF});
        browser.pageAction.show(tab.id);
        tabIdStates[tab.id.toString()] = {style: style, active: false};
      }
    }
  }
}

/*
 When first loaded, initialize the page action for all tabs.
 */
let gettingAllTabs = browser.tabs.query({});
gettingAllTabs.then((tabs) => {
  for (let tab of tabs) {
    initializePageAction(tab);
  }
});

/*
 Each time a tab is updated, reset the page action for that tab.
 */
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => initializePageAction(tab));

/*
 When a tab is close, we remove his state of the tabIdStates
 */
browser.tabs.onRemoved.addListener((id) => delete tabIdStates[id.toString()]);

/*
 Toggle CSS when the page action is clicked.
 */
browser.pageAction.onClicked.addListener(toggle);
