const TITLE_OFF = 'Stay Productive is Off';
const TITLE_ON = 'Stay Productive is On';
const ICON_ON_PATH = 'icons/do_not_disturb_on.svg';
const ICON_OFF_PATH = 'icons/do_not_disturb_off.svg';
const APPLICABLE_PROTOCOLS = ['http:', 'https:'];
const APPLICABLE_URL = {
  '.facebook.com': {
    css: '/css/facebook.css',
    mute: true
  },
  'twitter.com': {
    css: '/css/twitter.css',
    mute: true
  },
  '.linkedin.com': {
    css: '/css/linkedin.css',
    mute: true
  },
};

const EXTENSION_ID = browser.i18n.getMessage('@@extension_id');

/*
 Contain all states of tabs where rules can be applied
 */
let tabIdStates = {};

/**
 * Set the action's title and icon to off.
 * @param tab to apply changes
 * @param properties if properties given try to remove them
 */
function setOff(tab, properties = {}) {
  let tabId = tab.id | tab;
  browser.pageAction.setIcon({tabId: tabId, path: ICON_OFF_PATH});
  browser.pageAction.setTitle({tabId: tabId, title: TITLE_OFF});
  if (properties.hasOwnProperty('css')) {
    browser.tabs.removeCSS(tabId, {file: properties.css}).catch((reason) => console.info('No CSS file to remove', reason));
  }
  if (properties.hasOwnProperty('mute') && properties.mute) {
    browser.tabs.update(tabId, {muted: false});
  }
}

/**
 * Set the action's title and icon to on.
 * @param tab to apply changes
 * @param properties if properties given try to add them
 */
function setOn(tab, properties = {}) {
  let tabId = tab.id | tab;
  browser.pageAction.setIcon({tabId: tabId, path: ICON_ON_PATH});
  browser.pageAction.setTitle({tabId: tabId, title: TITLE_ON});
  if (properties.hasOwnProperty('css')) {
    browser.tabs.insertCSS(tabId, {file: tabIdStates[tabId].properties.css}).catch((reason) => console.info('Unable to add CSS file', reason));
  }
  if (properties.hasOwnProperty('mute') && properties.mute) {
    browser.tabs.update(tabId, {muted: true});
  }
}

/**
 * Toggle: based on the current state of the tab, insert or remove the properties.
 * Update the page action's title and icon to reflect its state.
 * @param tab to apply changes
 */
function toggle(tab) {
  let tabIdKey = tab.id.toString();
  let properties = tabIdStates[tabIdKey].properties;
  if (tabIdStates[tabIdKey].active) {
    tabIdStates[tabIdKey].active = false;
    setOff(tab, properties);
  } else {
    tabIdStates[tabIdKey].active = true;
    setOn(tab, properties);
  }
}

/**
 * Returns the properties to apply if exist from APPLICABLE_URL (check also protocol with
 * APPLICABLE_PROTOCOLS), else returns false.
 * @param url the url of the current page open
 * @returns {string, boolean} properties to apply if there is, else false
 */
function urlHasStyleToApply(url) {
  let anchor = document.createElement('a');
  anchor.href = url;
  if (APPLICABLE_PROTOCOLS.includes(anchor.protocol)) {
    let domain = Object.keys(APPLICABLE_URL).find((domain) => anchor.hostname.endsWith(domain));
    if (domain !== undefined) {
      return APPLICABLE_URL[domain];
    }
  }
  return false;
}

/**
 * If the given tab have a rule to apply: initialize the page action (set icon and title, then show)
 * @param tab
 */
function initializePageAction(tab) {

  // We check first if the url have a CSS to apply
  let properties = urlHasStyleToApply(tab.url);
  if (properties) {

    let tabIdKey = tab.id.toString();

    // If the tab have already a rule applied
    if (Object.keys(tabIdStates).includes(tabIdKey)) {

      let properties = tabIdStates[tabIdKey].properties;

      // Set the current state
      if (tabIdStates[tabIdKey].active) {

        setOn(tab, properties);

      // If the tab has previously muted by this extension, we also need to set again to on the all behavior
      } else if (tab.hasOwnProperty('status') && tab.status === 'complete'
        && tab.hasOwnProperty('mutedInfo') && tab.mutedInfo.muted
        && tab.mutedInfo.hasOwnProperty('extensionId') && tab.mutedInfo.extensionId === EXTENSION_ID) {

        setOn(tab, properties);

      } else {
        setOff(tab);
      }
      browser.pageAction.show(tab.id);

    // Initialize
    } else {
      setOff(tab);
      browser.pageAction.show(tab.id);
      tabIdStates[tabIdKey] = {
        properties: properties,
        active: false
      };
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
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
  if (!changeInfo.hasOwnProperty('mutedInfo')) {
    initializePageAction(tab);
  }
});

/*
 When a tab is closed, we remove his state of the tabIdStates
 */
browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
  delete tabIdStates[tabId];
});

/*
 When the window is closed, we reset all tab to off
 */
browser.windows.onRemoved.addListener((windowId) => {
  browser.windows.get(windowId, {populate: true}).then((window) => {
    for (let tab of window.tabs) {
      delete tabIdStates[tab.id.toString()];
    }
  });
});

/*
 Toggle CSS when the page action is clicked.
 */
browser.pageAction.onClicked.addListener(toggle);
