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

## Docker - Containerized Development Environment

To manage the docker-compose stack, it is recommended to use [Portainer](http://localhost:9000), or the vscode Docker plugin (Microsoft). You can also use these tools to view container logs.

The only workstation prerequisites are IDEs (vscode), plugins (e.g., Docker, Prettier), and Docker (Mac: Docker Desktop, Linux: Docker CE, Windows: Run Docker CE in a VM).

### Create docker-compose stack

1. npm install via Docker

```
./docker/tools init
```

2. Start Dev Environment

```
docker-compose -f docker/docker-compose.yml up -d
```

### Restart Server

```
docker-compose -f docker/docker-compose.yml up -d --force-recreate sf-data-dictionary-server-dev
```

This is also a vscode task named "Restart Server". You may also restart containers from Portainer.

### Build Deployment Container

```
docker build -f docker/Dockerfile . -t sf-data-dictionary
```

### Execute Local Deploy Container

```
docker-compose -f docker/compose-deploy.yml up -d
```

### Teardown

```
docker-compose -f docker/docker-compose.yml down [--volumes]
```

### Debug

In vscode, select the debug button in the bottom left corner of the window. This button is for `Select and start debug configuration` Select either the client or the server. Both can be run at once. Debugging the server also executes the task `Restart Server`.

### Docker Ports

| Port  | Service                 | URL                     |
| ----- | ----------------------- | ----------------------- |
| 8000  | Portainer Tunnel Server |
| 3000  | Development Client      | https://localhost:3000  |
| 32154 | Development Server      | https://localhost:32154 |
| 32155 | Deployment Server       | https://localhost:32155 |
| 9000  | Portainer Web UI        | http://localhost:9000   |
