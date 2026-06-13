//it is a wrapper which we will use may time to avoid any error that can arrive
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).
    catch((err) => next(err));
  };
};

export { asyncHandler };
