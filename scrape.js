// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra')

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

// file helper
const fs = require('fs');
const csvWriter = require('csv-write-stream')
const finalPathFile = './data_day.csv';
// import config
const jsonData = require("./day.json")
// site start url
const baseUrl = 'http://find.acacamps.org';

// puppeteer usage as normal
puppeteer.launch({
  headless: true
}).then(async browser => {
  for (let k = 0; k < 53; k++) {
    let id = jsonData.day[k];

    for (let i = 0; i < id.links.length; i++) {
      console.log('Running ' + i + ' for ' + id.state + ', index:' + k)
      const page = await browser.newPage()
      // Configure the navigation timeout
      await page.setDefaultNavigationTimeout(0);

      await page.goto(baseUrl + (id.links[i]).substring(1));


      try {
        // find camp url and program title
        const h1Tags = await page.$x("//h1");
        let programTitle = '';
        let campLink = '';
        if (h1Tags[1]) {
          programTitle = await (await h1Tags[1].getProperty('innerText')).jsonValue();
          campLink = await h1Tags[1].$eval('a', a => a.getAttribute('href'));
        }

        // find program description
        let divs = await page.$x("//div[@class='camp-description']");
        let programDesc = '';
        if (divs[0])
          programDesc = await (await divs[0].getProperty('innerText')).jsonValue();

        // find location
        const addressTags = await page.$x("//address");
        let location = '';
        if (addressTags[0])
          location = await (await addressTags[0].getProperty('innerText')).jsonValue();

        // find contact
        const contacts = await page.$x("//div[@class='sidebar-contact fix']");
        let contact = '';
        let programLink = '';
        if (contacts[0]) {
          programLink = await contacts[0].$eval('a', a => a.getAttribute('href'));
          // contact = await contacts[0].$eval('p', p => p.textContent);
          pTag = await contacts[0].$x('p');
          contact = await (await pTag[0].getProperty('innerText')).jsonValue();
        }

        // find additional info
        const additionalInfos = await page.$x("//div[@class='sidebar-btm fix']");
        let infoFor = infoType = infoGeneral = infoFinancial = infoWaterfront = '';
        if (additionalInfos[0]) {
          let additioanlInfo = await additionalInfos[0].$x("p");
          if (additioanlInfo[0]) infoFor = await (await additioanlInfo[0].getProperty('innerText')).jsonValue() + ', ';
          if (additioanlInfo[1]) infoType = await (await additioanlInfo[1].getProperty('innerText')).jsonValue() + ', ';
          if (additioanlInfo[4]) infoGeneral = await (await additioanlInfo[4].getProperty('innerText')).jsonValue() + ', ';
          if (additioanlInfo[5]) infoFinancial = await (await additioanlInfo[5].getProperty('innerText')).jsonValue() + ', ';
          if (additioanlInfo[6]) infoWaterfront = await (await additioanlInfo[6].getProperty('innerText')).jsonValue();
        }

        // write into csv
        if (!fs.existsSync(finalPathFile))
          writer = csvWriter({
            headers: ["title", "campUrl", "about", "location", "state", "contact", "siteUrl", "additional"]
          });
        else
          writer = csvWriter({
            sendHeaders: false
          });

        writer.pipe(fs.createWriteStream(finalPathFile, {
          flags: 'a'
        }));
        writer.write({
          title: programTitle,
          campUrl: baseUrl + campLink,
          about: programDesc,
          location: location.slice(0, -11),
          state: id.state,
          // contact:contact.replace(/[^a-zA-Z ]/g, ""),
          contact: contact,
          siteUrl: programLink,
          additional: infoFor + infoType + infoGeneral + infoFinancial + infoWaterfront,
        });
        writer.end();

        await page.close();
      } catch (error) {
        continue;
      }
    }
  }

  // await page.waitForTimeout(5000)
  await browser.close()
  console.log(`All done, Move to next. ✨`)
})