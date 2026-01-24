import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { router } from './app/routes';
import path from "path";
import passport from "passport";
import config from "./config";
import "./config/passport";

const app: Application = express();
app.use(cookieParser());
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);
app.use(passport.initialize());
app.use(cors({
    origin: [config.FRONTEND_URL as string],
    credentials: true,
    // allowedHeaders: ["Content-Type", "Authorization"],
}));
//parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.get('/', (req: Request, res: Response) => {
    res.send({
        Message: "Colourrose Backend is running successfully!"
    })
});

app.use('/api/v1', router);

// app.use(globalErrorHandler);

app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "API NOT FOUND!",
        error: {
            path: req.originalUrl,
            message: "Your requested path is not found!"
        }
    })
})

export default app;