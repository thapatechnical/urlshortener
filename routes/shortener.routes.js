import { Router } from "express";
import {
  postURLShortener,
  getShortenerPage,
  redirectToShortLink,
  getShortenerEditPage,
  postshortenerEditPage,
  deleteShortCode
} from "../controllers/postshortener.controller.js";

const router = Router();

router.get("/", getShortenerPage);

router.post("/", postURLShortener);

router.get("/:shortCode", redirectToShortLink);

router.route("/edit/:id").get(getShortenerEditPage).post(postshortenerEditPage);

router.route("/delete/:id").post(deleteShortCode);


//default export
// export default router;

// Named exports
export const shortenerRoutes = router;
