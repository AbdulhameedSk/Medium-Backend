import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { sign, verify,decode } from 'hono/jwt';

export const BlogRouter = new Hono<{ Bindings: {
  DATABASE_URL: string,
  JWT_SECRET: string
},
Variables: {
  userId: number
}
 }>();

//Middleware
BlogRouter.use("/*", async (c, next) => {
  const authHeader = c.req.header('Authorization')||"";
  const user = await verify(authHeader, c.env.JWT_SECRET);

try{
  if (user) {
    c.set('userId', (user as any)?.id);
    await next();
  } else {
    c.status(403);
    return c.json({ message: 'Invalid token' });
  }
}catch{
  c.status(403);
  return c.json({ message: 'Invalid token' });
}
});



// Create a blog post
BlogRouter.post('/', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
	const userId = c.get('userId');
  console.log(userId);
  
  try {
    const blog = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: userId.toString(),
      },
    });
    return c.json(blog);
  } catch (error) {
    return c.json({ error: 'Blog creation failed', details: (error as any).message }, 403);
  }
});

// Update a blog post
BlogRouter.put('/', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();

  try {
    const blog = await prisma.post.update({
      where: { id: body.id },
      data: {
        title: body.title,
        content: body.content,
      },
    });
    return c.json(blog);
  } catch (error) {
    return c.json({ error: 'Blog update failed', details: (error as any).message }, 403);
  }
});

// Fetch all blog posts
BlogRouter.get('/bulk', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const blogs = await prisma.post.findMany();
    return c.json(blogs);
  } catch (error) {
    return c.json({ error: 'Failed to fetch blogs', details: (error as any).message }, 403);
  }
});

// Fetch a single blog post by ID
BlogRouter.get('/:id', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

const body= await c.req.json();
  try {
    const blog = await prisma.post.findUnique({
      where: { id:c.req.param("id") },
    });

    if (!blog) {
      return c.json({ error: 'Blog not found' }, 404);
    }

    return c.json(blog);
  } catch (error) {
    return c.json({ error: 'Failed to fetch blog', details: (error as any).message }, 403);
  }
});

// Delete a blog post by ID
BlogRouter.delete('/', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

const body= await c.req.json();
  try {
    await prisma.post.delete({
      where: { id:body.id },
    });
    return c.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    return c.json({ error: 'Blog deletion failed', details: (error as any).message }, 403);
  }
});

export default BlogRouter;