// This file will scrape all the subcategories
// of the website and save in categories.json like following
// [{
//   "activity": "Academic",
//   "names": ["Aeronautics",...]
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

// for day & night, adult camp type
let id = config.campTypes[3];

// puppeteer usage as normal
puppeteer.launch({
  headless: true
}).then(async browser => {
  // for big activity name
  let campsArr = [];
  for (let aa in config.activities) {
    let activity = config.activities[aa]
    console.log('Running...', activity)

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
    console.log('In Find Camp Page.')

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
    const categories = await page.$x("//h3[contains(text(), '" + activity + "')]");
    if (categories.length > 0) {
      await categories[0].click();
      console.log('Categories clicked')
    } else {
      console.log("Categories Not found");
    }
    // find all categories
    const detailElm = await page.$x(
      "//ul[@class='checkbox text-center']"
    );

    let ulElm = await detailElm[parseInt(aa)+5];
    const list = await ulElm.$x("li");
    let names = [];
    for (let i = 0; i < list.length; i++) {

      // loop categories
      let line = list[i]
      // const links = [];
      // get state name for storing data
      let name = await (await line.getProperty('innerText')).jsonValue();
      name = name.replace(/[^a-zA-Z ]/g, "")
      names.push(name);
    }
    // // select a state
    // await line.click();
    // console.log(state + " selected");
    // // submit search
    // const [submitBtn] = await page.$x("//a[contains(text(), 'See Your Results')]");
    // if (submitBtn) await submitBtn.click()
    // console.log("See Your Results clicked");
    // await page.waitForNavigation();

    // // scrape camps link
    // // const camps = await page.$x("//div[@class='col-sm-4']");
    // // program
    // const camps = await page.$x("//span[@class='program-name']");
    // for (let camp of camps) {
    //   const link = await camp.$eval('a', a => a.getAttribute('href'));
    //   links.push(link)
    // }
    // campsArr.push({
    //   state,
    //   links
    // })
    // console.log(links)
    campsArr.push({
      activity, names
    })
    console.log(names)
    await page.close();
  }
  fs.writeFileSync('categories1.json', JSON.stringify(campsArr));



  // await page.waitForTimeout(5000)
  await browser.close()
  console.log(`All done, Move to next. ✨`)
})