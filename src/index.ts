import express from "express";
import prisma from "./prisma"; // should already import Prisma client
import schoolRoutes from "./routes/schoolRoutes";

const app = express();
app.use(express.json());

app.use("/api/schools", schoolRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
