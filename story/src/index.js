import express from "express";
import storyRoutes from "./routers/Story.js";

const app = express();
app.use(express.json());

app.use("/", storyRoutes);

app.listen(5000, () => {
  console.log("Server chạy tại http://localhost:5000");
});
