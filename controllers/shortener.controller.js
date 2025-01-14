import crypto from "crypto";

export const postShorterLink =
  (loadLinks, DATA_FILE, saveLinks) => async (req, res) => {
    try {
      const { url, shortCode } = req.body;
      const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

      const links = await loadLinks();

      if (links[finalShortCode]) {
        return res
          .status(400)
          .send("Short code already exists. Please choose another.");
      }

      links[finalShortCode] = url;

      await saveLinks(links);
      return res.redirect("/");
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal server error");
    }
  };
