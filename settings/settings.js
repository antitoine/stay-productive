const FORM_ID = 'settingsForm';
const ENABLE_BY_DEFAULT_ID = 'enableDefault';
const ENABLE_BY_DEFAULT_CUSTOM = {
  facebook: 'enableFacebook',
  twitter: 'enableTwitter',
  linkedin: 'enableLinkedin',
};

function saveSettings(event) {
  event.preventDefault();
  let config = {};
  config[ENABLE_BY_DEFAULT_ID] = document.getElementById(ENABLE_BY_DEFAULT_ID).checked;
  for (let social in ENABLE_BY_DEFAULT_CUSTOM) {
    if (ENABLE_BY_DEFAULT_CUSTOM.hasOwnProperty(social)) {
      let elt = document.getElementById(ENABLE_BY_DEFAULT_CUSTOM[social]);
      config[ENABLE_BY_DEFAULT_CUSTOM[social]] = elt.checked;
      elt.disabled = config[ENABLE_BY_DEFAULT_ID];
    }
  }
  console.log('Save', config);
  browser.storage.local.set({
    settings: config
  });
}

function restoreSettings() {

  function setSettings(result) {
    let config = result.settings || {};
    console.log('Restore', config);
    if (config.hasOwnProperty(ENABLE_BY_DEFAULT_ID)) {
      document.getElementById(ENABLE_BY_DEFAULT_ID).checked = config[ENABLE_BY_DEFAULT_ID];
    }
    for (let social in ENABLE_BY_DEFAULT_CUSTOM) {
      if (ENABLE_BY_DEFAULT_CUSTOM.hasOwnProperty(social) && config.hasOwnProperty(ENABLE_BY_DEFAULT_CUSTOM[social])) {
        let elt = document.getElementById(ENABLE_BY_DEFAULT_CUSTOM[social]);
        elt.checked = config[ENABLE_BY_DEFAULT_CUSTOM[social]];
        if (config.hasOwnProperty(ENABLE_BY_DEFAULT_ID)) {
          elt.disabled = config[ENABLE_BY_DEFAULT_ID];
        }
      }
    }
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  let configPromise = browser.storage.local.get('settings');
  configPromise.then(setSettings, onError);
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
