// Relay Chrome extension messages to the page for content-ui to pick up
chrome.runtime.onMessage.addListener(message => {
  if (message.type === 'TOGGLE_COMMAND_PALETTE') {
    window.dispatchEvent(new CustomEvent('popemkt-toggle-command-palette'));
  }
});
