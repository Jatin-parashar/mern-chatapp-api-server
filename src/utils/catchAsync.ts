// export default (fn) => {
//   return (req, res, next) => {
//     fn(req, res, next).catch(next);
//   };
// };

import { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncRequestHandler<Req extends Request = Request> = (
  req: Req,
  res: Response,
  next: NextFunction
) => Promise<void>;

const catchAsync = <Req extends Request = Request>(
  fn: AsyncRequestHandler<Req>
): RequestHandler => {
  return (req, res, next) => {
    // Type assertion is safe because fn expects Req, which is compatible
    fn(req as Req, res, next).catch(next);
  };
};

export default catchAsync;
