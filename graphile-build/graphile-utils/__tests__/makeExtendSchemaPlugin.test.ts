import { makePgService } from "@dataplan/pg/adaptors/pg";
import { constant, grafast } from "grafast";
import type { GraphQLObjectType } from "grafast/graphql";
import { GraphQLScalarType, printSchema } from "grafast/graphql";
import { buildSchema, QueryPlugin } from "graphile-build";
import pg, { type Pool } from "pg";
import { makeSchema } from "postgraphile";
import PostGraphileAmberPreset from "postgraphile/presets/amber";

import { EXPORTABLE, gql, makeExtendSchemaPlugin } from "../src/index.js";

let pgPool: Pool | null = null;

beforeAll(() => {
  pgPool = new pg.Pool({
    connectionString: process.env.TEST_DATABASE_URL,
  });
});

afterAll(() => {
  if (pgPool) {
    pgPool.end();
    pgPool = null;
  }
});

const ExtendPlugin = makeExtendSchemaPlugin({
  typeDefs: gql`
    scalar Scalar1
    scalar Scalar2
    extend type Query {
      scalar1: Scalar1
      scalar2: Scalar2
    }
  `,
  plans: {
    Query: {
      scalar1() {
        return constant("hello world");
      },
      scalar2() {
        return constant("hello world");
      },
    },
    Scalar1: new GraphQLScalarType({
      name: "SomethingElse",
      serialize: EXPORTABLE(
        () =>
          function serialize() {
            return 1;
          },
        [],
      ),
      parseLiteral: EXPORTABLE(
        () =>
          function parseLiteral() {
            return 1;
          },
        [],
      ),
      parseValue: EXPORTABLE(
        () =>
          function parseValue() {
            return 1;
          },
        [],
      ),
    }),
    Scalar2: {
      serialize: EXPORTABLE(
        () =>
          function serialize() {
            return 2;
          },
        [],
      ),
      parseLiteral: EXPORTABLE(
        () =>
          function parseLiteral() {
            return 2;
          },
        [],
      ),
      parseValue: EXPORTABLE(
        () =>
          function parseValue() {
            return 2;
          },
        [],
      ),
    },
  },
});

it("supports scalars", async () => {
  const schema = buildSchema({
    plugins: [QueryPlugin, ExtendPlugin],
  });
  const result = await grafast({
    schema,
    source: /* GraphQL */ `
      {
        scalar1
        scalar2
      }
    `,
  });
  expect(result).toEqual({
    data: {
      scalar1: 1,
      scalar2: 2,
    },
  });
});

it("infers scope", async () => {
  const preset: GraphileConfig.Preset = {
    extends: [PostGraphileAmberPreset],
    plugins: [
      makeExtendSchemaPlugin({
        typeDefs: gql`
          extend type User {
            favouritePets: PetConnection
          }
        `,
      }),
    ],
    pgServices: [
      makePgService({
        pool: pgPool!,
        schemas: ["graphile_utils"],
      }),
    ],
  };
  const { schema } = await makeSchema(preset);
  expect(printSchema(schema)).toMatchSnapshot();
  const t = schema.getType("User") as GraphQLObjectType;
  const f = t.getFields().favouritePets;
  expect(f.args.length).toBeGreaterThan(5);
});

it("enables overriding scope", async () => {
  const preset: GraphileConfig.Preset = {
    extends: [PostGraphileAmberPreset],
    plugins: [
      makeExtendSchemaPlugin({
        typeDefs: gql`
          extend type User {
            favouritePets: PetConnection
          }
        `,
        plans: {
          User: {
            favouritePets: {
              scope: {
                pgTypeResource: undefined,
                isPgFieldConnection: undefined,
              },
            },
          },
        },
      }),
    ],
    pgServices: [
      makePgService({
        pool: pgPool!,
        schemas: ["graphile_utils"],
      }),
    ],
  };
  const { schema } = await makeSchema(preset);
  expect(printSchema(schema)).toMatchSnapshot();
  const t = schema.getType("User") as GraphQLObjectType;
  const f = t.getFields().favouritePets;
  expect(f.args.length).toBe(0);
});

it("supports unary steps in loadOne", async () => {
  const preset: GraphileConfig.Preset = {
    extends: [PostGraphileAmberPreset],
    plugins: [
      makeExtendSchemaPlugin((build) => {
        const { loadOne } = build.grafast;
        const { users } = build.input.pgRegistry.pgResources;
        return {
          typeDefs: gql`
            extend type User {
              uppercaseName: String
            }
          `,
          plans: {
            User: {
              uppercaseName($user) {
                const $name = $user.get("name");
                const $executorContext = users.executor.context();
                return loadOne(
                  $name,
                  $executorContext,
                  async (names, { unary: executorContext }) => {
                    const { withPgClient, pgSettings } = executorContext;
                    const { rows } = await withPgClient(pgSettings, (client) =>
                      client.query<{ i: string; upper_name: string }>({
                        text: "select (i - 1)::text as i, upper(name) as upper_name from json_array_elements_text($1::json) with ordinality as el(name, i)",
                        values: [JSON.stringify(names)],
                      }),
                    );
                    return names.map(
                      (_, i) => rows.find((r) => r.i === String(i))?.upper_name,
                    );
                  },
                );
              },
            },
          },
        };
      }),
    ],
    pgServices: [
      makePgService({
        pool: pgPool!,
        schemas: ["graphile_utils"],
      }),
    ],
  };
  const { schema, resolvedPreset } = await makeSchema(preset);
  const result = await grafast({
    schema,
    resolvedPreset,
    requestContext: {},
    source: /* GraphQL */ `
      {
        allUsers(first: 3) {
          nodes {
            name
            uppercaseName
          }
        }
      }
    `,
  });
  expect(result).toEqual({
    data: {
      allUsers: {
        nodes: [
          {
            name: "Alice",
            uppercaseName: "ALICE",
          },
          {
            name: "Bob",
            uppercaseName: "BOB",
          },
          {
            name: "Caroline",
            uppercaseName: "CAROLINE",
          },
        ],
      },
    },
  });
});
