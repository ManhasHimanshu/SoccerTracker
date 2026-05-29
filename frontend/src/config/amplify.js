export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_sVAZ2G25m',
      userPoolClientId: '6ieadprtmqhjfcju1tvlhhvodc',
      loginWith: {
        oauth: {
          domain: 'sbt-auth-dev.auth.us-east-1.amazoncognito.com',
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: ['http://localhost:3000/callback'],
          redirectSignOut: ['http://localhost:3000'],
          responseType: 'code'
        }
      }
    }
  }
}

export const API_URL = 'https://wgntuniig1.execute-api.us-east-1.amazonaws.com/dev'