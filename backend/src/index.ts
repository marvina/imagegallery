// import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) { },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: any }) {
    // Bootstrap: Set public permissions for our API
    try {
      const publicRole = await strapi.db
        .query("plugin::users-permissions.role")
        .findOne({
          where: { type: "public" },
          populate: ["permissions"],
        });

      if (!publicRole) {
        strapi.log.warn("Public role not found. Skipping permission bootstrap.");
        return;
      }

      const permissionsToEnable = [
        "api::project.project.find",
        "api::project.project.findOne",
        "api::tag.tag.find",
        "api::tag.tag.findOne",
        "api::author.author.find",
        "api::author.author.findOne",
      ];

      for (const action of permissionsToEnable) {
        const hasPermission = publicRole.permissions.some(
          (p: any) => p.action === action
        );

        if (!hasPermission) {
          await strapi.db.query("plugin::users-permissions.permission").create({
            data: {
              action,
              role: publicRole.id,
            },
          });
          strapi.log.info(`Enabled public permission: ${action}`);
        }
      }
    } catch (error) {
      strapi.log.error("Bootstrap error:", error);
    }
  },
};
