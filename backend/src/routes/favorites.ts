import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from "../controllers/favorites";

const router = Router();

router.get("/", requireAuth, getFavorites);
router.post("/", requireAuth, addFavorite);
router.delete("/:recipe_id", requireAuth, removeFavorite);

export default router;