const fs = require('fs');

const { Vonage } = require('@vonage/server-sdk');

let vonage;
   
let step = 'SET_API_KEY';
console.log('Vonage setup utility for Github Codespaces -- press "q" to exit');
console.log('This utility will need your Vonage API key and API secret. They will be saved to your .env file,');
console.log('where they will be visible only to you and collaborators on this project.');
console.log('Find your API key and secret at: https://dashboard.vonage.com/getting-started-guide');
console.log('process.env.CODESPACE_NAME: ', process.env.CODESPACE_NAME);
console.log('Enter your API Key:');
let input = process.stdin;
input.on('data', data => {
  
  if (data.toString().trim() === 'q') {
    // exit 
    return process.exit();
  }
  
  switch (step) {
    case 'SET_API_KEY':
      return setApiKey(data);
      break;
    case 'SET_API_SECRET':
      return setApiSecret(data);
      break;
    case 'SET_APP_NAME':
      return setAppName(data);
      break;
    case 'BUY_NUMBER':
      return buyNumberQuestion(data);
      break;
    case 'SET_COUNTRY_CODE':
      return setCountryCode(data);
      break;
    case 'ENTER_PHONE_NUMBER':
      return updatePhoneNumber(data);
      break;
    default:
  }
  

});

function setApiKey(data) {
  if (data.toString().replace(/\n/g, '').length === 0 || data.toString().replace(/\n/g, '') === ' ') {
    console.log('(Can not be blank.) Enter you API key:');
  } else {
    process.env.VONAGE_API_KEY = data.toString().replace(/\n/g, '');
    step = 'SET_API_SECRET';
    console.log('Enter you API secret:');
  }
  return true;
}

function setApiSecret(data) {
  if (data.toString().replace(/\n/g, '').length === 0 || data.toString().replace(/\n/g, '') === ' ') {
    console.log('(Can not be blank.) Enter you API secret:');
  } else {
    process.env.VONAGE_API_SECRET = data.toString().replace(/\n/g, '');
    step = 'SET_APP_NAME';
    console.log('Enter a name for your Application:');
  }
  return true;
}

function setAppName(data) {
  if (data.toString().replace(/\n/g, '').length === 0 || data.toString().replace(/\n/g, '') === ' ') {
    console.log('(Can not be blank.) Enter a name for your Application:');
  } else {
    createApp(data); 

  }
  return true;
}

function buyNumberQuestion(data) {
  // console.log("data:", data);
  if (data.toString().replace(/\n/g, '').length === 0 || data.toString().replace(/\n/g, '') === ' ') {
    console.log('(Can not be blank.) Want to Buy a number? (Y/N):');
  } else {
    if (data.toString().replace(/\n/g, '').toLowerCase() === 'y'){
    //   process.env.VONAGE_API_SECRET = data.toString().replace(/\n/g, '');
      step = 'SET_COUNTRY_CODE';
      console.log('Set the country code for your number (ex. US or GB):');      
    } 
  }
  return true;
}

function setCountryCode(data) {
  if (data.toString().replace(/\n/g, '').length === 0 || data.toString().replace(/\n/g, '') === ' ') {
    console.log('(Can not be blank.) Set the country code for your number (ex. US or GB):');
  } else {
    buyPhoneNumber(data)      
  }
  return true;
}

function buyPhoneNumber(data){
  const countryCode = data.toString().replace(/\n/g, '');
  process.env.COUNTRY_CODE = data.toString().replace(/\n/g, '').toUpperCase();
  //Search for a number
    console.log('Searching for a number in country: ', countryCode);
    vonage.numbers.getAvailableNumbers({
        country: process.env.COUNTRY_CODE,
        features: ['VOICE', 'SMS'],
    })
    .then((results) => {
      const numbers = results.numbers;
      console.log('Found numbers: ', numbers);
      // Purchase a number
      if (numbers.length === 0) {
          console.log('No numbers found in this country. Please try another country code.');
          return;
      }
      console.log('Found a number: ', numbers[0].msisdn);
      vonage.numbers.buyNumber({
          country: numbers[0].country,
          msisdn: numbers[0].msisdn,
      })
      .then((result) => {
          console.log('Bought the number!');
          updatePhoneNumber(numbers[0]);
      })
      .catch((error) => {
          console.error("Error buying number:", error);
      });
        // vonage.number.buy(numbers[0].country, numbers[0].msisdn, function(err, res) {
      //     if(err) {
      //         console.error(err);
      //     }
      //     else {
      //         console.log('Bought the number!');
      //         updatePhoneNumber(numbers[0]);
      //     }
      // });
      

      // for (const number of numbers) {
      // console.log(number);
      // }
    })
    .catch((error) => {
        console.error(error)
    });
//   nexmo.number.search(countryCode, {features: 'VOICE,SMS'}, function(err, res) {
//     if(err) {
//       console.error(err);
//     }
//     else {
//       const numbers = res.numbers;
//       console.log('Found a number: ', numbers[0].msisdn);
//       // Purchase a number
//       nexmo.number.buy(numbers[0].country, numbers[0].msisdn, function(err, res) {
//         if(err) {
//           console.error(err);
//         }
//         else {
//           console.log('Bought the number!');
//           updatePhoneNumber(numbers[0]);
//         }
//       });
//     }
//   });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function updatePhoneNumber(number) {
  console.log('Adding phone number to application...');
  const options = {
    msisdn: number.msisdn,
    voiceCallbackType: 'app',
    voiceCallbackValue: process.env.VONAGE_APPLICATION_ID,
    messagesCallbackType: 'app',
    messagesCallbackValue: process.env.VONAGE_APPLICATION_ID,
    voiceStatusCallback: `https://${process.env.CODESPACE_NAME}.github.dev/webhooks/event`,
    moHttpUrl: `https://${process.env.CODESPACE_NAME}.github.dev/webhooks/inbound`
  };
  await sleep(10000);

  const resp = await vonage.numbers.updateNumber(options);
  if (resp.errorCode) {
    console.error(`Error: ${resp.errorCodeLabel}`);
  } else {
    console.log('Added number to application!');
    process.env.VONAGE_NUMBER = number.msisdn;
    writeEnv();
  }

  // vonage.number.update(number.country, number.msisdn, options, function(err, res) {
  //   if(err) {
  //     console.error(err);
  //   }
  //   else {
  //     console.log('Added number to application!');
  //     process.env.VONAGE_NUMBER = number.msisdn;
  //     writeEnv();
  //   }
  // });    
}

function createApp(data) {
  console.log('Creating your Application...');
  vonage = new Vonage({
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET
  }, {
      debug: false
  });

  vonage.applications.createApplication({
      name: data.toString().replace(/\n/g, ''),
      capabilities: {
          voice: {
              webhooks: {
                  answer_url: {
                      address: `https://${process.env.CODESPACE_NAME}.github.dev/webhooks/answer`,
                      http_method: "GET"
                  },
                  event_url: {
                      address: `https://${process.env.CODESPACE_NAME}.github.dev/webhooks/event`,
                      http_method: "POST"
                  }
              }
          },
          messages: {
              webhooks: {
                  inbound_url: {
                      address: `https://${process.env.CODESPACE_NAME}.github.dev/webhooks/inbound`,
                      http_method: "POST"
                  },
                  status_url: {
                      address: `https://${process.env.CODESPACE_NAME}.github.dev/webhooks/status`,
                      http_method: "POST"
                  }
              }
          },
          rtc: {
              webhooks: {
                  event_url: {
                      address: `https://${process.env.CODESPACE_NAME}.github.dev/webhooks/rtcevent`,
                      http_method: "POST"
                  }
              }
          }
      }
//   }, (error, result) => {
//       if(error) {
//         console.error('Error creating Application: ', error);
//         process.exit();
//       }
//       else {
//         console.log('Application created with ID: ', result.id);
//         process.env.VONAGE_APPLICATION_ID = result.id;
//         fs.writeFile(__dirname + '/private.key', result.keys.private_key, (err) => {
//           if (err) {
//             console.log('Error writing private key: ', err);
//           } else {
//             console.log('Private key saved to /private.key');
//             //Search and Buy phone number
//             process.env.VONAGE_APPLICATION_NAME = data.toString().replace(/\n/g, '');
//             step = 'SET_COUNTRY_CODE';
//             console.log('Set the country code for your number (ex. US or GB):');      
//           }
//         });
//       }
  }).then((app) => {
      console.log('Application created with ID: ', app.id);
      process.env.VONAGE_APPLICATION_ID = app.id;
      fs.writeFile(__dirname + '/private.key', app.keys.private_key, (err) => {
        if (err) {
          console.log('Error writing private key: ', err);
        } else {
          console.log('Private key saved to /private.key');
          //Search and Buy phone number
          process.env.VONAGE_APPLICATION_NAME = data.toString().replace(/\n/g, '');
          step = 'BUY_NUMBER';
          console.log('Want to Buy a number? (Y/N):');
        }
      });
  }).catch((error) => {
      console.error('Error creating Application: ', error);
      process.exit();
  });
  return true;  
}

function writeEnv() {
  const contents = `ADMIN_NAME="${process.env.ADMIN_NAME}"
ADMIN_PASSWORD="${process.env.ADMIN_PASSWORD}"
VONAGE_API_KEY="${process.env.VONAGE_API_KEY}"
VONAGE_API_SECRET="${process.env.VONAGE_API_SECRET}"
VONAGE_APPLICATION_NAME="${process.env.VONAGE_APPLICATION_NAME}"
VONAGE_APPLICATION_ID="${process.env.VONAGE_APPLICATION_ID}"
COUNTRY_CODE="${process.env.COUNTRY_CODE}"
VONAGE_NUMBER="${process.env.VONAGE_NUMBER}"
VONAGE_PRIVATE_KEY="/private.key"`;
  
  fs.writeFile(__dirname + '/.env', contents, (err) => {
    if (err) {
      console.log('Error writing .env file: ',err);
    } else {
      console.log('Environment variables saved to .env');
      process.exit();
    }
  });

}

function createUser() {
    //create user
  const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
  applicationId: process.env.VONAGE_APPLICATION_ID,
  privateKey: __dirname + process.env.VONAGE_PRIVATE_KEY
  }, {debug: false});
  vonage.users.create({
      name: process.env.ADMIN_NAME,
      display_name: process.env.ADMIN_NAME
  },(err, response) => {
      if (err) {
        console.log('Error creating user: ',err);
      } else {
        console.log('User created. ID: ', response.id);
        process.exit();
      }
  });

}