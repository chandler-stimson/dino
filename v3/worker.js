const once = () => chrome.storage.local.get({
  mode: 'color'
}, prefs => {
  chrome.contextMenus.create({
    id: 'mode',
    title: 'Display Mode',
    contexts: ['action']
  });
  chrome.contextMenus.create({
    id: 'source',
    title: 'View Source Code',
    contexts: ['action']
  });
  chrome.contextMenus.create({
    id: 'mode:color',
    title: 'Color',
    contexts: ['action'],
    type: 'radio',
    checked: prefs.mode === 'color',
    parentId: 'mode'
  });
  chrome.contextMenus.create({
    id: 'mode:black',
    title: 'Black and White',
    contexts: ['action'],
    type: 'radio',
    checked: prefs.mode !== 'color',
    parentId: 'mode'
  });
});
chrome.runtime.onInstalled.addListener(once);
chrome.runtime.onStartup.addListener(once);

chrome.contextMenus.onClicked.addListener(info => {
  if (info.menuItemId === 'mode:black') {
    chrome.storage.local.set({mode: 'black'});
  }
  else if (info.menuItemId === 'mode:color') {
    chrome.storage.local.set({mode: 'color'});
  }
  else if (info.menuItemId === 'source') {
    chrome.tabs.create({
      url: 'https://github.com/chandler-stimson/dino/popup/game/game.wat'
    });
  }
});

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const page = getManifest().homepage_url;
    const {name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, currentWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
