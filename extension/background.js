
let SOCKET
let SOCKET_CONNECTED = false;
let webSocketURL='ws://127.0.0.1:3000/'

// let webSocketURL='wss://seacardautomation-production.up.railway.app/'

let screenshotQueue = [];
let isProcessing = false;

// chrome.cookies.get({},alk=>{
//     console.log(alk)
// })



const getTime=()=>{
    const now = new Date();

// Get the current time components (hours, minutes, seconds)
const hours = now.getHours();
const minutes = now.getMinutes();
const seconds = now.getSeconds();

// Format the time components as a string
const timeString = `${hours}:${minutes}:${seconds}`;

return(timeString)
}

const sleep=(ms)=>{
    return new Promise(async(resolve, reject) => {
        setTimeout(()=>{
            resolve(ms)
        },ms)
    })
}

async function captureScreenshotFromUrl(dataObj) {
    return new Promise((resolve, reject) => {
      chrome.tabs.create({ url, active: false }, (tab) => {
        if (!tab) return reject("Failed to open tab");
  
        // Wait for the page to fully load
        

      });
    });
  }
  
  let credentialsObj={
    user:'chad.indihar',
    pwd:'CLIPPerOil2025#$%^'
  }

  const handleQuoteSearch=(tab,dataObj)=>{
    return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id,{type:'search_quote',quoteId:dataObj.quoteId});
    chrome.tabs.onUpdated.addListener(function listener1(tabId, changeInfo) {
        if (tabId === tab.id && changeInfo.status === "complete") {
            console.log('Second done')
            chrome.tabs.onUpdated.removeListener(listener1);
            chrome.tabs.sendMessage(tab.id,{type:'quote_search_status',quoteId:dataObj.quoteId});

            chrome.tabs.onUpdated.addListener(function listener2(tabId, changeInfo) {
                if (tabId === tab.id && changeInfo.status === "complete") {
                    console.log('Third done')
                    // Take screenshot
                      chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, (dataUrl) => {
                        if (chrome.runtime.lastError || !dataUrl) {
                            screenshotQueue.push(dataObj)
                          reject("Screenshot failed: " + chrome.runtime.lastError?.message);
                          return 
                        }
            

                        // console.log(dataUrl)
                        sendScreenshotToServer(dataUrl,dataObj);
            
                        // Check if another tab remains open before closing
                        chrome.tabs.query({}, (tabs) => {
                          if (tabs.length > 1) {
                            chrome.tabs.remove(tab.id);
                          }
                          resolve();
                        });
                      });
                    }
                })
            }
        })
    })
  }
const captureScreenShot=(dataObj)=>{
    return new Promise(async(resolve, reject) => {

        if(dataObj && dataObj.url){
            console.log("Taking screenshot")
            chrome.tabs.create({url:dataObj.url,active:true},async tab=>{
                chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                    if (tabId === tab.id && changeInfo.status === "complete") {
                        console.log('complete')
                        

                          chrome.runtime.onMessage.addListener(async function pageChecker(request,sender,sendResponse){
                                if(request.check_page){
                                    console.log(request)
                                    if(request.status=='logged out'){
                                        chrome.tabs.sendMessage(tab.id,{credentials:'true',...credentialsObj})
                                    }else if(request.status=='logged in'){
                                        chrome.tabs.onUpdated.removeListener(listener);
                                        chrome.runtime.onMessage.removeListener(pageChecker)
                                        await handleQuoteSearch(tab,dataObj)
                                        console.log('DONE')
                                        resolve('')
                                        
                                    }
                                    
                                    
                                }

                            })

                          chrome.tabs.sendMessage(tab.id,'check_page');


                
                    //   Take screenshot
                    //   chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, (dataUrl) => {
                    //     if (chrome.runtime.lastError || !dataUrl) {
                    //       return reject("Screenshot failed: " + chrome.runtime.lastError?.message);
                    //     }
            
                    //     sendScreenshotToServer(dataUrl,dataObj);
            
                    //     // Check if another tab remains open before closing
                    //     chrome.tabs.query({}, (tabs) => {
                    //       if (tabs.length > 1) {
                    //         chrome.tabs.remove(tab.id);
                    //       }
                    //       resolve();
                    //     });
                    //   });
                    }
                  });
                
            })
        }else{
            resolve(null)
        }
        
    })
    
    
}

// captureScreenShot({url:'https://seacardsys.com/cgi-bin/oms_supp_quote_search',quoteId:'15034'})

const sendScreenshotToServer=(imageUrl,dataObj)=>{
    return new Promise(async(resolve, reject) => {
        let feedBack=JSON.stringify({imageUrl,...dataObj})
        SOCKET.send(feedBack)
        // fetch(imageUrl)
        // .then(res => res.blob())
        // .then(blob => {
        //     let formData = new FormData();
        //     formData.append("screenshot", blob, "screenshot.png");
        //     console.log(formData,dataObj)

        // })
    })
}

async function processQueue() {
    if (isProcessing || screenshotQueue.length === 0) return;
  
    isProcessing = true;
    let reqObj = screenshotQueue.shift(); // Get the next URL
  
    try {
      await captureScreenShot(reqObj);
    } catch (error) {
      console.error("Error processing screenshot:", error);
    }
  
    isProcessing = false;
    processQueue(); // Check if more requests are in the queue
  }


const attemptConnection=()=>{
    try {

        console.log("Attempting connection")
        const reconnect=()=>{
            SOCKET.removeEventListener('open',whenConnected)

            SOCKET.removeEventListener('close',whenClosed)

            SOCKET.removeEventListener('error',whenErrored)

            SOCKET.removeEventListener('message', whenMessaged);

            attemptConnection()
        }

        const whenConnected=()=>{
            console.log('WebSocket connection established',getTime());
            SOCKET_CONNECTED=true
        }

        const whenClosed=()=>{
            console.log('WebSocket connection closed',getTime());
            SOCKET_CONNECTED=false
            reconnect()
            // if(SOCKET_CONNECTED==false){
            //     console.log('WebSocket connection closed: Retrying',getTime());
            //     attemptConnection()
            // }
        }

        const whenErrored=()=>{
            console.log('WebSocket connection errored',getTime());
            SOCKET_CONNECTED=false
            reconnect()
            // if(SOCKET_CONNECTED==false){
            //     console.log('WebSocket connection closed: Retrying',getTime());
            //     attemptConnection()
            // }
        }

        const whenMessaged=async(event)=>{
            const {data}=event
            console.log('Received message');
           const dataObj=JSON.parse(data)
           console.log(dataObj)

           if(dataObj.getScrnShot){
            screenshotQueue.push(dataObj);
            processQueue()
           }

        //    let clientId=dataObj['clientId']

        //    if(dataObj['getProfile']){
        //         let profileObj=dataObj['getProfile']
        //         const {reqId}=profileObj
        //         let profileAns=await getProfileByApi(profileObj)
                
        //         let feedBack=JSON.stringify({profile:profileAns,clientId,reqId})
        //         SOCKET.send(feedBack)
        //    }
           
           
        }
        try{
            SOCKET = new WebSocket(webSocketURL);
            SOCKET.addEventListener('open',whenConnected)

            SOCKET.addEventListener('close',whenClosed)

            SOCKET.addEventListener('error',whenErrored)

            SOCKET.addEventListener('message', whenMessaged);
        } catch (error) {
            console.log('Error connecting');
        }
        

        // SOCKET.onmessage = whenMessaged

        





        

        // SOCKET.addEventListener('error',()=>{
        //     SOCKET_CONNECTED=false
        //     setTimeout(()=>{
        //         if(SOCKET_CONNECTED==false){
        //             console.log('WebSocket connection errored: Retrying',getTime());
        //             attemptConnection()
        //         }
        //     }, 5000);
        // })

        

          
        
    } catch (error) {
        console.log(error.message);
    }
  }

  attemptConnection()