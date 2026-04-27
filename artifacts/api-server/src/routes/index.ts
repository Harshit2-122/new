import { Router, type IRouter } from "express";
import healthRouter from "./health";
import kundaliRouter from "./kundali";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/kundali", kundaliRouter);

export default router;
