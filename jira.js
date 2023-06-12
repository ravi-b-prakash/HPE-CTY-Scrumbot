const fs = require('fs');
const axios = require('axios');
// Define Jira API details
const baseUrl = 'base-url-of-project with REST API';
const projectKey = 'Project Key';

// Define your Jira email and API key
const email = 'Scrum master email';
const apiKey = 'Scrum master account API Key';

// Define the JQL (Jira Query Language) search query
const jql = `project = ${projectKey}`;

// Define the HTTP request headers
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Basic ${Buffer.from(`${email}:${apiKey}`).toString('base64')}`
};
const currentTime = new Date().toLocaleTimeString();
const currentDate = new Date().toLocaleDateString();

// Make a POST request to search for issues
axios.post(`${baseUrl}/search`, { jql }, { headers })
  .then(response => {
    // Process the response data
    const issues = response.data.issues;
    const totalIssues = issues.length;

    // Get the project name
    const projectName = totalIssues > 0 ? issues[0].fields.project.name : 'Unknown Project';

    // Format the issues as a string
    const issueList = issues.map(issue => `Issue ${issue.key}: ${issue.fields.summary}`).join('\n');

    // Create the output string with the project name and issue list
     const output = `Project: ${projectName}\nTotal Issues: ${totalIssues}\n\n${issueList}\n\nTime: ${currentTime}\nDate: ${currentDate}`;

    // Write the output to a text file
    fs.writeFileSync('jira_issues.txt', output);
    console.log('Output has been written to jira_issues.txt');
  })
  .catch(error => {
    console.error('Error occurred:', error.message);
  });
