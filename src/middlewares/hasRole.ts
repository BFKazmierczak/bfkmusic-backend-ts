export default (next, parent, args, ctx, info, roleName) => {
  const user = ctx.state.user.id; // user ID that makes the query

  console.log({ user });
  console.log(roleName);

  throw new Error("You are not allowed to see this");
  return next(parent, args, ctx, info);
};
