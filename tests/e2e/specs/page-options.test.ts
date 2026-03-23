describe('Webextension Options Page', () => {
  it('should make options page accessible', async () => {
    const extensionPath = await browser.getExtensionPath();
    const optionsUrl = `${extensionPath}/options/index.html`;

    await browser.url(optionsUrl);

    await expect(browser).toHaveTitle('Options');
  });

  it('should render the sidebar and navigation', async () => {
    const extensionPath = await browser.getExtensionPath();
    const optionsUrl = `${extensionPath}/options/index.html`;

    await browser.url(optionsUrl);

    // Verify the app sidebar is rendered
    const sidebar = await $('aside').getElement();
    await expect(sidebar).toBeDisplayed();

    // Verify the secondary nav has Tab Manager heading
    const navHeading = await $('h2=Tab Manager').getElement();
    await expect(navHeading).toBeDisplayed();

    // Verify navigation buttons exist
    const redirectorBtn = await $('button=Redirector').getElement();
    await expect(redirectorBtn).toBeDisplayed();

    const organizerBtn = await $('button=Organizer').getElement();
    await expect(organizerBtn).toBeDisplayed();

    const bulkBtn = await $('button=Bulk Actions').getElement();
    await expect(bulkBtn).toBeDisplayed();
  });

  it('should navigate between tabs', async () => {
    const extensionPath = await browser.getExtensionPath();
    const optionsUrl = `${extensionPath}/options/index.html`;

    await browser.url(optionsUrl);

    // Default tab should show Redirector content
    const redirectorHeading = await $('h1=New Tab URL Redirector').getElement();
    await expect(redirectorHeading).toBeDisplayed();

    // Click on Organizer tab
    const organizerBtn = await $('button=Organizer').getElement();
    await organizerBtn.click();

    const organizerHeading = await $('h1=Tab Organizer').getElement();
    await expect(organizerHeading).toBeDisplayed();

    // Click on Bulk Actions tab
    const bulkBtn = await $('button=Bulk Actions').getElement();
    await bulkBtn.click();

    const bulkHeading = await $('h1=Bulk Actions').getElement();
    await expect(bulkHeading).toBeDisplayed();
  });
});
