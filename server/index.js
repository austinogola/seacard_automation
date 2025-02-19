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



const wss=new WebSocket.Server({server:server})

const messageListeners = [];

const connectedClients = new Map()


// TypeScript: import ytdl from 'ytdl-core'; with --esModuleInterop
// TypeScript: import * as ytdl from 'ytdl-core'; with --allowSyntheticDefaultImports
// TypeScript: import ytdl = require('ytdl-core'); with neither of the above

// ytdl('https://www.youtube.com/watch?v=shDI1W5ZXV4')
//   .pipe(fs.createWriteStream('video2.mp4'));



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
      await sendEmail(filePath,email,subject,uid,messageId);
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

console.log(process.env.first_email)
console.log(process.env.first_email_pwd)

const imapConfig = {
  user:process.env.first_email,
  password: process.env.first_email_pwd,
  host: "imap.gmail.com",
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
};

const endpointUrl = "https://example.com/webhook"; // Replace with actual endpoint

function openInbox(imap, cb) {
  imap.openBox("INBOX", false, cb);
}

const imap = new Imap(imapConfig);

imap.once("ready", function () {
    console.log("hhhh")
  openInbox(imap, function (err, box) {
    if (err) throw err;
    console.log("Connected to mailbox");
    imap.on("mail", function (ee) {
      console.log('Mail recieved')
      console.log(ee)
      checkEmails();
    });
  });
});

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
// setInterval(() => {
//   checkEmails();
// }, 15000);

// function openInbox(callback) {
//   imap.openBox('INBOX', false, callback);
// }

// let screenShotUrl='https://seacardsys.com/cgi-bin/dashboard'
let screenShotUrl='https://seacardsys.com/cgi-bin/oms_supp_quote_search'
function extractQuoteId(subject) {
  const match = subject.match(/Quote Request ID (\d+)/);
  return match ? match[1] : null;
}

function checkEmails() {
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
            const { from, subject,messageId } = parsed;
            console.log(messageId)
            if(subject.includes(subJectString)){
              let fromEmail=from.value[0].address
              let quoteId=extractQuoteId(subject)
              console.log(fromEmail, subject,quoteId)
              sendMessage(JSON.stringify({getScrnShot:true,email:fromEmail,subject,url:screenShotUrl,uid,quoteId,messageId}))
              
            }
            
          })
        })
      
      })
    }

    
  })
}

imap.once("error", function (err) {
  console.error(err);
});

imap.once("end", function () {
  console.log("Connection ended");
});

imap.connect();


function saveScreenshot(base64Data) {
  let timestamp=new Date().getTime()
  const base64Image = base64Data.replace(/^data:image\/png;base64,/, "");
  const filePath = path.join(__dirname, `screenshot_${timestamp}.png`);
  fs.writeFileSync(filePath, base64Image, "base64");
  return filePath;
}

async function sendEmail(attachmentPath,toEmail,subj,uid,messageId) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user:process.env.first_email,
      pass: process.env.first_email_pwd
    },
  });

  let mailOptions = {
    from: process.env.first_email,
    to: toEmail,
    inReplyTo: messageId,
    references: messageId,
    subject: `${subj}`,
    html: `
      <img src="cid:screenshot_cid" alt="Captured Screenshot" style="max-width: 100%; border: 1px solid #ddd; padding: 5px;"/>
    `,
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
    console.log("Email sent successfully!");

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

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
