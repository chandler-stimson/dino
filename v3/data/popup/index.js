const frame = document.querySelector('iframe');
frame.onload = () => chrome.storage.local.get({
  mode: 'color'
}, prefs => {
  frame.contentWindow.postMessage({
    prefs
  }, '*');
});
