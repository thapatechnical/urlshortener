import { readFile, writeFile } from "fs/promises";
import path from "path";
import { Router } from "express";
import crypto from "crypto";

const router = Router();

const DATA_FILE = path.join("data", "links.json");

const loadLinks = async () => {
  try {
    const data = await readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeFile(DATA_FILE, JSON.stringify({}));
      return {};
    }
    throw error;
  }
};

const saveLinks = async (links) => {
  await writeFile(DATA_FILE, JSON.stringify(links));
};

router.get("/report", (req, res) => {
  const student = [
    {
      name: "Aarav",
      grade: "10th",
      favoriteSubject: "Mathematics",
    },
    { name: "Ishita", grade: "9th", favoriteSubject: "Science" },
    { name: "Rohan", grade: "8th", favoriteSubject: "History" },
    { name: "Meera", grade: "10th", favoriteSubject: "English" },
    { name: "Kabir", grade: "11th", favoriteSubject: "Physics" },
  ];
  return res.render("report", { student });
});

router.get("/", async (req, res) => {
  try {
    const file = await readFile(path.join("views", "index.html"));
    const links = await loadLinks();

    const content = file.toString().replaceAll(
      "{{ shortened_urls }}",
      Object.entries(links)
        .map(([shortCode, url]) => {
          url = url.length >= 30 ? `${url.slice(0, 30)}...` : url;
          return `<li><a href="/${shortCode}" target="_blank">${req.host}/${shortCode}</a> - ${url}</li>`;
        })
        .join("")
    );
    return res.send(content);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal server error");
  }
});

router.post("/", async (req, res) => {
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
});

router.get("/:shortCode", async (req, res) => {
  try {
    const { shortCode } = req.params;
    const links = await loadLinks();

    if (!links[shortCode]) return res.status(404).send("404 error occurred");

    return res.redirect(links[shortCode]);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal server error");
  }
});

//default export
// export default router;

// Named exports
export const shortenerRoutes = router;
