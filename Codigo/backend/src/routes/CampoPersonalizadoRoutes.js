import { Router } from "express";
import CampoController from "../controllers/CampoController.js";

const router = Router();

router.get("/", CampoController.index);
router.get("/:id", CampoController.show);

router.get("/option/:option/:id", CampoController.getByOption);
router.post("/option/:option/:id", CampoController.createByOption);

router.post("/", CampoController.store);
router.put("/:id", CampoController.update);
router.delete("/:id", CampoController.destroy);

export default router;
