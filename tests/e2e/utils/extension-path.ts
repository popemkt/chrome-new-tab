/**
 * Returns the Chrome extension path by extracting the ID from the service worker URL.
 * Falls back to chrome://extensions shadow DOM parsing if service worker approach fails.
 */
export const getChromeExtensionPath = async (browser: WebdriverIO.Browser) => {
  // Approach 1: Try getting extension ID from service workers page
  try {
    await browser.url('chrome://serviceworker-internals/');
    await browser.pause(1000);

    const pageSource = await browser.getPageSource();
    const match = pageSource.match(/chrome-extension:\/\/([a-z]{32})/);
    if (match) {
      return `chrome-extension://${match[1]}`;
    }
  } catch {
    // fall through
  }

  // Approach 2: Try the extensions page shadow DOM
  try {
    await browser.url('chrome://extensions/');
    await browser.pause(1000);

    // Try direct element access first
    const extensionItem = await browser.$('extensions-manager').getElement();
    const itemList = await extensionItem.shadow$('#container > #viewManager > extensions-item-list');
    const item = await itemList.shadow$('extensions-item');
    const extensionId = await item.getAttribute('id');

    if (extensionId) {
      return `chrome-extension://${extensionId}`;
    }
  } catch {
    // fall through
  }

  // Approach 3: Use JavaScript to query chrome://extensions
  try {
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

    if (extensionId) {
      return `chrome-extension://${extensionId}`;
    }
  } catch {
    // fall through
  }

  throw new Error('Could not determine extension ID');
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
