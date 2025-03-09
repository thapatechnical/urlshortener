import crypto from "crypto";
import {
  getAllShortLinks,
  getShortLinkByShortCode,
  insertShortLink,
  findShortLinkById,
  updateShortCode,
  deleteShortCodeById, // This is the correct function name
} from "../services/shortener.services.js";
import { z } from "zod";
import { error } from "console";

export const getShortenerPage = async (req, res) => {
  try {
    if (!req.user) return res.redirect("/login");

    const links = await getAllShortLinks(req.user.id);
    const error = req.flash("error"); // Use `error` instead of `errors`

    return res.render("index", {
      links,
      host: req.headers.host, // Use `req.headers.host` instead of `req.host`
      error, // Pass `error` to the template
      user: req.user, // Pass the user object to the template
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
  }
};

export const postURLShortener = async (req, res) => {
  try {
    if (!req.user) return res.redirect("/login");

    const { url, shortCode } = req.body;
    const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

    const link = await getShortLinkByShortCode(finalShortCode);

    if (link) {
      req.flash("error", "Short code already exists. Please choose another.");
      return res.redirect("/");
    }

    await insertShortLink({ url, shortCode: finalShortCode, userId: req.user.id });
    return res.redirect("/");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
  }
};

export const redirectToShortLink = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const link = await getShortLinkByShortCode(shortCode);
    if (!link) return res.status(404).send("404 error occurred");

    return res.redirect(link.url);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal server error");
  }
};

// getShortenerEditPage

export const getShortenerEditPage = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  console.log("Requested ID:", req.params.id); // Debugging: Log the requested ID

  const { data: id, error: idError } = z.coerce.number().int().safeParse(req.params.id);
  if (idError) {
    console.error("ID Parsing Error:", idError); // Debugging: Log the parsing error
    return res.redirect("/");
  }

  try {
    const shortLink = await findShortLinkById(id);
    if (!shortLink) {
      console.error("Short link not found for ID:", id); // Debugging: Log if the link is not found
      return res.status(404).send("404 error occurred");
    }

    res.render("edit-shortLink", {
      id: shortLink.id,
      url: shortLink.url,
      shortCode: shortLink.shortCode,
      errors: req.flash("errors"),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
  }
};

// export const postshortenerEditPage = async (req, res) => {
//   if (!req.user) return res.redirect("/login");

//   console.log("Requested ID:", req.params.id); // Debugging: Log the requested ID

//   const { data: id, error: idError } = z.coerce.number().int().safeParse(req.params.id);
//  if(error) return res.redirect("/404");
//   try {
//     const { url, shortCode } = req.body;
//     const newupdatedShortCode = await updateShortCode({id, url, shortCode});
//     if (!newupdatedShortCode) {
//       console.error("Short link not found for ID:", id); // Debugging: Log if the link is not found
//       return res.status(404).send("404 error occurred");
//       res.redirect("/");
//     }
//   } catch (error) {
//     if(error.code === "ER_DUP_ENTRY") {
//       req.flash("errors", "Short code already exists. Please choose another.");
//       return res.redirect(`/edit/${id}`);
//     };
//     console.error(error);
//     return res.status(500).send("Internal server error");
//   }

// }

// deleteshortcode


export const postshortenerEditPage = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  console.log("Requested ID:", req.params.id); // Debugging: Log the requested ID

  const { data: id, error: idError } = z.coerce.number().int().safeParse(req.params.id);
  if (idError) return res.redirect("/404");

  try {
    const { url, shortCode } = req.body;
    const newUpdatedShortCode = await updateShortCode({ id, url, shortCode });
    
    if (!newUpdatedShortCode) {
      console.error("Short link not found for ID:", id); // Debugging: Log if the link is not found
      return res.status(404).send("404 error occurred");
    }

    return res.redirect("/");

  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      req.flash("errors", "Short code already exists. Please choose another.");
      return res.redirect(`/edit/${id}`);
    }
    console.error(error);
    return res.status(500).send("Internal server error");
  }
};
export const deleteShortCode = async (req, res) => {
  try {
    const { data: id, error: idError } = z.coerce.number().int().safeParse(req.params.id);
    if(error) return res.redirect("/404");
 
    await deleteShortCodeById(id);
    return res.redirect("/");

  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
    
  }
};