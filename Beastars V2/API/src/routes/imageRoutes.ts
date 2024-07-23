import { Router } from "express";
import { getImage } from "../controllers/imageActions";

const router = Router();

router.route("/image/:action/:guildID/:imageID?/:imageName?").get((req, res) => {
    if (req.params.action === "get")
        return getImage(req, res);
})

export default router;