import { Router } from "express";
import {
  postURLShortener,
  getShortenerPage,
  redirectToShortLink,
} from "../controllers/postshortener.controller.js";

const router = Router();

router.get("/", getShortenerPage);

router.post("/", postURLShortener);

router.get("/:shortCode", redirectToShortLink);

//default export
// export default router;

// Named exports
export const shortenerRoutes = router;
