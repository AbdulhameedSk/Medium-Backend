import { Hono } from 'hono'

const app = new Hono();
import { UserRouter } from './routes/user/user'  
import { BlogRouter } from './routes/blog/blog'


app.route('/api/v1/user',UserRouter)
app.route('/api/v1/blog',BlogRouter)

export default app
