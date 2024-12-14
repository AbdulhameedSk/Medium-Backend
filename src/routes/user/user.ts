import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { sign } from 'hono/jwt';
import { signupInput } from "@abdulhameed_0808/common";
export const UserRouter = new Hono<{ Bindings: {
    DATABASE_URL: string,
    JWT_SECRET: string
} }>();
UserRouter.post('/signup', async (c) => {
  const prisma = new PrismaClient({
      datasources: {
          db: {
              url: c.env.DATABASE_URL,
          },
      },
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const {success} = signupInput.safeParse(body);
  try {
      const existingUser = await prisma.user.findUnique({
          where: { email: body.email },
      });
      if (existingUser) {
           c.status(403)
          return c.json({ error: 'Email already in use' });
      }

      const user = await prisma.user.create({
          data: {
              email: body.email,
              password: body.password,
              name: body.name,
          },
      });
      // return c.json(user);
      const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
      return c.json({ jwt });
  } catch (error) {
      console.error('Error creating user:', error);
      c.status(403);
      return c.json({ error: 'User creation failed', details: (error as any).message });
  }
});

UserRouter.post('/signin', async (c) => {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: c.env.DATABASE_URL,
            },
        },
    }).$extends(withAccelerate());

    const body = await c.req.json();
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: body.email,
            },
        });
        if (!user) {
             c.status(403)
             return c.json({ error: 'User not found' });
        }
        if (user.password === body.password) {
            const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
            return c.json({ jwt });
        } else {
             c.status(403)
            return c.json({ error: 'Invalid password' });
        }
    } catch (error) {
        console.error('Error signing in:', error);
         c.status(403)
         return c.json({ error: 'Signin failed', details: (error as any).message });
    }
});