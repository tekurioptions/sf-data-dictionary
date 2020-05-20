# sf-data-dictionary
Download and notate object data from Salesforce, allows for Excel generation.

TO RUN:  
1 - Clone repo.  
2 - Make sure you have a complete config.js file one level above the root of repo, copy and rename config_blank.js.  
3 - Npm install in both client and server projects.  
4 - Run 'npm run build' in client project to compile prod version.  
5 - Run 'npm run start' in server project.  
  
Application will only run on Candoris local network

# managed apps
Managed apps need to be created in org that you want to pull data from so that oauth functions correctly.  
Data Dictionary needs to have permissions for 'web', 'api', 'profile' and 'refresh_token'.

Full setup guide to come
