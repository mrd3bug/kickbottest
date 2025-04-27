# Kick API OAuth Client

This project implements the Kick API with OAuth 2.1, providing endpoints for App Access Token, User Access Token, and token management functionalities.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Endpoints](#endpoints)
- [License](#license)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/kick-api-oauth-client.git
   ```
2. Navigate to the project directory:
   ```
   cd kick-api-oauth-client
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Configuration

Create a `.env` file in the root directory based on the `.env.example` file. Fill in the required environment variables such as:

- `CLIENT_ID`
- `CLIENT_SECRET`
- `REDIRECT_URI`

## Usage

To start the server, run the following command:
```
npm start
```
The server will listen for incoming requests on the specified port.

## Endpoints

### Authentication

- `POST /auth/token` - Obtain an access token using the authorization code.
- `POST /auth/refresh` - Refresh an existing access token.

### Kick API

- `GET /api/some-endpoint` - Example endpoint to interact with the Kick API.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.