import { NextFunction, Request, Response } from "express";

import * as Yup from "yup";
import { ObjectShape } from "yup/lib/object";

export default (shape: object) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await Yup.object()
        .shape(shape as ObjectShape)
        .noUnknown(true)
        .strict()
        .validate(req.body);
    } catch (e: unknown) {
      return res
        .status(400)
        .json({ msg: `${e}`.replaceAll("ValidationError: ", "") })
        .end();
    }
    next();
  };
};
