import { Strapi } from "@strapi/strapi";
import type * as Params from "@strapi/types/dist/modules/entity-service/params";
import uploadService from "./extensions/upload/services";
import hasRoleWrapper from "./middlewares/hasRoleWrapper";

interface SongParams
  extends Params.Pick<
    "api::song.song",
    | "fields"
    | "filters"
    | "_q"
    | "pagination:offset"
    | "sort"
    | "publicationState"
    | "plugin"
  > {}

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Strapi }) {
    const extensionService = strapi.service("plugin::graphql.extension");

    const { toEntityResponse, toEntityResponseCollection } = strapi.service(
      "plugin::graphql.format"
    ).returnTypes;

    const { transformArgs } = strapi
      .plugin("graphql")
      .service("builders").utils;

    async function resolveComments(parent, args, context) {
      const transformedArgs = transformArgs(args, {
        contentType: strapi.contentTypes["api::comment.comment"],
        usePagination: true,
      });

      const userId = context.state.user.id;

      console.log("inside comments resolver");

      transformedArgs.filters = {
        ...transformedArgs.filters,
        user: {
          id: { $eq: userId },
        },
      };

      const data = await strapi.entityService.findMany("api::comment.comment", {
        ...transformedArgs,
        populate: "user",
      });

      const response = toEntityResponseCollection(data, {
        args,
        resourceUID: "api::comment.comment",
      });

      return response;
    }

    async function resolveSongs(parent, args, context) {
      const transformedArgs = transformArgs(args, {
        contentType: strapi.contentTypes["api::song.song"],
        usePagination: true,
      }) as SongParams;

      const userId = context.state.user?.id;

      const isLibraryQuery = args?.filters?.inLibrary;

      const data = await strapi.entityService.findMany("api::song.song", {
        ...transformedArgs,
        populate: "users",
      });

      const modifiedData = data
        .map((song) => ({
          ...song,
          inLibrary: song.users.some((user) => user.id === userId),
        }))
        .filter((song) =>
          isLibraryQuery === true ? song.inLibrary === true : song
        );

      const response = toEntityResponseCollection(modifiedData, {
        args,
        resourceUID: "api::song.song",
      });

      return response;
    }

    // const { formatGraphqlError } = strapi.plugin("graphql").formatGraphqlError;

    extensionService.use(({ strapi }: { strapi: Strapi }) => ({
      typeDefs: `
        type Query {
          comments: CommentEntityResponseCollection
        }

        type Mutation {
          createComment(data: CustomCommentInput!): CommentEntityResponse

          addSongToLibrary(songId: Int!): SongEntityResponse

          calculateFileDuration(fileId: Int!): UploadFileEntityResponse
        }

        type Song {
          inLibrary: Boolean
        }

        input CustomCommentInput {
          songId: Int!
          fileId: Int!
          timeRange: TimeRange!
          content: String!
        }

        input SongFiltersInput {
          inLibrary: Boolean
        }

        input AddSongInput {
          songId: Int!
        }

        input TimeRange {
          from: Int!
          to: Int!
        }
      `,
      resolversConfig: {
        "Mutation.calculateFileDuration": {
          middlewares: [hasRoleWrapper("Admin")],
        },
      },
      resolvers: {
        Mutation: {
          createComment: {
            resolve: async (parent, args, context) => {
              const { id: userId } = context.state.user;

              const song = await strapi.entityService.findOne(
                "api::song.song",
                args.data.songId,
                {
                  populate: ["users", "audio"],
                }
              );

              if (!song) {
                throw new Error("There is no song with given ID.");
              }

              if (!song.users.some((user) => user.id === userId)) {
                throw new Error(
                  "You have no permissions to comment on this song."
                );
              }

              if (!song.audio.some((audio) => audio.id === args.data.fileId)) {
                throw new Error("No such audio file exists within this song.");
              }

              const timeFrom = args.data.timeRange.from;
              const timeTo = args.data.timeRange.to;
              const timeRange = `${timeFrom}:${timeTo}`;

              const newComment = await strapi.entityService.create(
                "api::comment.comment",
                {
                  data: {
                    ...args.data,
                    song: args.data.songId,
                    user: userId,
                    timeRange,
                    publishedAt: new Date(),
                  },
                }
              );

              const response = toEntityResponse(newComment, {
                resourceUID: "api::comment.comment",
              });

              return response;
            },
          },
          addSongToLibrary: {
            resolve: async (parent, args, context) => {
              const { id: userId } = context.state.user;
              const { songId } = args;

              const song = await strapi.entityService.findOne(
                "api::song.song",
                songId,
                {
                  populate: "users",
                }
              );

              if (!song) throw new Error("Couldn't find song with given ID.");

              if (song.users.some((user) => userId === user.id))
                throw new Error("This song is already in library.");

              const previousUsers = song.users.map((user) => user.id);

              const updatedSong = await strapi.entityService.update(
                "api::song.song",
                songId,
                {
                  data: { users: [...previousUsers, userId] },
                }
              );

              const response = toEntityResponse(updatedSong, {
                resourceUID: "api::song.song",
                args: {
                  inLibrary: true,
                },
              });

              response.value.inLibrary = true;
              return response;
            },
          },
          calculateFileDuration: {
            resolve: async (parent, args, context) => {
              const user = context.state.user;

              const { fileId } = args;

              const file = await strapi.entityService.findOne(
                "plugin::upload.file",
                fileId
              );

              if (!file) throw new Error("File couldn't be found.");

              const calculatedDuration = await uploadService.calculateDuration(
                file
              );

              const updatedFile = strapi.entityService.update(
                "plugin::upload.file",
                fileId,
                {
                  data: {
                    duration: calculatedDuration as number,
                  },
                }
              );

              const response = toEntityResponse(updatedFile, {
                resourceUID: "plugin::upload.file",
              });

              return response;
            },
          },
        },
        Query: {
          comments: {
            resolve: resolveComments,
          },
          songs: {
            resolve: resolveSongs,
          },
        },
      },
    }));
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/*{ strapi }*/) {},
};
