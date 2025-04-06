// import z from "zod";

// export const registerUserSchema = loginUserSchema.extend({
//       name: z.string().trim().min(3,{message:"Name must be at least 3 characters long"}).max(100,{message:"Name must be at most 100 characters long"}),
//       email: z.string().trim.email().min(6,{message:"Email must be at least 6 characters long"}).max(100,{message:"Email must be at most 100 characters long"}),
//       password: z.string().trim().min(6, {message:"Password must be at least 6 characters long"}).max(100,{message:"Password must be at most 100 characters long"}),

// })


// export const loginUserSchema = z.object({
//       email: z.string().trim.email().min(6,{message:"Email must be at least 6 characters long"}).max(100,{message:"Email must be at most 100 characters long"}),
//       password: z.string().trim().min(6, {message:"Password must be at least 6 characters long"}).max(100,{message:"Password must be at most 100 characters long"}),
// })

import z from "zod";

export const loginUserSchema = z.object({
  email: z.string().trim().email().min(6, { message: "Email must be at least 6 characters long" }).max(100, { message: "Email must be at most 100 characters long" }),
  password: z.string().trim().min(6, { message: "Password must be at least 6 characters long" }).max(100, { message: "Password must be at most 100 characters long" }),
});

export const registerUserSchema = loginUserSchema.extend({
  name: z.string().trim().min(3, { message: "Name must be at least 3 characters long" }).max(100, { message: "Name must be at most 100 characters long" }),
});


export const verifyEmailSchema = z.object({
  token:z.string().trim().length(8,{message:"Token must be 8 characters long"}),
  email:z.string().trim().email(),
});