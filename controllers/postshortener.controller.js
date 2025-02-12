import crypto from "crypto";
import {
  getAllShortLinks,
  getShortLinkByShortCode,
  insertShortLink,
} from "../services/shortener.services.js";

export const getShortenerPage = async (req, res) => {
  try {
    // const file = await readFile(path.join("views", "index.html"));
    // const links = await loadLinks();
    const links = await getAllShortLinks();

    return res.render("index", { links, host: req.host });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
  }
};

export const postURLShortener = async (req, res) => {
  try {
    const { url, shortCode } = req.body;
    const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

    // const links = await loadLinks();
    const link = await getShortLinkByShortCode(finalShortCode);

    if (link) {
      return res
        .status(400)
        .send("Short code already exists. Please choose another.");
    }

    // links[finalShortCode] = url;

    await insertShortLink({ url, shortCode: finalShortCode });
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
