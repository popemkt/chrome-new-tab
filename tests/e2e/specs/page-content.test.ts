describe('Webextension Content Script', () => {
  it('should inject content script on page load', async () => {
    await browser.url('https://www.example.com');

    // Content script and content-ui both inject on all pages.
    // Verify they loaded by checking the content-ui shadow root element exists.
    const contentDiv = await $('#chrome-extension-boilerplate-react-vite-content-view-root').getElement();
    await expect(contentDiv).toBeExisting();
  });
});
