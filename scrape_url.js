// This file will scrape urls of the subcategories
// in categories.json and save in urls.json like following
// [{
//   "category": "Aeronautics",
//   "links": ["./camp_profile.php?...",...]
// },...]

// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra')

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

// file helper
const fs = require('fs');
// import config
const config = require("./config.json");
const jsonCat = require("./categories1.json")

// for day & night, adult camp type
let id = config.campTypes[3];

// puppeteer usage as normal
puppeteer.launch({
  headless: true
}).then(async browser => {
  let campsArr = [];
  for (let kk in jsonCat) {
    if (kk !=1) continue;
    let jsonData = jsonCat[kk];
    for (let k = 7; k < jsonData.names.length; k++) {

      console.log('Running...' + kk + '//' + k)

      const page = await browser.newPage();
      // Configure the navigation timeout
      await page.setDefaultNavigationTimeout(0);
      await page.goto('http://find.acacamps.org/');

      // select camp type
      await (await page.waitForSelector('label[for=' + id + ']')).click();

      // submit form
      await page.waitForSelector('.buttons.camp-type-next');
      await page.click('.buttons.camp-type-next');
      await page.waitForNavigation();

      // find (Activities)category & click
      const activities = await page.$x("//h2[contains(text(), 'Activities')]");
      if (activities.length > 0) {
        await activities[0].click();
        console.log('Activities clicked')
      } else {
        console.log("Activities Not found");
      }
      // find subcategories & click
      // await (await page.waitForSelector('label[for=region_type_distance]')).click();
      const categories = await page.$x("//h3[contains(text(), '" + jsonData.activity + "')]");
      if (categories.length > 0) {
        await categories[0].click();
        console.log('Categories clicked')
      } else {
        console.log("Categories Not found");
        continue
      }
      // find subcategories
      const detailElm = await page.$x(
        "//ul[@class='checkbox text-center']"
      );
      const list = await detailElm[parseInt(kk) + 5].$x("li");

      let line = list[k];
      const links = [];

      // select a state
      await line.click();
      console.log(jsonData.names[k] + " selected");
      // submit search
      const [submitBtn] = await page.$x("//a[contains(text(), 'See Your Results')]");
      if (submitBtn) await submitBtn.click()
      console.log("See Your Results clicked");
      await page.waitForNavigation();

      // program
      const camps = await page.$x("//span[@class='program-name']");
      for (let camp of camps) {
        const link = await camp.$eval('a', a => a.getAttribute('href'));
        links.push(link)
      }
      campsArr.push({
        "category": jsonData.names[k],
        links
      })
      fs.writeFileSync('urls1_' + kk + '_' + k + '.json', JSON.stringify(campsArr));
      await page.close();
    }

  }
  // fs.writeFileSync('urls.json', JSON.stringify(campsArr));
  // await page.waitForTimeout(5000)
  await browser.close()
  console.log(`All done, Move to next. ✨`)
})