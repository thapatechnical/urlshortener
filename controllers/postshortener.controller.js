import crypto from "crypto";
import {
  deleteShortCodeById,
  findShortLinkById,
  getAllShortLinks,
  getShortLinkByShortCode,
  insertShortLink,
  updateShortCode,
} from "../services/shortener.services.js";
import z from "zod";
import {
  shortenerSchema,
  shortenerSearchParamsSchema,
} from "../validators/shortener-validator.js";

export const getShortenerPage = async (req, res) => {
  try {
    if (!req.user) return res.redirect("/login");

    const searchParams = shortenerSearchParamsSchema.parse(req.query);

    // const links = await getAllShortLinks(req.user.id);
    const { shortLinks, totalCount } = await getAllShortLinks({
      userId: req.user.id,
      limit: 10,
      offset: (searchParams.page - 1) * 10,
    });

    console.log("searchParams: ", searchParams.page);

    // totalCount = 100
    const totalPages = Math.ceil(totalCount / 10);

    return res.render("index", {
      links: shortLinks,
      host: req.host,
      currentPage: searchParams.page,
      totalPages: totalPages,
      errors: req.flash("errors"),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
  }
};

export const postURLShortener = async (req, res) => {
  try {
    if (!req.user) return res.redirect("/login");

    // const { url, shortCode } = req.body;

    const { data, error } = shortenerSchema.safeParse(req.body);
    console.log(data, error);

    if (error) {
      const errorMessage = error.errors[0].message;
      req.flash("errors", errorMessage);
      return res.redirect("/");
    }

    const { url, shortCode } = data;

    const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

    // const links = await loadLinks();
    const link = await getShortLinkByShortCode(finalShortCode);

    if (link) {
      // return res
      //   .status(400)
      //   .send("Short code already exists. Please choose another.");
      req.flash(
        "errors",
        "Url with that shortcode already exists, please choose another"
      );
      return res.redirect("/");
    }

    // links[finalShortCode] = url;

    await insertShortLink({
      url,
      shortCode: finalShortCode,
      userId: req.user.id,
    });
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
    console.log("🚀 ~ redirectToShortLink ~ li̥nk:", link);

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
  // const id = req.params;
  const { data: id, error } = z.coerce.number().int().safeParse(req.params.id);
  if (error) return res.redirect("/404");

  try {
    const shortLink = await findShortLinkById(id);
    if (!shortLink) return res.redirect("/404");

    res.render("edit-shortLink", {
      id: shortLink.id,
      url: shortLink.url,
      shortCode: shortLink.shortCode,
      errors: req.flash("errors"),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal server error");
  }
};

// postShortenerEditPage
export const postShortenerEditPage = async (req, res) => {
  if (!req.user) return res.redirect("/login");
  // const id = req.params;
  const { data: id, error } = z.coerce.number().int().safeParse(req.params.id);
  if (error) return res.redirect("/404");

  try {
    const { url, shortCode } = req.body;
    const newUpdateShortCode = await updateShortCode({ id, url, shortCode });
    if (!newUpdateShortCode) return res.redirect("/404");

    res.redirect("/");
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      req.flash("errors", "Shortcode already exists, please choose another");
      return res.redirect(`/edit/${id}`);
    }

    console.error(err);
    return res.status(500).send("Internal server error");
  }
};

// deleteShortCode
export const deleteShortCode = async (req, res) => {
  try {
    const { data: id, error } = z.coerce
      .number()
      .int()
      .safeParse(req.params.id);
    if (error) return res.redirect("/404");

    await deleteShortCodeById(id);
    return res.redirect("/");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal server error");
  }
};
