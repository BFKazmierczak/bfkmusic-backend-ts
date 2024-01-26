import hasRole from "./hasRole";

export default (role) => {
  return async (next, parent, args, ctx, info) => {
    await hasRole(next, parent, args, ctx, info, role);
  };
};
