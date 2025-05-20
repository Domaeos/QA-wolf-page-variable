chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    if (changeInfo.status === 'complete') {

      if (tab.url && tab.url.match(/^https:\/\/app\.qawolf\.com\/.*\/environments\/.*/)) {
        setEnabledIcon();
      } else {
        setDisabledIcon();
      }
    }
  });

  function setEnabledIcon() {
    chrome.action.setIcon({
      path: {
        16: 'images/enabled-16.png',
        32: 'images/enabled-32.png',
        48: 'images/enabled-48.png',
        128: 'images/enabled-128.png'
      }
    });
  }

  function setDisabledIcon() {
    chrome.action.setIcon({
      path: {
        16: 'images/disabled-16.png',
        32: 'images/disabled-32.png',
        48: 'images/disabled-48.png',
        128: 'images/disabled-128.png'
      }
    });
  }