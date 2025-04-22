require('dotenv').config()
const express = require("express");
const Imap = require("imap");
const multer = require("multer");
const nodemailer = require("nodemailer");
const simpleParser = require("mailparser").simpleParser;
const axios = require("axios");
const app = express();
const fs = require('fs');
const path = require("path");
// const ytdl = require("@distube/ytdl-core")
const server=require('http').createServer(app)
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const puppeteer = require('puppeteer');



const wss=new WebSocket.Server({server:server})

const messageListeners = [];

const connectedClients = new Map()


// TypeScript: import ytdl from 'ytdl-core'; with --esModuleInterop
// TypeScript: import * as ytdl from 'ytdl-core'; with --allowSyntheticDefaultImports
// TypeScript: import ytdl = require('ytdl-core'); with neither of the above

// ytdl('https://www.youtube.com/watch?v=shDI1W5ZXV4')
//   .pipe(fs.createWriteStream('video2.mp4'));

// let screenShotUrl='https://seacardsys.com/cgi-bin/dashboard'
let screenShotUrl='https://seacardsys.com/cgi-bin/oms_supp_quote_search'

let COOKIES_FILE='./cookies.json'
let HANDLED_EMAILS='./handled.json'

let searcard_username = process.env.seacard_username
let seacard_password = process.env.seacard_password

function extractSeacardLinks(emailText) {
    const pattern = /https:\/\/seacardsys\.com[^\s]+/g;
    return emailText.match(pattern) || [];
}

const runBrowserScreenshot=async(itemObj)=>{
  const {email,subject,url,uid,quoteId,messageId,text}=itemObj
  return new Promise(async(resolve,reject)=>{
      // const browser = await puppeteer.launch({ headless: true});
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
      const page = await browser.newPage();
      await page.setViewport({ width: 1080, height: 800 });

      

      if (fs.existsSync(COOKIES_FILE)) {
            // const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf8'));
            // await page.setCookie(...cookies);
            // console.log('Loaded cookies.');
      }

    console.log('Going to url',url)
      try{
         await Promise.race([
                page.goto(url, { timeout: 70000, waitUntil: 'networkidle2' }),

                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Page load timeout')), 120000)
                )
            ]);
        }catch(err){
          console.log(`Retrying...`);
          await page.reload({ waitUntil: 'networkidle2' });
        }


        const currentUrl=await page.url()

        console.log(currentUrl)

        let loggedIn=false

        if(currentUrl.includes('login')){
          console.log('Session expired. Logging in...');
          const usernameSelector = 'input.Username' 
          const passwordSelector = "input.Password"; 
          const submitButtonSelector = "input[type='Submit']"

          console.log('Trying with',searcard_username,seacard_password)
          // await page.locator('input.Username').fill(searcard_username)
          // await page.locator("input.Password").fill(seacard_password)

          await sleep(1000)

          await Promise.race([page.locator('input#FW_LOGIN_USERNAME').fill(searcard_username),page.locator('input.Username').fill(searcard_username)])
          await Promise.race([page.locator('input#FW_LOGIN_PASSWORD').fill(seacard_password),page.locator("input.Password").fill(seacard_password)])

          await sleep(1000)
          

           // await page.type(usernameSelector, searcard_username, { delay: 100 }); // Typing with a delay for realism
            // await page.type(passwordSelector, seacard_password, { delay: 100 });
 
 
 const submitButtonSelector2='input#FW_LOGIN_LOGIN'
              console.log("First click")
    await Promise.race([page.locator(submitButtonSelector2).click(),page.locator(submitButtonSelector).click()])

          await Promise.all([
                  // page.click(submitButtonSelector2),
                  page.waitForNavigation({ timeout: 70000, waitUntil: 'networkidle2' })
              ]);

    // console.log("Second click")
    // const tabBtn = 'a#MerchantTopNavBar_MERCHANT_SEA_CARD_OMS_LINK_ANCHOR' 
    // page.click(tabBtn),
    //       // await Promise.all([
    //       //         page.click('a#MerchantTopNavBar_MERCHANT_SEA_CARD_OMS_LINK_ANCHOR'),
    //       //         page.waitForNavigation({  timeout: 70000, waitUntil: 'networkidle2' })
    //       //     ]);

    //       console.log("Third click")
    //       page.click('a#MerchantSEACardOMSNavBar_OMS_SUPP_QUOTE_SEARCH_LINK_ANCHOR'),
    //       // await Promise.all([
    //       //         page.click('a#MerchantSEACardOMSNavBar_OMS_SUPP_QUOTE_SEARCH_LINK_ANCHOR'),
    //       //         page.waitForNavigation({ waitUntil: 'networkidle2' })
    //       //     ]);

          console.log("Done PPaus")
          const currentUrl2=await page.url()

        console.log(currentUrl2)



        }else if (currentUrl.includes('seacard_oms')){
          loggedIn=true
          console.log("Still logged in")
        }
        else{
          console.log("Wrong page. Retrying")
          resolve('RETRYING')
         runBrowserScreenshot(itemObj)
        }

        const currentUrl3=await page.url()

        console.log(currentUrl3)


        
      

        // const quoteSearchInput = "input#QUOTE_SEARCH_QUOTE_ID"
        // const searchBtn = 'input[value="Search"]'; 

        // console.log('Searching now')
        // // await page.type(quoteSearchInput, quoteId, { delay: 50 });
        //  await page.locator(quoteSearchInput).fill(quoteId)
        //  // await page.locator('::-input-aria([name="Click me"][role="button"])').click();
        //  //  await page.waitForNavigation({ waitUntil: 'networkidle2' })
        //  page.click(searchBtn)
        // await Promise.all([
        //        page.waitForNavigation({ waitUntil: 'networkidle2' })
        //     ]);


        // const viewLink='a[id*="QUOTE_SEARCH"]'
        // // const [element] = await page.$x("//a[contains(text(), 'View')]");
        // // await page.click(viewLink)
        // await page.locator('td ::-p-text(View)').click()
        // await Promise.all([
        //         // page.click(element),
        //         // page.locator('div ::-a-text(View)').click(),
        //         page.waitForNavigation({ waitUntil: 'networkidle2' })
        //     ]);

        // await page.setViewport(null);
        // await page.setViewport({ width: 1280, height: 600 });

        let timestamp=new Date().getTime()
        const screenshotPath = path.join(__dirname, `screenshot_${timestamp}.png`);

  
        await page.screenshot({ path: screenshotPath});

        console.log('Screenshot taken')
        
         // const cookies = await page.cookies();
         await browser.close();


        // if(!loggedIn){
        //   fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies));
        //   console.log('Cookies saved.');
        // }

        sendEmail(screenshotPath,itemObj)

        resolve('DONE')

        



  })
}

// runBrowserScreenshot({email:'austt',url:screenShotUrl,quoteId:'15062'})


const runPupet=async(url)=>{

  try{
      const browser = await puppeteer.launch({ headless: false});
      const page = await browser.newPage();

      await page.setViewport({ width: 1280, height: 720 });

      let COOKIES_FILE='./cookies.json'

      if (fs.existsSync(COOKIES_FILE)) {
            const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf8'));
            await page.setCookie(...cookies);
            console.log('Loaded cookies.');
        }

      // await page.goto(url, { waitUntil: 'networkidle2' });


        try{
         await Promise.race([
                page.goto(url, { waitUntil: 'networkidle2' }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Page load timeout')), 15000)
                )
            ]);
        }catch(err){
          console.log(`Retrying...`);
          await page.reload({ waitUntil: 'networkidle2' });
        }
        

      const currentUrl=await page.url()

      console.log(currentUrl)

      let loggedIn=false

      if(currentUrl.includes('login')){
        console.log('Session expired. Logging in...');
        const usernameSelector = 'input.Username' 
        const passwordSelector = "input.Password"; 
        const submitButtonSelector = "input[type='Submit']"
        console.log('Attempt with',seacard_password,searcard_username)
         await page.type(usernameSelector, searcard_username, { delay: 100 }); // Typing with a delay for realism
          await page.type(passwordSelector, seacard_password, { delay: 100 });
        await Promise.all([
                page.click(submitButtonSelector),
                page.waitForNavigation({ waitUntil: 'networkidle2' })
            ]);
      }else{
        loggedIn=true
        console.log("Still logged in")
      }


      if(!loggedIn){
        const cookies = await page.cookies();
        fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies));
        console.log('Cookies saved.');
      }
      

    const quoteSearchInput = "input#QUOTE_SEARCH_QUOTE_ID"
    const searchBtn = "input[value='Search']"; 

    // await page.type(quoteSearchInput, seacard_password, { delay: 100 });
    //     await Promise.all([
    //             page.click(submitButtonSelector),
    //             page.waitForNavigation({ waitUntil: 'networkidle2' })
    //         ]);
        

      const screenshotPath = path.join(__dirname, 'screenshot.png');
      await page.screenshot({ path: screenshotPath,fullPage:true });

      // // console.log(page)

     

      // await Promise.all([
      //       page.click(submitButtonSelector),
      //       page.waitForNavigation({ waitUntil: 'networkidle2' })
      //   ]);
        
      //   // Take a screenshot
     

        await browser.close();

  }catch(err){

  }
}

// runPupet(screenShotUrl)
function sendMessage(message) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function sendMessageToClient(clientId, message) {
  const client = connectedClients.get(clientId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(message);
  }
}

function onMessage(callback) {
  console.log(callback)
  messageListeners.push(callback);
}

wss.on('connection',function connections(ws){
  const clientId = uuidv4();
  ws.id = clientId
  connectedClients.set(clientId,ws)
  console.log('New client connected with ID',clientId);
  sendMessageToClient(clientId,JSON.stringify({your:true}))
  

  ws.on('message',async function incoming(message){
    message = message.toString('utf8');
    
    let messageObj=JSON.parse(message)
    if(messageObj.getScrnShot){

      const {imageUrl,email,subject,uid,messageId}=messageObj
      console.log('Received ',email,subject);
      let filePath= saveScreenshot(imageUrl)
      await sendEmail(filePath,messageObj);
    }
    
   
    // sendEmail()
    // messageListeners.forEach(listener => listener(message));
  })

  ws.on('close', function close() {
    console.log(`Client disconnected with ID: ${ws.id}`);
    connectedClients.delete(clientId);
  });
})




const PORT = 3000;

console.log(process.env.receiving_email)
console.log(process.env.receiving_email_pwd)

const imapConfig = {
  user:process.env.receiving_email,
  password: process.env.receiving_email_pwd,
  host: "imap.gmail.com",
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
};

const endpointUrl = "https://example.com/webhook"; // Replace with actual endpoint



let webSocketURL='wss://api.apedata.net'

function getFormattedDates() {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  return {
    today: today.toLocaleDateString('en-US', options),
    yesterday: yesterday.toLocaleDateString('en-US', options),
  };
}

// let fromEmailString=['FROM', 'bunkers@clipperoil.com']
let fromEmailString=['FROM', 'kevin@clipperoil.com']
// let fromEmailString=['FROM', 'austinandogola@gmail.com']
let subJectString='SEA Card® OMSQuote Window Opened'


// function openInbox(callback) {
//   imap.openBox('INBOX', false, callback);
// }


function extractQuoteId(subject) {
  const match = subject.match(/Quote Request ID (\d+)/);
  return match ? match[1] : null;
}

function removeEmailNoticeAndDashes(str) {
    let index = str.indexOf("This email is intended");
    if (index !== -1) {
        let beforeText = str.slice(0, index); // Get text before "This email is intended"
        return beforeText.replace(/-+\s*$/, ''); // Remove trailing dashes and spaces
    }
    return str;
}

const sleep=(ms)=>{
  return new Promise((resolve,reject)=>{
    setTimeout(() => resolve(ms), ms)
  })
}

let imap 
let tt=false
const connectImap=()=>{
  function openInbox(imap, cb) {
    imap.openBox("INBOX", false, cb);
  }

  imap = new Imap(imapConfig);

  

  function checkEmails() {
    let handledUids=[]
    if (fs.existsSync(HANDLED_EMAILS)) {
           handledUids = JSON.parse(fs.readFileSync(HANDLED_EMAILS, 'utf8'));
    }else{
      handledUids=[]
    }
    // handledUids=filterLast10Hours(handledUids)
    let alreadyUids=handledUids.map(item=>(item.uid))
  
  
    
    imap.search(["UNSEEN",['SINCE', getFormattedDates().yesterday],fromEmailString], function (err, results) {
      console.log(err)
      console.log(results)
      if (err || !results.length){
  
      }else {
     
        const fetch = imap.fetch(results, { bodies: "" });
  
        fetch.on("message", function (msg) {
          let uid;
          msg.on('attributes', function (attrs) {
            uid = attrs.uid; // Store the UID for later use
          });
  
          msg.on("body", function (stream) {
            simpleParser(stream, async (err, parsed) => {
              if (err) return;
              let { from, subject,messageId,text } = parsed;
              text=removeEmailNoticeAndDashes(text)
              // console.log(text)
              // console.log(messageId)
              if(alreadyUids.includes(uid)){
                console.log('Already handled')
              
              }else{
                  if(subject.includes(subJectString)){
                  let fromEmail=from.value[0].address
                  let link=extractSeacardLinks(text)
                  console.log(link)
                  let quoteId=extractQuoteId(subject)
                  console.log(fromEmail, subject,quoteId)
                  let sendObj={getScrnShot:true,email:fromEmail,subject,url:link[0],uid,quoteId,messageId,text}
                  let send= await Promise.race([runBrowserScreenshot(sendObj),sleep(150000)])
                  // console.log(send)
                // sendMessage(JSON.stringify(sendObj))
                
              }
              }
              
              
            })
          })
        
        })
      }
  
      
    })
  }

  let intervalId=setInterval(() => {
    checkEmails();
  }, 45000);

  imap.once("ready", function () {
   
    openInbox(imap, function (err, box) {
      if (err) throw err;
      console.log("Connected to mailbox");
      imap.on("mail", function (ee) {
        console.log('Mail recieved')
        console.log(ee)
        clearInterval(intervalId);
        intervalId=setInterval(() => {
          checkEmails();
        }, 45000);
        checkEmails();
      });
    });
  });

  imap.once("error", function (err) {
    console.error(err);
  });
  
  imap.once("end", function () {
    // console.log("Connection ended,retrying...");
    console.log("Connection ended,retrying...");
    connectImap()
  });
  
  imap.connect();

  // if(!tt){
  //   tt=true
  //   setTimeout(()=>{
  //     console.log('Triggering timeout')
  //     imap.end()
  //   },15000)
  // }
  


}

connectImap()













function saveScreenshot(base64Data) {
  let timestamp=new Date().getTime()
  const base64Image = base64Data.replace(/^data:image\/png;base64,/, "");
  const filePath = path.join(__dirname, `screenshot_${timestamp}.png`);
  fs.writeFileSync(filePath, base64Image, "base64");
  return filePath;
}


function filterLast10Hours(data) {
    const now = Date.now(); // Current timestamp in milliseconds
    const tenHoursAgo = now - 10 * 60 * 60 * 1000; // 10 hours in milliseconds

    return data.filter(item => new Date(item.timestamp).getTime() >= tenHoursAgo);
}
async function sendEmail(attachmentPath,messageObj) {


  const {imageUrl,email,subject,uid,messageId,text}=messageObj
  
  
  // console.log(alreadyUids)

  
  let handledUids=[]
  if (fs.existsSync(HANDLED_EMAILS)) {
         handledUids = JSON.parse(fs.readFileSync(HANDLED_EMAILS, 'utf8'));
  }else{
    handledUids=[]
  }
  // handledUids=filterLast10Hours(handledUids)
  let alreadyUids=handledUids.map(item=>(item.uid))

  if(alreadyUids.includes(uid)){
    console.log('Already handled')
    return
  }

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user:process.env.receiving_email,
      pass: process.env.receiving_email_pwd
    },
  });

// console.log(email,subject,uid,messageId,text)
const emailText = text.replace(/\n/g, '<br>');
  let mailOptions = {
    from: process.env.receiving_email,
    to: email,
    inReplyTo: messageId,
    subject: `${subject}`,
    html: `
      <img src="cid:screenshot_cid" alt="Captured Screenshot" style="max-width: 100%; border: 1px solid #ddd; padding: 5px;"/>
      <br>
    ${emailText}`,
    attachments: [
      {
        filename: "screenshot.png",
        path: attachmentPath,
        cid: "screenshot_cid",
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    
    handledUids.push({timestamp:new Date().getTime(),uid})
    console.log("Email sent successfully!");
    fs.writeFileSync(HANDLED_EMAILS, JSON.stringify(handledUids));
    console.log('UID saved.');

    imap.addFlags(uid, ['\\Seen'], function (err) {
      if (err) console.log(`Error marking email as SEEN: ${err}`);
    });

    // Delete the screenshot after successful email send
    fs.unlink(attachmentPath, (err) => {
      if (err) console.error("Error deleting screenshot:", err);
      else console.log("Screenshot file deleted successfully.");
    });

  } catch (error) {
    console.error("Error sending email:", error);
  }

}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
