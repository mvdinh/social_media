import express from "express";
import * as controller from "../controllers/group.controller.js";
import { verifyToken } from "../middleware/auth.js";
import multer from "multer";

const upload = multer({ dest: "uploads/" });
const router = express.Router();

router.post(
  "/",
  verifyToken,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
  ]),
  controller.createGroup
);

router.get("/me",verifyToken, controller.getMyGroups);

router.get("/join-requests", verifyToken, controller.getMyJoinRequests);
// router.get("/:groupId", controller.getGroupDetail);

// router.post("/:groupId/join-request", verifyToken, controller.requestJoinGroup);
// router.post("/approve", verifyToken, controller.approveJoin);

// router.post("/invite", verifyToken, controller.inviteMember);
// router.post("/remove", verifyToken, controller.removeMember);

// router.post("/:groupId/leave", verifyToken, controller.leaveGroup);

export default router;
