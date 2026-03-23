describe('Webextension Content Script', () => {
  it('should inject content script on page load', async () => {
    await browser.url('https://www.example.com');

    // Content scripts may take a moment to inject in headless mode
    await browser.waitUntil(
      async () => {
        const el = await $('#chrome-extension-boilerplate-react-vite-content-view-root');
        return el.isExisting();
      },
      { timeout: 10000, timeoutMsg: 'Content UI root not found after 10s' },
    );

    const contentDiv = await $('#chrome-extension-boilerplate-react-vite-content-view-root').getElement();
    await expect(contentDiv).toBeExisting();
  });
});
