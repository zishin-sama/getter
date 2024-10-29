const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000; // You can change this to your preferred port

const sleep = async (ms) => {
  return new Promise((res) => {
    setTimeout(res, ms);
  });
};

const ID = {
  login: '#email',
  pass: '#pass',
};

app.get('/cookie', async (req, res) => {
  const { email, password } = req.query;

  // Validate the email and password
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cookiesData = [];

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();
  
  try {
    const login = async () => {
      // Navigate to Facebook login page
      await page.goto('https://facebook.com', { waitUntil: 'networkidle2' });
      await page.waitForSelector(ID.login);
      
      // Type in the email and password from the request
      await page.type(ID.login, email);
      await page.type(ID.pass, password);
      await sleep(500);
      await page.click('#loginbutton');

      console.log('Login done');
      await page.waitForNavigation();
    };

    await login();

    // Wait for cookies to be set and retrieve them
    const cookies = await page.cookies();
    
    cookies.forEach(cookie => {
      cookiesData.push({
        key: cookie.name,
        value: cookie.value,
        path: cookie.path,
        hostOnly: cookie.hostOnly,
        domain: cookie.domain,
        creation: new Date(cookie.expires * 1000).toISOString(),
        lastAccessed: new Date().toISOString(), // Simulating last accessed time
      });
    });

    // Capture a screenshot (optional)
    await page.screenshot({ path: 'facebook.png' });

    // Send JSON response with cookies
    res.setHeader('Content-Type', 'application/json');
    res.json(cookiesData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred during login.' });
  } finally {
    await browser.close(); // Close the browser in any case
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
