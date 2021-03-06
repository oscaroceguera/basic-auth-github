import express, {Request, Response, Express} from 'express'
import fetch from 'node-fetch'
import cookieSession from 'cookie-session'

const app: Express = express()

const PORT: string | number = process.env.PORT || 4000

const client_id = process.env.GITHUB_CLIENT_ID
const client_secret= process.env.GITHUB_CLIENT_SECRET
const cookie_secreet = process.env.COOKIE_SECRET

app.use(cookieSession({
  secret: cookie_secreet
}))

app.get('/', (req: Request, res: Response) => {
  res.send('simple')
})

app.get('/login/github', (req: Request, res: Response): void => {
  const redirect_uri: string = "http://localhost:4000/login/github/callback";
  res.redirect(
    `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}`
  );
})

async function getAccessToken(code: string): Promise<any> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id,
      client_secret,
      code
    })
  })

  const data = await response.text()
  const params = new URLSearchParams(data)
  return params.get('access_token')
}

async function fetchGitHubUser(token: string) {
  const request = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: "token " + token
    }
  });
  return await request.json();
}


app.get('/login/github/callback', async (req: Request, res: Response): Promise<any> => {
  const code: string = req.query.code as string;
  const token = await getAccessToken(code)
  const githubData = await fetchGitHubUser(token)
  console.log('githubData', githubData)

  if (githubData) {
    req!.session!.githubId = githubData.id
    req!.session!.token = token
    res.redirect('/admin')
  } else {
    console.log('EERROR')
    res.send('Error happend')
  }
})

app.get('/admin', (req: Request, res: Response) => {
  if (req.session && req.session.githubId === 5040939) {
    res.send('HOla oscar <pre>' + JSON.stringify(req.session, null, 2))
  } else {
    res.redirect('/login/github')
  }
})

app.get('/logout', (req: Request, res: Response) => {
  if (req.session) req.session = null
  res.redirect('/')
})


app.listen(PORT, () => {
  console.log('Listening at port:', PORT)
})