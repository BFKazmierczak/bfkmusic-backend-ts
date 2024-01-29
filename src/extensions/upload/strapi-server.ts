import path from "path";
import waveform from "waveform-node";

import uploadService from "./services";

export default (plugin) => {
  plugin.contentTypes.file.lifecycles = {
    async afterCreate(ctx) {
      const file = ctx.result;

      const rootDir = path.resolve(__dirname, "../../../..");
      const filePath = path.join(rootDir, "public", file.url);

      try {
        const newWaveform = await strapi.entityService.create(
          "api::waveform.waveform",
          {
            data: {
              peaks: null,
              file: file.id,
            },
            populate: "file",
          }
        );

        const duration = await uploadService.calculateDuration(file);

        await strapi.db.query("plugin::upload.file").update({
          where: { id: file.id },
          data: { duration, waveform: newWaveform.id },
        });

        waveform.getWaveForm(filePath, {}, (error, peaks: number[]) => {
          if (error) {
            console.log("ERROR:", error);
            return;
          }
          
          await strapi.entityService.update(
            "api::waveform.waveform",
            newWaveform.id,
            {
              data: {
                peaks,
              },
            }
          );
        });

        // ctx.send(sanitize.(updatedFile, { model: strapi.models.file }));
      } catch (err) {
        console.error(err);
        // ctx.throw(500, "Error calculating duration");
      }
    },
  };

  return plugin;
};
