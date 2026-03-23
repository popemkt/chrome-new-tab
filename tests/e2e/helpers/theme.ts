/**
 * Helper method to check if user can click on theme button and toggle theme color.
 * Pages use a .App wrapper that gets a 'dark' class when in dark mode.
 */
export const canSwitchTheme = async () => {
  const TOGGLE_BUTTON_TEXT = 'Toggle theme';

  const app = await $('.App').getElement();
  const toggleThemeButton = await $(`button=${TOGGLE_BUTTON_TEXT}`).getElement();

  await expect(app).toBeExisting();
  await expect(toggleThemeButton).toBeExisting();

  // Check initial state - should not have 'dark' class (light by default)
  const initialClasses = await app.getAttribute('class');
  const wasLight = !initialClasses.includes('dark');

  // Toggle theme
  await toggleThemeButton.click();

  if (wasLight) {
    await expect(app).toHaveElementClass('dark');
  } else {
    // After toggle from dark, 'dark' class should be removed
    await browser.waitUntil(async () => {
      const classes = await app.getAttribute('class');
      return !classes.includes('dark');
    });
  }

  // Toggle back to initial theme
  await toggleThemeButton.click();

  if (wasLight) {
    await browser.waitUntil(async () => {
      const classes = await app.getAttribute('class');
      return !classes.includes('dark');
    });
  } else {
    await expect(app).toHaveElementClass('dark');
  }
};
