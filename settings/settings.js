const FORM_ID = 'settingsForm';
const ENABLE_BY_DEFAULT_ID = 'enableDefault';
const ENABLE_BY_DEFAULT_CUSTOM = {
  facebook: 'facebookEnableDefault',
  twitter: 'twitterEnableDefault',
  linkedin: 'linkedinEnableDefault',
};

function saveSettings(event) {
  event.preventDefault();
  let settings = {};
  settings[ENABLE_BY_DEFAULT_ID] = document.getElementById(ENABLE_BY_DEFAULT_ID).checked;
  for (let social in ENABLE_BY_DEFAULT_CUSTOM) {
    if (ENABLE_BY_DEFAULT_CUSTOM.hasOwnProperty(social)) {
      let elt = document.getElementById(ENABLE_BY_DEFAULT_CUSTOM[social]);
      settings[ENABLE_BY_DEFAULT_CUSTOM[social]] = elt.checked;
      elt.disabled = settings[ENABLE_BY_DEFAULT_ID];
    }
  }
  browser.storage.local.set({
    settings: settings
  });
}

function restoreSettings() {
  let configPromise = browser.storage.local.get('settings');

  configPromise.then((result) => {
    result = Array.isArray(result) ? result[0] : result;
    let settings = result.settings || {};
    if (settings.hasOwnProperty(ENABLE_BY_DEFAULT_ID)) {
      document.getElementById(ENABLE_BY_DEFAULT_ID).checked = settings[ENABLE_BY_DEFAULT_ID];
    }
    for (let social in ENABLE_BY_DEFAULT_CUSTOM) {
      if (ENABLE_BY_DEFAULT_CUSTOM.hasOwnProperty(social) && settings.hasOwnProperty(ENABLE_BY_DEFAULT_CUSTOM[social])) {
        let elt = document.getElementById(ENABLE_BY_DEFAULT_CUSTOM[social]);
        elt.checked = settings[ENABLE_BY_DEFAULT_CUSTOM[social]];
        if (settings.hasOwnProperty(ENABLE_BY_DEFAULT_ID)) {
          elt.disabled = settings[ENABLE_BY_DEFAULT_ID];
        }
      }
    }
  }, (error) => {
    console.error('Error when restoring settings', error);
  });
}

// Restore settings
document.addEventListener('DOMContentLoaded', restoreSettings);

// On Change input trigger save settings
let inputs = document.getElementsByTagName('input');
for (let i = 0; i < inputs.length; i++) {
  inputs[i].onchange = saveSettings;
}
// If submit save again
document.getElementById(FORM_ID).addEventListener('submit', saveSettings);
