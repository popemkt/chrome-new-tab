/**
 * Returns the Chrome extension path by navigating to chrome://extensions
 * and extracting the extension ID from the shadow DOM.
 */
export const getChromeExtensionPath = async (browser: WebdriverIO.Browser) => {
  await browser.url('chrome://extensions/');
  await browser.pause(1000);

  const extensionId = await browser.execute(() => {
    const manager = document.querySelector('extensions-manager');
    if (!manager?.shadowRoot) return null;
    const itemList = manager.shadowRoot.querySelector('extensions-item-list');
    if (!itemList?.shadowRoot) return null;
    const item = itemList.shadowRoot.querySelector('extensions-item');
    return item?.getAttribute('id') ?? null;
  });

  if (!extensionId) {
    throw new Error('Extension ID not found on chrome://extensions/');
  }

  return `chrome-extension://${extensionId}`;
};

/**
 * Returns the Firefox extension path.
 */
export const getFirefoxExtensionPath = async (browser: WebdriverIO.Browser) => {
  await browser.url('about:debugging#/runtime/this-firefox');
  const uuidElement = await browser.$('//dt[contains(text(), "Internal UUID")]/following-sibling::dd').getElement();
  const internalUUID = await uuidElement.getText();

  if (!internalUUID) {
    throw new Error('Internal UUID not found');
  }

  return `moz-extension://${internalUUID}`;
};
