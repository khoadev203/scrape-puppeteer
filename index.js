// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra')

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

// file helper
const fs = require('fs');
// import config
const config = require("./config.json")

// for day & night, adult camp type
let id = config.campTypes[3]
// puppeteer usage as normal
puppeteer.launch({
  headless: true
}).then(async browser => {
  let campsArr = [];
  for (let i = 46; i < 53; i++) {
    console.log('Running for state '+i+' / '+id)
    const page = await browser.newPage()
    // Configure the navigation timeout
    await page.setDefaultNavigationTimeout(0);

    await page.goto('http://find.acacamps.org/')

    // select camp type
    await (await page.waitForSelector('label[for=' + id + ']')).click();
    // submit form
    await page.waitForSelector('.buttons.camp-type-next');
    await page.click('.buttons.camp-type-next');
    await page.waitForNavigation();
    console.log('In Find Camp Page.')
    // find location & click
    const linkHandlers = await page.$x("//h2[contains(text(), 'Location')]");
    if (linkHandlers.length > 0) {
      await linkHandlers[0].click();
      console.log('Next clicked')
    } else {
      console.log("Link not found");
    }
    // search by states
    await (await page.waitForSelector('label[for=region_type_distance]')).click();
    // find all states
    const [detailElm] = await page.$x(
      "//ul[@class='checkbox text-center']"
    );
    const list = await detailElm.$x("li");

    // loop states
    let line = list[i] 
      const links = [];
      // get state name for storing data
      let state = await (await line.getProperty('innerText')).jsonValue();
      // select a state
      await line.click();
      console.log(state + " selected");
      // submit search
      const [submitBtn] = await page.$x("//a[contains(text(), 'See Your Results')]");
      if (submitBtn) await submitBtn.click()
      console.log("See Your Results clicked");
      await page.waitForNavigation();

      // scrape camps link
      // const camps = await page.$x("//div[@class='col-sm-4']");
      // program
      const camps = await page.$x("//span[@class='program-name']");
      for (let camp of camps) {
        const link = await camp.$eval('a', a => a.getAttribute('href'));
        links.push(link)
      }
      campsArr.push({
        state,
        links
      })
      console.log(links)
      fs.writeFileSync('adult.json', JSON.stringify(campsArr));
      await page.close();
  }
 
  // await page.waitForTimeout(5000)
  await browser.close()
  console.log(`All done, Move to next campTyes. ✨`)
})
