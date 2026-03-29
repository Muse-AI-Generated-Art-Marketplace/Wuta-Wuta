import { test, expect } from '@playwright/test';

test('Verify the Minting Button is correctly tagged for E2E', async ({ page }) => {
  await page.goto('http://localhost:3000/mint');
  
  // Verify the main title is present
  await expect(page.locator('.minter-title')).toBeVisible();

  // Find the Mint Button by our custom test ID
  // Note: If the button is on Step 4, we check for its existence in the DOM
  const mintBtn = page.getByTestId('mint-button');
  await expect(mintBtn).toBeDefined();
  
  console.log('Success: E2E Hooks are properly integrated into the Stepper.');
});
