## Local development
```
yarn dev
```

### Setup / requirements

1. Create application / bot on [Discord's developer portal](https://discord.com/developers/applications)

2. Invite the Discord bot to your server with permissions:

    - Bot -> read message history
    - Bot -> send messages
    - Bot -> use slash commands
    - Bot -> read messages/view channels

3. Get an [OpenAI API](https://beta.openai.com/) key

4. Fill out `.env` file (see [`.env.example`](./.env.example))

5. Add server, output channel and whitelisted roles to the [temporary config](src/lib/config.ts)

5. Install dependencies
    ```
    yarn
    ```
