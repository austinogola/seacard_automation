
const sleep=(ms)=>{
  return new Promise(async(resolve, reject) => {
      setTimeout(()=>{
          resolve(ms)
      },ms)
  })
}

const  loadSelector=async(selector,all)=> {
  var found = false;
  var raf;
  let el
  let times=0
  return new Promise((resolve,reject)=>{
      (async function check(){
          // el=document.querySelectorAll(selector)
          el=$(selector)
          times+=1
          
          if (el && el[0]) {
              found = true;
              cancelAnimationFrame(raf);
              all?resolve(el):resolve(el[0])
              
              if(!found){
              raf = requestAnimationFrame(check);
              }
              
          
          } else if(times>=3){
              resolve(null)
          }
          else {
              await sleep(300)
              raf = requestAnimationFrame(check);
              // console.log('Not found ',selector);
          }
          })();
  })
}

chrome.runtime.onMessage.addListener(async(request,sender,sendResponse)=>{
  if(request==='check_page'){
      let tabUrl=window.location.href
      if(tabUrl.includes('supp_quote_search')){
           chrome.runtime.sendMessage({check_page:true, status:'logged in'})
      }
      else if(tabUrl.includes('login')){
           // chrome.runtime.sendMessage({check_page:true, status:'logged out'})
          chrome.storage.sync.get(["SEAusername", "SEApassword"], function (data) {
              data.SEAusername=data.SEAusername || "kevin.alameda"
                data.SEApassword=data.SEApassword || "Bunkers2025!@"
              if (data.SEAusername && data.SEApassword) {
                loadSelector("input.Username").then(targ=>{
                  console.log(targ)
                    targ.value=data.SEAusername 
                    loadSelector("input.Password").then(targ2=>{
                      console.log(targ2)
                        targ2.value=data.SEApassword
                        loadSelector("input[type='Submit']").then(targ3=>{
                            targ3.click()
                         })
                    })
                })
  
              }
             
          });

      }
      // loadSelector("span:contains('Search Quotes')").then(e=>{
      //     if(e)=>{
      //         chrome.runtime.sendMessage({check_page:true, status:'logged in'})
      //     }
      // })
      

      // loadSelector('')
  }
  if(request.type){
      if(request.type=='search_quote'){
          loadSelector("input#QUOTE_SEARCH_QUOTE_ID").then(e=>{
              e.value=request.quoteId
              loadSelector("input[value='Search']").then(e2=>{
                  e2.click()
              })
          })
      }

      if(request.type=='quote_search_status'){
          loadSelector(`span:contains('${request.quoteId}')`).then(e=>{
              console.log(e)
              // chrome.runtime.sendMessage({quote_search_status:true, status:'logged out'})
              loadSelector(`a:contains('View')`).then(e2=>{
                  console.log(e2)
                  e2.click()
                  // chrome.runtime.sendMessage({quote_search_status:true, status:'logged out'})
              })
          })
      }
  }
  if(request.credentials){
      const {pwd,user}=request
      loadSelector("input.Username").then(targ=>{
          targ.value=user
          loadSelector("input.Password").then(targ2=>{
              targ2.value=pwd
              loadSelector("input[type='Submit']").then(targ3=>{
                  targ3.click()
               })
          })
      })
  }

})