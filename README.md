# HPE-CTY-Scrumbot
3. Integration with Jira: Botpress has an in-built feature of workflow which will execute / say something when a transition leads to a particular node. Similarly, here we have added a javascript file-'jira-updated.js' that performs the search query in Jira Query Language(JQL). The scrum owner can receive notifications on both their emails and on the channel of communication(Slack/Microsoft Teams).
The Jira Issues are written into a seperate text file.
The text file is then mailed to the scrum-owner along with the conversation data as discussed earlier.

5. Postgres DB Integration: PostgreSQL is a powerful open-source relational database management system (RDBMS). It offers robust features, scalability, and extensibility, making it a popular choice for storing and managing data.
To integrate PostgreSQL with Botpress:
           1.Install PostgreSQL on your server or local machine.
           2.Create a new database for Botpress.
           3.Configure Botpress to connect to the PostgreSQL database by updating the configuration file.
           4.Restart Botpress to apply the configuration changes.
           5.Use Botpress's built-in database functions or PostgreSQL libraries to execute SQL queries to extract responses and perform database operations.
