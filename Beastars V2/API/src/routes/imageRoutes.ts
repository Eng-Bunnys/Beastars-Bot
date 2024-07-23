import { Router } from "express";
import { addImage, getImage } from "../controllers/imageActions";
import { createErrorResponse } from "../utils/utils";

const router = Router();

router
  .route("/image/:action/:guildID/:imageID?/:imageName?")
  .get((req, res) => {
    if (req.params.action === "get") {
      return getImage(req, res);
    }
    return res
      .status(400)
      .json(
        createErrorResponse(
          'Invalid action for image GET request, did you mean to set the action to "get"?'
        )
      );
  })
  .post((req, res) => {
    if (req.params.action === "create") {
      return addImage(req, res);
    }
    return res
      .status(400)
      .json(
        createErrorResponse(
          'Invalid action for image POST request,1 did you mean to set the action to "create"?'
        )
      );
  });

export default router;
