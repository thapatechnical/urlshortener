import z from "zod";

export const shortenerSchema = z.object({
      url : z
      .string({required_error:"URL is required"})
      .trim()
      .url({message:"Please enter a valid URL"})
      .min(2,{message:"URL must be at least 2 characters long"})
      .max(1024,{message:"URL must be at most 100 characters long"}),


      shortcode: z
      .string({required_error:"Shortcode is required"})
      .trim()
      .min(2,{message:"Shortcode must be at least 2 characters long"})
      .max(50,{message:"Shortcode must be at most 20 characters long"}),
});


