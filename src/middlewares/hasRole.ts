export default async (next, parent, args, ctx, info, roleName) => {
  const userId = ctx.state.user.id; // user ID that makes the query

  const user = await strapi.entityService.findOne(
    "plugin::users-permissions.user",
    userId,
    {
      populate: "role",
    }
  );

  if (user.role.name !== roleName) throw new Error("Forbidden access");

  return next(parent, args, ctx, info);
};
