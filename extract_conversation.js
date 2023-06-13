const { WebClient } = require('@slack/web-api');
const { Pool } = require('pg');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Slack API token
const slackToken = 'BOT O-AUTH TOKEN';

// Postgres database configuration
const pool = new Pool({
  user: 'ROLE',
  host: 'localhost',
  database: 'DATABASE_NAME',
  password: 'PASSWORD',
  port: 5432,
});

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'EMAIL-ID',
    pass: 'PASSWORD'
  }
});

// Create a Slack Web API client
const web = new WebClient(slackToken);

// Function to extract conversations and usernames
const extractConversations = async () => {
  try {
    // Query to fetch messages from the database
    const sql = `
      SELECT
        
        ms."name"::text AS name,
        mm.payload::text AS payload,
        mm."authorId"::text AS authorId,
        mm."conversationId" AS convId,
        mm."sentOn" AS sentOn,
        ROW_NUMBER() OVER (ORDER BY mm."sentOn") as rowNumber
      FROM msg_messages mm
      LEFT JOIN msg_usermap mu ON mm."authorId" = mu."userId"
      LEFT JOIN msg_senders ms ON mu."senderId" = ms."id"
      WHERE mm."sentOn" >= CURRENT_TIMESTAMP - INTERVAL '5 minutes'
      ORDER BY mm."sentOn"
    `;
    
    // Fetch messages from the database
    const { rows } = await pool.query(sql);
 
    // Conversation and username data
    const conversations = {};
    const usernames = {};
    
    // Process each message
    rows.forEach((row) =>
     {
      const payload= JSON.parse(row.payload);
      const text = payload.text;
      // const { convid, authorid, name } = row;
        if (text =='User visit')
        return;

        const id=row.convid;
        if (row.authorid != null ) {      
          if (
            text == 'Hey' || text =='Hi' || text == 'hey' || text == 'hi' || text =='User visit'
          ) {
            conversations[id] = conversations[id] || ''
          } else {
            conversations[id] += `${text}<br/>`
          }
        }
         else if (row.authorid == null) {
          if (
            text == 'Thank you for your time' ||
            text == 'Hey, How you doing? I am here to capture your daily status.' ||
            text == 'Task is blocked so raising flag'
          ) {
            conversations[id] = conversations[id] + '';
          } else {
            conversations[id] += `<strong>${text}</strong><br/>`
          }
        }
      
      // if (convid && authorid && name && text) {
      //   // Add message to the conversation
      //   conversations[convid] = conversations[convid] || '';
      //   conversations[convid] += `${text}<br/>`;
        
        // Fetch username if not already fetched
        if (!usernames[id]) {
          usernames[id] = web.users.info({ user: row.name })
          .then((result) => {
            const userName = result.user.real_name;
            return userName;
          })
          .catch((error) => {
            console.error('Error fetching username:', error);
            return null;
          });
      }
    });
    
    // Wait for all username promises to resolve
    const resolvedUsernames = await Promise.all(Object.values(usernames));
    
    // Conversation and username data in desired format
    const conversationData = Object.entries(conversations).map(([convId, conversation], index) => ({
      userName: resolvedUsernames[index],
      conversation
    }));
    
    // Generate HTML content
    const htmlContent = generateHTML(conversationData);
    
    // Save HTML file
    const filename = `conversation_${Date.now()}.html`;
    fs.writeFile(filename, htmlContent, (error) => {
      if (error) {
        console.error('Error saving HTML file:', error);
      } else {
        console.log(`Conversation data saved to ${filename}`);

        const mailOptions = {
          from: '',
          to: 'SCRUM OWNERS ID',
          subject: 'Conversation Data',
          html: '<p>Please find attached conversation data</p>',
          attachments: [
            {
              filename: `${filename}`,
              path: `./${filename}`
            },
            {
              filename: 'jira_issues.txt',
              path: './jira_issues.txt'
            }
          ]
        }

        transporter.sendMail(mailOptions, function(error, info) {
          if (error) {
            console.log(error)
          } else {
            console.log('Email sent: ' + info.response)
          }
        })


      }
    });
  } catch (error) {
    console.error('Error extracting conversations:', error);
  } finally {
    // Close the database connection
    pool.end();
  }
};

const currentTimestamp = new Date();
const options = { timeZone: 'Asia/Kolkata' };
const istTimestamp = currentTimestamp.toLocaleString('en-US', options);
// console.log(istTimestamp);

// Function to generate HTML content
const generateHTML = (conversationData) => {
  // Use a template engine or construct HTML string manually
  // Here, we construct HTML string manually for simplicity
  let html =`<!DOCTYPE html>
  <html lang="en">
  <head>
    <title>Scrumbot Console</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
   


<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
<style>
.fakeimg {
height: 450px;
background: #ffffff;

}
.footer {
position: fixed;
left: 0;
bottom: 0;
width: 100%;
background-color: #00AD82;
color: white;
text-align: center;
}
</style>
</head>
<body>




<div class="container">
<div class="row" style="background-color:#00AD82">

<div class="col-sm-12">
<h2 style="color: white">Scrumbot Console</h2>
<h4 style="color: white"> <div>${istTimestamp}</div> </h2>

<div class="panel panel-default">
<table class="table table-bordered table-striped">
 <thead class="thead-light">
  <tr>
    <th scope="col">S.No</th>
    <th scope="col">Name</th>
    <th scope="col">Status</th>
  </tr>
 </thead>
 </thead>
 <tbody>
   ${conversationData.map((data, index) => `
     <tr>
       <th scope="row">${index + 1}</th>
       <td>${data.userName}</td>
       <td>${data.conversation}</td>
     </tr>
   `).join('')}
 </tbody>
</table>
</div>
</div
</div>
</div>


<div class="footer">
<p>HPE Copyright@2020</p>
</div>


</body>
</html>
`;
  return html;
  
};

// Call the function to extract conversations
extractConversations();
